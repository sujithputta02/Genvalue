import crypto from "crypto";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { auth, adminAuth } from "../config/firebase.js";
import { prisma } from "../config/database.js";
import { resolveLmsSignupRole, LMS_STUDENT_ROLE, isLmsStudentRole } from "../constants/lmsRoles.js";
import { sendBrevoEmail } from "../services/brevoService.js";
import {
  buildAdminOtpEmailHtml,
  buildAdminOtpEmailText,
} from "../templates/adminOtpEmail.js";
import { createAdminSessionToken } from "../utils/adminSession.js";
import {
  normalizeEmail,
  sanitizeText,
  validatePassword,
} from "../utils/inputValidation.js";
import { getFirebaseAuthUserStatus } from "../utils/firebaseAdminAuth.js";
import { insertUserRemovalLog } from "../utils/ensureUserRemovalLogSchema.js";
import { validateBase64Image } from "../utils/secureImageUpload.js";

const OTP_EXPIRY_MINUTES = 10;

/**
 * Remove an LMS student row whose Firebase Auth user is already gone,
 * so the email can register again.
 */
async function purgeOrphanStudentByEmail(existingUser, reason) {
  if (!existingUser || !isLmsStudentRole(existingUser.role)) {
    return false;
  }

  await prisma.session.deleteMany({ where: { userId: existingUser.id } });

  try {
    await insertUserRemovalLog({
      userId: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      reason,
      removedById: null,
      removedByEmail: "system:firebase-orphan-reclaim",
    });
  } catch (logError) {
    console.warn(
      "[auth] orphan purge audit log skipped:",
      logError?.message ?? logError
    );
  }

  await prisma.user.delete({ where: { id: existingUser.id } });
  console.info(
    `[auth] Purged orphan LMS student ${existingUser.email} (${existingUser.id}): ${reason}`
  );
  return true;
}

async function saveAdminOtp(email, otp, expiresAt) {
  const existing = await prisma.adminOTP.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return prisma.adminOTP.update({
      where: { id: existing.id },
      data: { otp, expiresAt, verified: false },
    });
  }

  return prisma.adminOTP.create({
    data: { email, otp, expiresAt },
  });
}

async function findAdminOtpByEmail(email) {
  return prisma.adminOTP.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });
}

async function deleteAdminOtpsByEmail(email) {
  await prisma.adminOTP.deleteMany({ where: { email } });
}

/**
 * Register a new user with email and password
 * Creates user in Firebase Auth AND CockroachDB
 */
