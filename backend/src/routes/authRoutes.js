import express from "express";
import {
  registerUser,
  loginUser,
  handleGoogleAuth,
  verifyUserToken,
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  logoutUser,
} from "../controllers/authController.js";
import { sendAdminOTP, verifyAdminOTP } from "../controllers/adminOtpController.js";
import {
  sendPasswordResetOtp,
  verifyPasswordResetOtpHandler,
  resetPasswordHandler,
} from "../controllers/passwordResetController.js";
import {
  listAuthorizedAdmins,
  addAuthorizedAdmin,
  updateAuthorizedAdmin,
  removeAuthorizedAdmin,
  getAdminProfile,
  recordAdminLogout,
  requireAdminSession,
  requireSuperAdmin,
  requireMainSuperAdmin,
  getAdminPortalSettings,
  updateAdminPortalSettings,
} from "../controllers/authorizedAdminController.js";
import {
  listAdminOrgRoles,
  createAdminOrgRole,
  updateAdminOrgRole,
} from "../controllers/adminOrgRoleController.js";
import { verifyToken, checkRole } from "../middleware/auth.js";
import {
  authRateLimit,
  otpRateLimit,
  passwordResetRateLimit,
} from "../middleware/rateLimiter.js";

const router = express.Router();

// Public routes
router.post("/register", authRateLimit, registerUser);
router.post("/login", authRateLimit, loginUser);
router.post("/google-auth", authRateLimit, handleGoogleAuth);
router.post("/verify-token", authRateLimit, verifyUserToken);
router.post("/logout", logoutUser);

// Admin OTP routes
router.post("/admin/send-otp", otpRateLimit, sendAdminOTP);
router.post("/admin/verify-otp", otpRateLimit, verifyAdminOTP);

// Student forgot password
router.post("/forgot-password/send-otp", otpRateLimit, sendPasswordResetOtp);
router.post("/forgot-password/verify-otp", otpRateLimit, verifyPasswordResetOtpHandler);
router.post("/forgot-password/reset", passwordResetRateLimit, resetPasswordHandler);

// Admin session routes (super admin manages authorized emails)
router.get("/admin/me", requireAdminSession, getAdminProfile);
router.post("/admin/logout", requireAdminSession, recordAdminLogout);
router.get(
  "/admin/portal-settings",
  requireAdminSession,
  requireSuperAdmin,
  getAdminPortalSettings
);
router.patch(
  "/admin/portal-settings",
  requireAdminSession,
  requireSuperAdmin,
  requireMainSuperAdmin,
  updateAdminPortalSettings
);
router.get(
  "/admin/authorized-emails",
  requireAdminSession,
  requireSuperAdmin,
  listAuthorizedAdmins
);
router.post(
  "/admin/authorized-emails",
  requireAdminSession,
  requireSuperAdmin,
  addAuthorizedAdmin
);
router.patch(
  "/admin/authorized-emails/:email",
  requireAdminSession,
  requireSuperAdmin,
  updateAuthorizedAdmin
);
router.delete(
  "/admin/authorized-emails/:email",
  requireAdminSession,
  requireSuperAdmin,
  removeAuthorizedAdmin
);
router.get("/admin/org-roles", requireAdminSession, requireSuperAdmin, listAdminOrgRoles);
router.post("/admin/org-roles", requireAdminSession, requireSuperAdmin, createAdminOrgRole);
router.patch(
  "/admin/org-roles/:key",
  requireAdminSession,
  requireSuperAdmin,
  updateAdminOrgRole
);

// Protected routes (require authentication)
router.get("/profile", verifyToken, getUserProfile);
router.put("/profile", verifyToken, updateUserProfile);
router.post("/upload-profile-picture", verifyToken, uploadProfilePicture);
router.delete("/delete-profile-picture", verifyToken, deleteProfilePicture);

// Admin only routes
router.get("/admin/users", verifyToken, checkRole(["ADMIN", "SUPER_ADMIN"]), (req, res) => {
  res.json({
    success: true,
    message: "Admin access granted",
    data: { users: [] },
  });
});

export default router;
