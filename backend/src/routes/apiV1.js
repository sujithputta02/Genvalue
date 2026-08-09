import express from "express";
import authRoutes from "./authRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import announcementRoutes from "./announcementRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import courseRoutes from "./courseRoutes.js";
import quizRoutes from "./quizRoutes.js";
import assignmentRoutes from "./assignmentRoutes.js";
import certificateRoutes from "./certificateRoutes.js";
import discussionRoutes from "./discussionRoutes.js";
import blogRoutes from "./blogRoutes.js";
import bugReportRoutes from "./bugReportRoutes.js";
import adminRoutes from "./adminRoutes.js";
import { apiRateLimit } from "../middleware/rateLimiter.js";
import { getPublicPlatformStatus } from "../controllers/systemHealthController.js";

/**
 * Mount all versioned API routes onto a router.
 * Used for both /api/v1 (canonical) and /api (legacy alias).
 */
export function createApiV1Router() {
  const router = express.Router();
  router.use(apiRateLimit);

  router.get("/platform/status", getPublicPlatformStatus);

  router.use("/auth", authRoutes);
  router.use("/dashboard", dashboardRoutes);
  router.use("/announcements", announcementRoutes);
  router.use("/notifications", notificationRoutes);
  router.use("/", courseRoutes);
  router.use("/", quizRoutes);
  router.use("/", assignmentRoutes);
  router.use("/", certificateRoutes);
  router.use("/", discussionRoutes);
  router.use("/blog", blogRoutes);
  router.use("/bug-reports", bugReportRoutes);
  router.use("/admin", adminRoutes);

  return router;
}