export const registerUser = async (req, res) => {
  try {
    const { email: rawEmail, password, name: rawName } = req.body;
    const email = normalizeEmail(rawEmail);
    const name = sanitizeText(rawName, 120);
    const role = resolveLmsSignupRole(req.body?.role);

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Valid email, password, and name are required",
      });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.ok) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.message,
      });
    }

    // Check if user already exists in CockroachDB
    let existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      const firebaseStatus = await getFirebaseAuthUserStatus(
        adminAuth,
        existingUser.firebaseUid
      );

      // Firebase Auth user was deleted (e.g. console) — clear LMS orphan so email can re-register
      if (firebaseStatus === "missing" && isLmsStudentRole(existingUser.role)) {
        await purgeOrphanStudentByEmail(
          existingUser,
          "Auto-removed orphan LMS account after Firebase Authentication user was deleted; email reclaimed for signup."
        );
        existingUser = null;
      } else if (firebaseStatus === "unavailable" && isLmsStudentRole(existingUser.role)) {
        // Cannot probe Firebase Admin; try creating the Auth user.
        // If email is free in Firebase, Auth was already deleted — purge LMS orphan and continue.
        try {
          const probeCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          await purgeOrphanStudentByEmail(
            existingUser,
            "Auto-removed orphan LMS account after Firebase Authentication user was deleted; email reclaimed for signup."
          );
          existingUser = null;

          // Auth user already created above — finish LMS provisioning and return
          const firebaseUser = probeCredential.user;
          const dbUser = await prisma.user.create({
            data: {
              email: email.toLowerCase(),
              name: name,
              role: role,
              firebaseUid: firebaseUser.uid,
              emailVerified: firebaseUser.emailVerified,
              authProvider: "EMAIL",
              linkedProviders: ["EMAIL"],
              lastLoginAt: new Date(),
            },
          });

          const idToken = await firebaseUser.getIdToken();
          await prisma.session.create({
            data: {
              userId: dbUser.id,
              firebaseToken: idToken,
              deviceInfo: "LMS_PORTAL",
              expiresAt: new Date(Date.now() + 3600 * 1000),
            },
          });

          return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
              uid: dbUser.id,
              firebaseUid: dbUser.firebaseUid,
              email: dbUser.email,
              name: dbUser.name,
              role: dbUser.role,
              authProvider: dbUser.authProvider,
              idToken: idToken,
            },
          });
        } catch (probeError) {
          if (probeError?.code !== "auth/email-already-in-use") {
            throw probeError;
          }
          // Firebase still has this email — fall through to linking / already-registered
        }
      }
    }

    if (existingUser) {
      // If user exists with Google OAuth, link the email/password method
      if (existingUser.authProvider === "GOOGLE") {
        // Create Firebase email/password account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const firebaseUser = userCredential.user;

        // Update existing user to link both auth methods
        const updatedUser = await prisma.user.update({
          where: { email: email.toLowerCase() },
          data: {
            firebaseUid: firebaseUser.uid,
            authProvider: "BOTH",
            linkedProviders: ["EMAIL", "GOOGLE"],
            emailVerified: firebaseUser.emailVerified,
            lastLoginAt: new Date(),
          },
        });

        // Create session in CockroachDB
        const idToken = await firebaseUser.getIdToken();
        const session = await prisma.session.create({
          data: {
            userId: updatedUser.id,
            firebaseToken: idToken,
            deviceInfo: "LMS_PORTAL",
            expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
          },
        });

        return res.status(200).json({
          success: true,
          message: "Account linked successfully! You can now login with email or Google.",
          data: {
            uid: updatedUser.id,
            firebaseUid: updatedUser.firebaseUid,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            authProvider: updatedUser.authProvider,
            idToken: idToken,
          },
        });
      }

      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    // Note: Custom claims require Firebase Admin SDK with credentials
    // For now, role is stored in CockroachDB and returned in API responses
    // To enable custom claims, add Firebase service account key

    // Create user in CockroachDB
    const dbUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name,
        role: role,
        firebaseUid: firebaseUser.uid,
        emailVerified: firebaseUser.emailVerified,
        authProvider: "EMAIL",
        linkedProviders: ["EMAIL"],
        lastLoginAt: new Date(),
      },
    });

    // Create session
    const idToken = await firebaseUser.getIdToken();
    const session = await prisma.session.create({
      data: {
        userId: dbUser.id,
        firebaseToken: idToken,
        deviceInfo: "LMS_PORTAL",
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
      },
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        uid: dbUser.id,
        firebaseUid: dbUser.firebaseUid,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        authProvider: dbUser.authProvider,
        idToken: idToken,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    
    let message = "Registration failed";
    if (error.code === "auth/email-already-in-use") {
      message = "Email already in use";
    } else if (error.code === "auth/weak-password") {
      message = "Password is too weak";
    } else if (error.code === "auth/invalid-email") {
      message = "Invalid email address";
    }

    res.status(400).json({
      success: false,
      message: message,
      error: error.message,
    });
  }
};

/**
 * Login user with email and password
 * Authenticates with Firebase and syncs with CockroachDB
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Check if user exists in CockroachDB
    let dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!dbUser || !dbUser.firebaseUid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // For backend-side authentication, we cannot directly verify passwords with Firebase
    // The frontend should handle Firebase authentication and pass the idToken
    // This endpoint is for compatibility, but ideally the frontend sends the token
    
    // Instead, create a custom token for the user using Firebase Admin SDK
    try {
      const customToken = await adminAuth.createCustomToken(dbUser.firebaseUid, {
        role: dbUser.role,
      });

      // Create session in CockroachDB
      const session = await prisma.session.create({
        data: {
          userId: dbUser.id,
          firebaseToken: customToken,
          deviceInfo: "LMS_PORTAL",
          expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
        },
      });

      // Update last login time
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { lastLoginAt: new Date() },
      });

      return res.status(200).json({
        success: true,
        message: "Login successful (token-based)",
        data: {
          uid: dbUser.id,
          firebaseUid: dbUser.firebaseUid,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          authProvider: dbUser.authProvider,
          customToken: customToken,
        },
      });
    } catch (tokenError) {
      console.error("Custom token creation error:", tokenError);
      return res.status(500).json({
        success: false,
        message: "Token generation failed",
        error: tokenError.message,
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    
    let message = "Login failed";
    if (error.message?.includes("TableDoesNotExist")) {
      message = "Database connection error - tables not initialized";
    }

    res.status(401).json({
      success: false,
      message: message,
      error: error.message,
    });
  }
};

/**
 * Handle Google OAuth login/signup with account linking
 * This endpoint receives the Firebase ID token from Google OAuth
 * and syncs/links the account in CockroachDB
 */
