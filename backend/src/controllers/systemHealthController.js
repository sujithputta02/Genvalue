import { prisma } from "../config/database.js";
import { adminAuth } from "../config/firebase.js";
import {
  firebaseAdminCredentialsLoaded,
  probeFirebaseAdminAuth,
} from "../utils/firebaseAdminAuth.js";
import { probeFirebasePublicKeyVerification } from "../utils/firebaseIdTokenPublicVerify.js";
import {
  detectHostingEnvironment,
  envConfigured,
  getAdminAccessSnapshot,
  getFrontendUrlStatus,
  getMissingProductionSecrets,
  probeCloudinary,
  probeEmailProvider,
} from "../utils/securityProbes.js";
import {
  getAdminPortalSettingsRecord,
  updateMaintenanceModeRecord,
} from "../utils/ensureAdminPortalSettings.js";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROCESS_STARTED_AT = Date.now();

function readBackendVersion() {
  try {
    const pkgPath = path.join(__dirname, "../../package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    return typeof pkg.version === "string" ? pkg.version : "1.0.0";
  } catch {
    return "1.0.0";
  }
}

function formatUptime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function buildSystemInfo() {
  const mem = process.memoryUsage();
  const uptimeSec = process.uptime();
  return {
    appName: "GenValue API",
    appVersion: readBackendVersion(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    processUptimeSec: Math.round(uptimeSec),
    processUptimeLabel: formatUptime(uptimeSec),
    processStartedAt: new Date(PROCESS_STARTED_AT).toISOString(),
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      externalMb: Math.round(mem.external / 1024 / 1024),
    },
  };
}

async function timed(fn) {
  const start = process.hrtime.bigint();
  try {
    const result = await fn();
    const latencyMs = Number(process.hrtime.bigint() - start) / 1e6;
    return { ok: true, result, latencyMs: Math.round(latencyMs) };
  } catch (error) {
    const latencyMs = Number(process.hrtime.bigint() - start) / 1e6;
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Probe failed",
      latencyMs: Math.round(latencyMs),
    };
  }
}

function overallFromServices(services) {
  const failed = services.filter((s) => s.status === "down").length;
  const degraded = services.filter((s) => s.status === "degraded").length;

  if (failed >= 2) return "major_outage";
  if (failed === 1) return "partial_outage";
  if (degraded > 0) return "degraded";
  return "operational";
}

/**
 * GET /api/v1/platform/status — public LMS maintenance signal (no secrets).
 */
