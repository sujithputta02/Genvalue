import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { testConnection } from "./config/database.js";
import { createApiV1Router } from "./routes/apiV1.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { ensureSuperAdminSeeded } from "./controllers/authorizedAdminController.js";
import { ensureAuthorizedAdminSchema } from "./utils/ensureAuthorizedAdminSchema.js";
import { seedDefaultAdminOrgRoles } from "./services/adminOrgRoleStore.js";
import { ensureAdminOtpSchema } from "./utils/ensureAdminOtpSchema.js";
import { ensureUserRemovalLogSchema } from "./utils/ensureUserRemovalLogSchema.js";
import { ensureUserDeactivationSchema } from "./utils/ensureUserDeactivationSchema.js";
import { ensureUserRoleEnum } from "./utils/ensureUserRoleEnum.js";
import { ensureFirebaseAdminReady } from "./config/firebase.js";
import { probeFirebasePublicKeyVerification } from "./utils/firebaseIdTokenPublicVerify.js";
import { ensureDefaultCourseCatalog } from "./utils/ensureCourseCatalog.js";
import { ensureModuleContentSchema } from "./utils/ensureModuleContentSchema.js";
import { ensureAssignmentSubmissionSchema } from "./utils/ensureAssignmentSubmissionSchema.js";
import { ensurePasswordResetSchema } from "./utils/ensurePasswordResetSchema.js";
import { ensureBugReportSchema } from "./utils/ensureBugReportSchema.js";
import { ensureStudentPlannerSchema } from "./utils/ensureStudentPlannerSchema.js";
import { removeLegacySeedAnnouncements } from "./utils/announcementFeed.js";
import {
  getAllowedCorsOrigins,
  validateProductionEnv,
} from "./config/production.js";

// Load environment variables (.env wins over empty shell exports)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: path.join(__dirname, "../.env"),
  override: true,
});

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === "production";

// Render / reverse proxies terminate TLS — needed for correct req.ip and secure cookies
app.set("trust proxy", 1);

const allowedOrigins = getAllowedCorsOrigins();

// Middleware
app.use(
  cors({
    origin(origin, callback) {
      // Non-browser clients (health checks, curl) often omit Origin
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      console.warn(`[cors] Blocked origin: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(securityHeaders);
// Increase payload limit for image uploads (10MB for base64 images)
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Health check route (Render healthCheckPath)
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GenValue Academy Backend API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Versioned API (canonical) + legacy alias
const apiV1 = createApiV1Router();
app.use("/api/v1", apiV1);
app.use("/api", apiV1);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server with database connection test
async function startServer() {
  try {
    const envCheck = validateProductionEnv();
    if (!envCheck.ok) {
      console.error(
        "❌ Missing or invalid production environment variables:",
        envCheck.missing.join(", "),
      );
      process.exit(1);
    }

    if (isProduction) {
      console.log("✅ Production env validation passed");
      console.log(`🌐 CORS origins: ${allowedOrigins.join(", ")}`);
    }

    // Test database connection
    await testConnection();

    // Ensure authorized_admins columns exist before Prisma queries use them
    await ensureAuthorizedAdminSchema();
    await seedDefaultAdminOrgRoles();

    // Dedupe admin OTP rows and ensure unique email index
    await ensureAdminOtpSchema();

    // Student removal audit log table
    await ensureUserRemovalLogSchema();

    // Temporary student deactivation columns
    await ensureUserDeactivationSchema();

    // Ensure Role enum values exist in CockroachDB
    await ensureUserRoleEnum();

    // Probe Firebase Admin Auth when service account is configured; else public key verify
    const adminReady = await ensureFirebaseAdminReady();
    if (!adminReady && process.env.FIREBASE_PROJECT_ID) {
      const publicKeysOk = await probeFirebasePublicKeyVerification(
        process.env.FIREBASE_PROJECT_ID
      );
      if (publicKeysOk) {
        console.log("✅ Firebase LMS token verification via Google public keys");
      }
    }

    // Seed default LMS course catalog if empty
    await ensureDefaultCourseCatalog();

    await ensureModuleContentSchema();
    await ensureAssignmentSubmissionSchema();
    await ensurePasswordResetSchema();
    await ensureBugReportSchema();
    await ensureStudentPlannerSchema();

    await removeLegacySeedAnnouncements();

    // Ensure super admin is seeded
    await ensureSuperAdminSeeded();

    // Bind 0.0.0.0 so Render / Docker can route traffic
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Backend server running on 0.0.0.0:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