export const handleGoogleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Firebase ID token is required and must be a valid string",
      });
    }

    // Verify Firebase ID token - use direct JWT decode since Admin SDK requires credentials
    let decodedToken;
    
    try {
      // Direct JWT decode (works without Firebase service account)
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        throw new Error("Invalid JWT format - must have 3 parts");
      }
      
      const [header, payload, signature] = parts;
      if (!payload || typeof payload !== 'string') {
        throw new Error("JWT payload is missing or invalid");
      }
      
      // Add padding if needed for base64 decoding
      const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
      const decoded = Buffer.from(padded, 'base64').toString('utf8');
      decodedToken = JSON.parse(decoded);
      
      console.log("Token decoded successfully using JWT decode");
    } catch (decodeError) {
      console.error("Token decode error:", decodeError.message);
      return res.status(401).json({
        success: false,
        message: "Invalid Firebase ID token format",
        error: decodeError.message,
      });
    }

    const firebaseUid = decodedToken.uid || decodedToken.user_id || decodedToken.sub;
    if (!decodedToken || (!firebaseUid && !decodedToken.email)) {
      return res.status(401).json({
        success: false,
        message: "Failed to decode token or missing user identity",
      });
    }
    
    const { email, name, picture, email_verified } = decodedToken;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email not found in Google account",
      });
    }

    // Check if user exists in CockroachDB
    let dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    }).catch(error => {
      console.error("Database query error:", error);
      throw new Error("Database connection error");
    });

    if (dbUser) {
      // User exists — sync Firebase UID (needed after Auth console delete + Google re-signup)
      // and link Google when the LMS account was email-only.
      if (dbUser.authProvider === "EMAIL") {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            firebaseUid: firebaseUid,
            googleId: decodedToken.sub || firebaseUid,
            googlePhotoUrl: picture,
            authProvider: "BOTH",
            linkedProviders: ["EMAIL", "GOOGLE"],
            lastLoginAt: new Date(),
          },
        });
      } else {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            firebaseUid: firebaseUid,
            googleId: decodedToken.sub || firebaseUid,
            lastLoginAt: new Date(),
            googlePhotoUrl: picture,
          },
        });
      }
    } else {
      // New Google user - create account
      dbUser = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || email.split("@")[0],
          firebaseUid: firebaseUid,
          googleId: decodedToken.sub || firebaseUid,
          googlePhotoUrl: picture,
          role: LMS_STUDENT_ROLE,
          emailVerified: email_verified || false,
          authProvider: "GOOGLE",
          linkedProviders: ["GOOGLE"],
          lastLoginAt: new Date(),
        },
      });
    }

    // Create session in CockroachDB
    const session = await prisma.session.create({
      data: {
        userId: dbUser.id,
        firebaseToken: idToken,
        deviceInfo: "LMS_PORTAL",
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
      },
    });

    res.status(200).json({
      success: true,
      message: dbUser.authProvider === "BOTH" 
        ? "Google account linked successfully!" 
        : "Login successful",
      data: {
        uid: dbUser.id,
        firebaseUid: dbUser.firebaseUid,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        authProvider: dbUser.authProvider,
        googlePhotoUrl: dbUser.googlePhotoUrl,
        idToken: idToken,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Google authentication failed",
      error: error.message,
    });
  }
};

/**
 * Verify user token
 */