export async function getPublicPlatformStatus(req, res) {
  try {
    const settings = await getAdminPortalSettingsRecord();
    res.status(200).json({
      success: true,
      data: {
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMode ? settings.maintenanceMessage : null,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[systemHealth] getPublicPlatformStatus error:", error);
    res.status(200).json({
      success: true,
      data: {
        maintenanceMode: false,
        maintenanceMessage: null,
        checkedAt: new Date().toISOString(),
      },
    });
  }
}

/**
 * GET /api/v1/admin/system-health
 */
export async function getSystemHealth(req, res) {
  try {
    const checkedAt = new Date().toISOString();
    const isProduction = process.env.NODE_ENV === "production";
    const hosting = detectHostingEnvironment();
    const services = [];

    const apiStarted = process.hrtime.bigint();
    const apiLatencyMs = Math.max(
      1,
      Math.round(Number(process.hrtime.bigint() - apiStarted) / 1e6)
    );
    services.push({
      id: "api",
      name: "API Server",
      group: "core",
      status: "operational",
      latencyMs: apiLatencyMs,
      detail: "Admin API process is responding to health probes.",
    });

    const dbProbe = await timed(() => prisma.$queryRaw`SELECT 1`);
    services.push({
      id: "database",
      name: "Database",
      group: "core",
      status: dbProbe.ok ? "operational" : "down",
      latencyMs: dbProbe.latencyMs,
      detail: dbProbe.ok
        ? "CockroachDB/Prisma accepted a live query."
        : dbProbe.error || "Database unreachable.",
    });

    const projectId = process.env.FIREBASE_PROJECT_ID || "";
    const firebaseProbe = await timed(async () => {
      const publicKeyOk = projectId
        ? await probeFirebasePublicKeyVerification(projectId)
        : false;
      const adminOk = firebaseAdminCredentialsLoaded
        ? await probeFirebaseAdminAuth(adminAuth)
        : false;
      return { publicKeyOk, adminOk, configured: Boolean(projectId) };
    });

    if (!firebaseProbe.ok) {
      services.push({
        id: "firebase-auth",
        name: "LMS Authentication",
        group: "auth",
        status: "down",
        latencyMs: firebaseProbe.latencyMs,
        detail: firebaseProbe.error || "Firebase probe failed.",
      });
    } else {
      const { publicKeyOk, adminOk, configured } = firebaseProbe.result;
      const identityOk = publicKeyOk || adminOk;
      services.push({
        id: "firebase-auth",
        name: "LMS Authentication",
        group: "auth",
        status: !configured ? "down" : identityOk ? "operational" : "degraded",
        latencyMs: firebaseProbe.latencyMs,
        detail: !configured
          ? "FIREBASE_PROJECT_ID is not configured — student login cannot verify tokens."
          : identityOk
            ? "Firebase identity verification is reachable for LMS student sessions."
            : "Firebase credentials present but identity verification failed.",
      });
    }

    const adminSecretOk =
      envConfigured("ADMIN_JWT_SECRET") || envConfigured("NEXTAUTH_SECRET");
    services.push({
      id: "admin-auth",
      name: "Admin Authentication",
      group: "auth",
      status: adminSecretOk ? "operational" : isProduction ? "down" : "degraded",
      latencyMs: null,
      detail: adminSecretOk
        ? "Admin OTP session signing secret is configured."
        : "ADMIN_JWT_SECRET (or NEXTAUTH_SECRET) missing — admin sessions cannot be signed safely.",
    });

    const emailTimed = await timed(() => probeEmailProvider());
    if (emailTimed.ok) {
      const email = emailTimed.result;
      services.push({
        id: "email",
        name: "Email Delivery",
        group: "comms",
        status: !email.configured
          ? "down"
          : email.reachable
            ? "operational"
            : "degraded",
        latencyMs: emailTimed.latencyMs,
        detail: email.detail,
      });
    } else {
      services.push({
        id: "email",
        name: "Email Delivery",
        group: "comms",
        status: "degraded",
        latencyMs: emailTimed.latencyMs,
        detail: emailTimed.error || "Email probe failed.",
      });
    }

    const cloudTimed = await timed(() => probeCloudinary());
    if (cloudTimed.ok) {
      const cloud = cloudTimed.result;
      services.push({
        id: "cloudinary",
        name: "File Storage",
        group: "media",
        status: !cloud.configured
          ? "degraded"
          : cloud.reachable
            ? "operational"
            : "down",
        latencyMs: cloudTimed.latencyMs,
        detail: cloud.detail,
      });
    } else {
      services.push({
        id: "cloudinary",
        name: "File Storage",
        group: "media",
        status: "down",
        latencyMs: cloudTimed.latencyMs,
        detail: cloudTimed.error || "Cloudinary probe failed.",
      });
    }

    const frontend = getFrontendUrlStatus(isProduction);
    services.push({
      id: "lms-frontend",
      name: "LMS Application Origin",
      group: "core",
      status: !frontend.configured
        ? isProduction
          ? "down"
          : "degraded"
        : isProduction && !frontend.https
          ? "degraded"
          : "operational",
      latencyMs: null,
      detail: frontend.detail,
    });

    services.push({
      id: "lesson-media",
      name: "Lesson Media",
      group: "media",
      status: "operational",
      latencyMs: null,
      detail:
        "Lessons use external video URLs (YouTube/Vimeo/Cloudinary/MP4). No managed streaming pipeline to monitor.",
      informational: true,
    });

    const [accessSnapshot, settings] = await Promise.all([
      getAdminAccessSnapshot(prisma),
      getAdminPortalSettingsRecord(),
    ]);
    const missingSecrets = getMissingProductionSecrets();
    const overall = overallFromServices(services.filter((s) => !s.informational));

    const counts = {
      operational: services.filter((s) => s.status === "operational").length,
      degraded: services.filter((s) => s.status === "degraded").length,
      down: services.filter((s) => s.status === "down").length,
    };

    res.status(200).json({
      success: true,
      data: {
        overall,
        checkedAt,
        environment: {
          nodeEnv: process.env.NODE_ENV || "development",
          hosting,
          isProduction,
        },
        counts,
        services,
        authSignals: {
          activeAdmins: accessSnapshot.activeAdminCount,
          superAdmins: accessSnapshot.superAdminCount,
          securityAccessCount: accessSnapshot.securityAccessCount,
        },
        secrets: {
          productionReady: !isProduction || missingSecrets.length === 0,
          missingInProduction: isProduction ? missingSecrets : [],
        },
        maintenance: {
          enabled: settings.maintenanceMode,
          message: settings.maintenanceMessage,
          updatedAt: settings.updatedAt
            ? new Date(settings.updatedAt).toISOString()
            : null,
          updatedByEmail: settings.updatedByEmail,
        },
        systemInfo: buildSystemInfo(),
        operations: {
          canToggleMaintenance: true,
          canRecycleDatabasePool: true,
          canRestartApiProcess: false,
          restartNote:
            "Full API restarts are done from Render (or your host). This page can recycle the database connection pool only.",
          canClearBrowserCache: true,
          browserCacheNote:
            "Clears this browser’s Admin Portal caches only (not every student’s browser).",
        },
        outOfScope: [
          {
            id: "ai-providers",
            label: "AI Providers",
            reason: "No live AI API is wired into GenValue yet.",
          },
          {
            id: "payments",
            label: "Payment Gateway",
            reason: "Payments are not enabled.",
          },
          {
            id: "host-metrics",
            label: "CPU / Memory / Disk",
            reason: "Host metrics are managed by Vercel/Render, not exposed in-app.",
          },
          {
            id: "job-queues",
            label: "Background Job Queues",
            reason: "No Redis/worker queue is deployed.",
          },
          {
            id: "managed-backups",
            label: "Backup Schedule UI",
            reason: "Database backups are handled by CockroachDB hosting, not by this app.",
          },
        ],
      },
    });
  } catch (error) {
    console.error("[systemHealth] getSystemHealth error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load system health",
    });
  }
}

/**
 * PATCH /api/v1/admin/system-health/maintenance
 */
export async function updateSystemMaintenance(req, res) {
  try {
    const enabled = Boolean(req.body?.enabled);
    const message =
      typeof req.body?.message === "string" ? req.body.message : undefined;
    const updated = await updateMaintenanceModeRecord({
      enabled,
      message,
      updatedByEmail: req.admin?.email || null,
    });

    res.status(200).json({
      success: true,
      message: enabled
        ? "Maintenance mode enabled for the LMS portal"
        : "Maintenance mode disabled",
      data: {
        enabled: updated.maintenanceMode,
        message: updated.maintenanceMessage,
        updatedAt: updated.updatedAt
          ? new Date(updated.updatedAt).toISOString()
          : null,
        updatedByEmail: updated.updatedByEmail,
      },
    });
  } catch (error) {
    console.error("[systemHealth] updateSystemMaintenance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update maintenance mode",
    });
  }
}

/**
 * POST /api/v1/admin/system-health/recycle-db
 */
export async function recycleDatabasePool(req, res) {
  try {
    await prisma.$disconnect();
    await prisma.$connect();
    const probe = await timed(() => prisma.$queryRaw`SELECT 1`);

    res.status(200).json({
      success: Boolean(probe.ok),
      message: probe.ok
        ? "Database connection pool recycled successfully"
        : "Pool recycle attempted but the follow-up query failed",
      data: {
        latencyMs: probe.latencyMs,
        detail: probe.ok
          ? "Prisma disconnected and reconnected; SELECT 1 succeeded."
          : probe.error || "Database still unreachable after recycle.",
        recycledAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[systemHealth] recycleDatabasePool error:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to recycle database pool",
    });
  }
}
