import { prisma } from "../config/database.js";
import { adminAuth } from "../config/firebase.js";
import { insertUserRemovalLog } from "../utils/ensureUserRemovalLogSchema.js";
import {
  revokeFirebaseAuthUser,
  setFirebaseAuthUserDisabled,
} from "../utils/firebaseAdminAuth.js";

const MIN_REASON_LENGTH = 10;
export const DEACTIVATION_DAY_OPTIONS = [7, 14, 30, 90];

/**
 * Temporarily deactivate a student (keeps LMS row; blocks sign-in until expiry or admin reactivate).
 */
export async function deactivateStudent(req, res) {
  try {
    const { userId } = req.params;
    const reason = String(req.body?.reason ?? "").trim();
    const days = Number(req.body?.days);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!DEACTIVATION_DAY_OPTIONS.includes(days)) {
      return res.status(400).json({
        success: false,
        message: `Deactivation days must be one of: ${DEACTIVATION_DAY_OPTIONS.join(", ")}`,
      });
    }

    if (reason.length < MIN_REASON_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Deactivation reason must be at least ${MIN_REASON_LENGTH} characters`,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        firebaseUid: true,
        deactivatedUntil: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "STUDENT") {
      return res.status(403).json({
        success: false,
        message: "Only student accounts can be temporarily deactivated",
      });
    }

    const deactivatedUntil = new Date();
    deactivatedUntil.setUTCDate(deactivatedUntil.getUTCDate() + days);

    const firebaseResult = await setFirebaseAuthUserDisabled(
      adminAuth,
      user.firebaseUid,
      true
    );

    await prisma.session.deleteMany({ where: { userId: user.id } });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        deactivatedUntil,
        deactivationReason: reason,
      },
      select: {
        id: true,
        email: true,
        name: true,
        deactivatedUntil: true,
        deactivationReason: true,
      },
    });

    const firebaseNote =
      firebaseResult.status === "disabled"
        ? " Firebase sign-in was disabled for the deactivation window."
        : firebaseResult.reason === "credentials_missing" ||
            firebaseResult.reason === "auth_unavailable"
          ? " LMS access blocked; configure Firebase Admin to also disable Firebase sign-in."
          : "";

    return res.json({
      success: true,
      message: `${user.name} (${user.email}) is deactivated for ${days} days until ${deactivatedUntil.toISOString()}.${firebaseNote}`,
      data: {
        userId: updated.id,
        email: updated.email,
        name: updated.name,
        days,
        deactivatedUntil: updated.deactivatedUntil?.toISOString() ?? null,
        deactivationReason: updated.deactivationReason,
        firebaseDisabled: firebaseResult.status === "disabled",
      },
    });
  } catch (error) {
    console.error("[adminUser] deactivateStudent error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to deactivate student account",
    });
  }
}

/**
 * Clear temporary deactivation early and re-enable Firebase Auth when possible.
 */
export async function reactivateStudent(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        firebaseUid: true,
        deactivatedUntil: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "STUDENT") {
      return res.status(403).json({
        success: false,
        message: "Only student accounts can be reactivated from this action",
      });
    }

    const firebaseResult = await setFirebaseAuthUserDisabled(
      adminAuth,
      user.firebaseUid,
      false
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        deactivatedUntil: null,
        deactivationReason: null,
      },
    });

    return res.json({
      success: true,
      message: `${user.name} (${user.email}) has been reactivated.`,
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        firebaseEnabled: firebaseResult.status === "enabled",
      },
    });
  } catch (error) {
    console.error("[adminUser] reactivateStudent error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reactivate student account",
    });
  }
}

/**
 * Suspend and permanently remove a student account (Firebase + DB) with audit reason.
 */
export async function removeStudent(req, res) {
  try {
    const { userId } = req.params;
    const reason = String(req.body?.reason ?? "").trim();

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (reason.length < MIN_REASON_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Removal reason must be at least ${MIN_REASON_LENGTH} characters`,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        firebaseUid: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "STUDENT") {
      return res.status(403).json({
        success: false,
        message: "Only student accounts can be removed from the roster",
      });
    }

    const firebaseResult = await revokeFirebaseAuthUser(adminAuth, user.firebaseUid);

    await prisma.session.deleteMany({ where: { userId: user.id } });

    await insertUserRemovalLog({
      userId: user.id,
      email: user.email,
      name: user.name,
      reason,
      removedById: req.admin?.userId ?? null,
      removedByEmail: req.admin?.email ?? null,
    });

    await prisma.user.delete({ where: { id: user.id } });

    const firebaseNote =
      firebaseResult.status === "revoked"
        ? " Firebase sign-in was revoked."
        : firebaseResult.reason === "credentials_missing" ||
            firebaseResult.reason === "auth_unavailable"
          ? " Database record removed; configure Firebase Admin service account to revoke Firebase sign-in."
          : "";

    return res.json({
      success: true,
      message: `${user.name} (${user.email}) has been suspended and removed from GenValue Academy.${firebaseNote}`,
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        firebaseRevoked: firebaseResult.status === "revoked",
      },
    });
  } catch (error) {
    console.error("[adminUser] removeStudent error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove student account",
    });
  }
}