export const verifyUserToken = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    // Fast synchronous JWT decode first
    let decodedToken = null;
    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const padded = parts[1] + '='.repeat((4 - parts[1].length % 4) % 4);
        decodedToken = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
      }
    } catch (decodeErr) {
      console.warn("Fast decode warning:", decodeErr.message);
    }

    if (!decodedToken) {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    }

    const targetUid = decodedToken.uid || decodedToken.user_id || decodedToken.sub;
    const isValidUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    // Get user data from CockroachDB
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(targetUid ? [
            { firebaseUid: targetUid },
            { googleId: targetUid },
            ...(isValidUuid(targetUid) ? [{ id: targetUid }] : [])
          ] : []),
          ...(decodedToken.email ? [{ email: decodedToken.email.toLowerCase() }] : []),
        ],
      },
    });

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Token is valid",
      data: {
        uid: dbUser.id,
        firebaseUid: dbUser.firebaseUid,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        authProvider: dbUser.authProvider,
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};

/**
 * Get current user profile
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        authProvider: true,
        linkedProviders: true,
        googlePhotoUrl: true,
        emailVerified: true,
        bio: true,
        profilePicture: true,
        phoneNumber: true,
        country: true,
        timeZone: true,
        skills: true,
        linkedinUrl: true,
        githubUrl: true,
        portfolioUrl: true,
        huggingFaceUrl: true,
        kaggleUrl: true,
        twitterUrl: true,
        preferredLanguage: true,
        emailNotifications: true,
        publicProfile: true,
        membershipPlan: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Ensure all fields have default values
    const profileData = {
      ...dbUser,
      bio: dbUser.bio || "",
      profilePicture: dbUser.profilePicture || null,
      phoneNumber: dbUser.phoneNumber || "",
      country: dbUser.country || "",
      timeZone: dbUser.timeZone || "",
      skills: dbUser.skills || [],
      linkedinUrl: dbUser.linkedinUrl || "",
      githubUrl: dbUser.githubUrl || "",
      portfolioUrl: dbUser.portfolioUrl || "",
      huggingFaceUrl: dbUser.huggingFaceUrl || "",
      kaggleUrl: dbUser.kaggleUrl || "",
      twitterUrl: dbUser.twitterUrl || "",
      preferredLanguage: dbUser.preferredLanguage || "en",
      emailNotifications: dbUser.emailNotifications !== undefined ? dbUser.emailNotifications : true,
      publicProfile: dbUser.publicProfile !== undefined ? dbUser.publicProfile : false,
      membershipPlan: dbUser.membershipPlan || "FREE",
    };

    res.status(200).json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
      error: error.message,
    });
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      name,
      bio,
      phoneNumber,
      country,
      timeZone,
      skills,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
      huggingFaceUrl,
      kaggleUrl,
      twitterUrl,
      preferredLanguage,
      emailNotifications,
      publicProfile,
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        bio,
        phoneNumber,
        country,
        timeZone,
        skills,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        huggingFaceUrl,
        kaggleUrl,
        twitterUrl,
        preferredLanguage,
        emailNotifications,
        publicProfile,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        bio: true,
        skills: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

/**
 * Logout user
 */
export const logoutUser = async (req, res) => {
  try {
    await signOut(auth);
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message,
    });
  }
};

/**
 * Send OTP for admin login
 */
