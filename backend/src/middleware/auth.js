import { adminAuth } from "../config/firebase.js";
import { prisma } from "../config/database.js";
import { LMS_STUDENT_ROLE } from "../constants/lmsRoles.js";
import { verifyAdminSessionToken } from "../utils/adminSession.js";
import {
  firebaseAdminCredentialsLoaded,
  probeFirebaseAdminAuth,
  setFirebaseAuthUserDisabled,
} from "../utils/firebaseAdminAuth.js";
import {
  probeFirebasePublicKeyVerification,
  verifyFirebaseIdTokenPublic,
} from "../utils/firebaseIdTokenPublicVerify.js";

/** Admin portal roles that can manage LMS content */
export function hasStaffAccess(user) {
  if (!user) return false;
  if (user.isSuperAdmin || user.role === "SUPER_ADMIN") return true;
  return user.role === "ADMIN" || user.role === "INSTRUCTOR";
}

/** Stricter admin-only actions (create/delete courses, announcements, etc.) */
export function hasAdminAccess(user) {
  if (!user) return false;
  if (user.isSuperAdmin || user.role === "SUPER_ADMIN") return true;
  return user.role === "ADMIN";
}

/**
 * Middleware to verify Firebase ID token
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    const idToken = authHeader.split("Bearer ")[1];

    if (!idToken || idToken.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Empty token",
      });
    }

    // LMS student routes reject admin OTP tokens — use Firebase sign-in for the portal
    if (req.authSource === "lms") {
      const adminPayload = verifyAdminSessionToken(idToken);
      if (adminPayload) {
        return res.status(403).json({
          success: false,
          message:
            "Admin session cannot submit from the student portal. Sign in with Google in the LMS, or use the admin Dispatch write tab.",
        });
      }
    }

    // Admin session tokens (OTP-based admin login)
    const adminPayload = verifyAdminSessionToken(idToken);
    if (adminPayload) {
      req.authSource = "admin";
      req.user = {
        uid: adminPayload.userId,
        email: adminPayload.email,
        role: adminPayload.role,
        name: adminPayload.name,
        isSuperAdmin: adminPayload.isSuperAdmin,
      };
      return next();
    }

    // Test mode: allow test-user token for development
    if (process.env.NODE_ENV === "development" && idToken === "test-user-token") {
      let testUser = await prisma.user.findFirst({
        where: { email: "test@genvalue.local" },
        select: { id: true, email: true, role: true, name: true },
      });

      if (!testUser) {
        testUser = await prisma.user.create({
          data: {
            email: "test@genvalue.local",
            name: "Test User",
            role: LMS_STUDENT_ROLE,
            firebaseUid: "test-firebase-uid",
          },
          select: { id: true, email: true, role: true, name: true },
        });
      }

      req.user = {
        uid: testUser.id,
        firebaseUid: "test-firebase-uid",
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      };

      return next();
    }

    let decodedToken = null;

    // Prefer Firebase Admin SDK; fall back to Google public x509 key verification
    if (firebaseAdminCredentialsLoaded) {
      try {
        await probeFirebaseAdminAuth(adminAuth);
        decodedToken = await adminAuth.verifyIdToken(idToken, true);
      } catch (adminError) {
        console.error("Firebase Admin verifyIdToken error:", adminError.message);
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid or expired token",
        });
      }
    } else {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      if (!projectId) {
        return res.status(503).json({
          success: false,
          message: "Authentication service unavailable. FIREBASE_PROJECT_ID is required.",
        });
      }

      try {
        decodedToken = await verifyFirebaseIdTokenPublic(idToken, projectId);
      } catch (publicVerifyError) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Public key verify failed, trying dev decode:", publicVerifyError.message);
          try {
            const parts = idToken.split(".");
            if (parts.length === 3) {
              const padded = parts[1] + "=".repeat((4 - (parts[1].length % 4)) % 4);
              decodedToken = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
              if (decodedToken.exp && decodedToken.exp * 1000 < Date.now()) {
                return res.status(401).json({
                  success: false,
                  message: "Unauthorized: Token expired",
                });
              }
            }
          } catch (decodeError) {
            console.warn("Dev JWT decode warning:", decodeError.message);
          }
        }

        if (!decodedToken) {
          console.error("Firebase token verification error:", publicVerifyError.message);
          return res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid or expired token",
          });
        }
      }
    }

    if (!decodedToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or expired token",
      });
    }

    // Extract user identifiers (Firebase tokens specify user_id or sub, or uid)
    const firebaseUid = decodedToken.uid || decodedToken.user_id || decodedToken.sub;
    const email = decodedToken.email;

    if (!firebaseUid && !email) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing user identifier in token",
      });
    }

    // Helper to validate UUID format for CockroachDB id column
    const isValidUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    // Get user from CockroachDB database matching firebaseUid, googleId, id, or email
    let dbUser = null;
    try {
      const searchConditions = [];
      if (firebaseUid) {
        searchConditions.push({ firebaseUid: firebaseUid });
        searchConditions.push({ googleId: firebaseUid });
        if (isValidUuid(firebaseUid)) {
          searchConditions.push({ id: firebaseUid });
        }
      }
      if (email) {
        searchConditions.push({ email: email.toLowerCase() });
      }

      dbUser = await prisma.user.findFirst({
        where: {
          OR: searchConditions,
        },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          firebaseUid: true,
          deactivatedUntil: true,
        },
      });

      // Auto-update firebaseUid if user was matched by email but firebaseUid was missing or out of sync
      if (dbUser && firebaseUid && dbUser.firebaseUid !== firebaseUid) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { firebaseUid: firebaseUid },
        }).catch(() => {});
      }

      // Auto-provision user if authenticated via Firebase but not in CockroachDB yet
      if (!dbUser && email) {
        dbUser = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name: decodedToken.name || email.split("@")[0] || "User",
            role: LMS_STUDENT_ROLE,
            firebaseUid: firebaseUid || `fb-${Date.now()}`,
            authProvider: "EMAIL",
            linkedProviders: ["EMAIL"],
          },
          select: {
            id: true,
            email: true,
            role: true,
            name: true,
            firebaseUid: true,
            deactivatedUntil: true,
          },
        });
      }
    } catch (dbError) {
      console.error("Database query error in verifyToken:", dbError.message);
      if (dbError.message?.includes("TableDoesNotExist")) {
        return res.status(503).json({
          success: false,
          message: "Database not initialized - tables missing",
          error: "TableDoesNotExist",
        });
      }
      throw dbError;
    }

    if (!dbUser) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found in database",
      });
    }

    // Temporary admin deactivation — expire automatically, otherwise block LMS access
    if (dbUser.deactivatedUntil) {
      const untilMs = new Date(dbUser.deactivatedUntil).getTime();
      if (untilMs > Date.now()) {
        return res.status(403).json({
          success: false,
          message: `Account is temporarily deactivated until ${new Date(untilMs).toISOString()}. Contact GenValue support if you believe this is an error.`,
          code: "ACCOUNT_DEACTIVATED",
          deactivatedUntil: new Date(untilMs).toISOString(),
        });
      }

      await prisma.user.update({
        where: { id: dbUser.id },
        data: { deactivatedUntil: null, deactivationReason: null },
      }).catch(() => {});

      setFirebaseAuthUserDisabled(adminAuth, dbUser.firebaseUid, false).catch(() => {});
      dbUser.deactivatedUntil = null;
    }

    // Attach resolved user info to request object
    req.user = {
      uid: dbUser.id,
      firebaseUid: firebaseUid || dbUser.firebaseUid,
      email: dbUser.email,
      role: dbUser.role,
      name: dbUser.name,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Authentication failed",
      error: error.message,
    });
  }
};

/**
 * Optional auth — attaches req.user when a valid token is present.
 */
export const optionalVerifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  return verifyToken(req, res, next);
};

/**
 * LMS portal auth — Firebase tokens only (rejects admin OTP session tokens).
 */
export const verifyLmsToken = async (req, res, next) => {
  req.authSource = "lms";
  return verifyToken(req, res, next);
};

/**
 * Middleware to check if user has specific role
 */
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    const userRole = req.user.role;

    if (hasStaffAccess(req.user) && !allowedRoles.includes("STUDENT")) {
      if (
        allowedRoles.includes("ADMIN") ||
        allowedRoles.includes("INSTRUCTOR") ||
        allowedRoles.includes("SUPER_ADMIN")
      ) {
        return next();
      }
    }

    if (hasAdminAccess(req.user) && allowedRoles.includes("ADMIN")) {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Insufficient permissions",
      });
    }

    next();
  };
};