export const sendAdminOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is authorized for admin access
    let authorizedAdmin;
    try {
      authorizedAdmin = await prisma.authorizedAdmin.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (dbError) {
      console.error(
        "Database error checking authorized admin:",
        dbError.message
      );
      return res.status(500).json({
        success: false,
        message: "Database error. Please try again later.",
        error: process.env.NODE_ENV === "development" ? dbError.message : undefined,
      });
    }

    if (!authorizedAdmin) {
      return res.status(401).json({
        success: false,
        message:
          "Unauthorized. This email is not authorized for admin access.",
      });
    }

    if (!authorizedAdmin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. This admin account is inactive.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database
    try {
      await saveAdminOtp(
        normalizedEmail,
        otp,
        new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
      );
    } catch (dbError) {
      console.error("Database error saving OTP:", dbError.message);
      return res.status(500).json({
        success: false,
        message: "Failed to generate OTP. Please try again.",
        error: process.env.NODE_ENV === "development" ? dbError.message : undefined,
      });
    }

    // Send email via Brevo
    const emailResult = await sendBrevoEmail({
      to: {
        email: normalizedEmail,
        name: authorizedAdmin.name || normalizedEmail.split("@")[0],
      },
      subject: "GenValue Admin Portal — Your Sign-in Code",
      htmlContent: buildAdminOtpEmailHtml({
        otp,
        email: normalizedEmail,
        expiresMinutes: OTP_EXPIRY_MINUTES,
      }),
      textContent: buildAdminOtpEmailText({
        otp,
        email: normalizedEmail,
        expiresMinutes: OTP_EXPIRY_MINUTES,
      }),
    });

    if (!emailResult.ok) {
      console.error("Brevo OTP email failed:", emailResult.message || emailResult);

      // Never expose OTP — discard it if email delivery fails
      await deleteAdminOtpsByEmail(normalizedEmail);

      return res.status(502).json({
        success: false,
        message: "Failed to send OTP to your email. Please try again in a moment.",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully. Check your email.",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Verify admin OTP
 */
export const verifyAdminOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email?.trim() || !otp?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const authorizedAdmin = await prisma.authorizedAdmin.findUnique({
      where: { email: normalizedEmail },
    });

    if (!authorizedAdmin?.isActive) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized email address",
      });
    }

    const otpRecord = await findAdminOtpByEmail(normalizedEmail);

    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        message: "OTP not found or expired. Please request a new one.",
      });
    }

    if (new Date(otpRecord.expiresAt) < new Date()) {
      await deleteAdminOtpsByEmail(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (otpRecord.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    const sessionRole = authorizedAdmin.isSuperAdmin ? "SUPER_ADMIN" : "ADMIN";
    const displayName = authorizedAdmin.name || normalizedEmail.split("@")[0];

    let dbUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: displayName,
          role: "ADMIN",
          firebaseUid: `admin-${crypto.randomUUID()}`,
          emailVerified: true,
          authProvider: "EMAIL",
          linkedProviders: ["EMAIL"],
          lastLoginAt: new Date(),
        },
      });
    } else {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          name: displayName,
          lastLoginAt: new Date(),
        },
      });
    }

    await deleteAdminOtpsByEmail(normalizedEmail);

    const adminToken = createAdminSessionToken({
      userId: dbUser.id,
      email: normalizedEmail,
      role: sessionRole,
      name: displayName,
      isSuperAdmin: authorizedAdmin.isSuperAdmin,
    });

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: {
        uid: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: sessionRole,
        isSuperAdmin: authorizedAdmin.isSuperAdmin,
        adminToken,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "OTP verification failed",
      error: error.message,
    });
  }
};


/**
 * Upload profile picture to Cloudinary
 */
export const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { image } = req.body; // Base64 image string

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image data is required",
      });
    }

    const imageCheck = validateBase64Image(image);
    if (!imageCheck.ok) {
      return res.status(400).json({
        success: false,
        message: imageCheck.message,
      });
    }

    // Import cloudinary helper
    const { uploadBase64Image } = await import("../config/cloudinary.js");

    // Upload to Cloudinary with user ID as public ID (non-executable remote storage)
    const uploadResult = await uploadBase64Image(
      imageCheck.dataUri,
      "genvalue-academy/profile-pictures",
      `user-${userId}`
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload image",
        error: uploadResult.error,
      });
    }

    // Update user profile with new picture URL
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profilePicture: uploadResult.url,
      },
      select: {
        id: true,
        profilePicture: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      data: {
        profilePicture: updatedUser.profilePicture,
        cloudinary: {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
        },
      },
    });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload profile picture",
      error: error.message,
    });
  }
};


/**
 * Delete profile picture
 */
export const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get current user to check if they have a profile picture
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePicture: true },
    });

    if (user?.profilePicture) {
      // Extract public ID from Cloudinary URL and delete from Cloudinary
      // Example URL: https://res.cloudinary.com/x6nyauiu/image/upload/v123456/genvalue-academy/profile-pictures/user-123.jpg
      const urlParts = user.profilePicture.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex !== -1 && urlParts.length > uploadIndex + 2) {
        const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ''); // Remove extension
        
        const { deleteImage } = await import("../config/cloudinary.js");
        await deleteImage(publicId);
      }
    }

    // Update user profile to remove picture URL
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profilePicture: null,
      },
      select: {
        id: true,
        profilePicture: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile picture deleted successfully",
      data: {
        profilePicture: updatedUser.profilePicture,
      },
    });
  } catch (error) {
    console.error("Delete profile picture error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete profile picture",
      error: error.message,
    });
  }
};
