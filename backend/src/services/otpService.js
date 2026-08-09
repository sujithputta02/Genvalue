import crypto from "crypto";
import { prisma } from "../config/database.js";
import { sendTransactionalEmail } from "./emailService.js";
import {
  buildAdminOtpEmailHtml,
  buildAdminOtpEmailText,
} from "../templates/adminOtpEmail.js";
import { createAdminSessionToken } from "../utils/adminSession.js";
import {
  getEffectivePortalSections,
  normalizePortalSections,
} from "../constants/adminPortalRoles.js";
import { ensureAdminOrgRoleCache } from "./adminOrgRoleStore.js";
import {
  normalizeIanaTimeZone,
  sendAdminLoginAlertEmail,
} from "../utils/adminLoginAlert.js";

const OTP_EXPIRY_MINUTES = 10;
const MAX_REQUESTS_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;

/** In-memory rate limit tracker: email -> request timestamps */
const otpRequestLog = new Map();

function checkRateLimit(email) {
  const now = Date.now();
  const recent = (otpRequestLog.get(email) || []).filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  recent.push(now);
  otpRequestLog.set(email, recent);
  return true;
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function normalizeOtpCode(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  return digits.length > 6 ? digits.slice(-6) : digits;
}

function otpsMatch(stored, input) {
  const a = normalizeOtpCode(stored);
  const b = normalizeOtpCode(input);

  if (a.length !== 6 || b.length !== 6) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

function generateOtpCode() {
  return crypto.randomInt(100000, 999999).toString();
}

async function deleteAllOtpsForEmail(email) {
  const normalized = normalizeEmail(email);

  await prisma.adminOTP.deleteMany({ where: { email: normalized } });
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM admin_otps WHERE LOWER(email) = LOWER($1)`,
      normalized
    );
  } catch {
    /* ignore */
  }
}

async function saveOtp(email, otp, expiresAt) {
  const normalized = normalizeEmail(email);
  const normalizedOtp = normalizeOtpCode(otp);

  await deleteAllOtpsForEmail(normalized);

  return prisma.adminOTP.upsert({
    where: { email: normalized },
    create: {
      email: normalized,
      otp: normalizedOtp,
      expiresAt,
      verified: false,
    },
    update: {
      otp: normalizedOtp,
      expiresAt,
      verified: false,
    },
  });
}

async function findOtp(email) {
  const normalized = normalizeEmail(email);

  const record = await prisma.adminOTP.findFirst({
    where: {
      email: { equals: normalized, mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
  });

  if (record) {
    return record;
  }

  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, email, otp, "expiresAt", "createdAt", verified
       FROM admin_otps
       WHERE LOWER(email) = LOWER($1)
       ORDER BY "createdAt" DESC
       LIMIT 1`,
      normalized
    );
    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      ...row,
      otp: String(row.otp ?? ""),
      expiresAt: row.expiresAt instanceof Date ? row.expiresAt : new Date(row.expiresAt),
    };
  } catch {
    return null;
  }
}

async function getAuthorizedAdmin(email) {
  return prisma.authorizedAdmin.findUnique({
    where: { email: normalizeEmail(email) },
  });
}

/**
 * Request an admin OTP — generates, stores, and emails the code.
 */
export async function requestAdminOtp(rawEmail) {
  const email = normalizeEmail(rawEmail);

  const authorizedAdmin = await getAuthorizedAdmin(email);

  if (!authorizedAdmin) {
    return {
      ok: false,
      status: 401,
      message: "Unauthorized. This email is not authorized for admin access.",
    };
  }

  if (!authorizedAdmin.isActive) {
    return {
      ok: false,
      status: 401,
      message: "Unauthorized. This admin account is inactive.",
    };
  }

  const allowed = checkRateLimit(email);
  if (!allowed) {
    return {
      ok: false,
      status: 429,
      message: "Too many OTP requests. Please wait 15 minutes before trying again.",
    };
  }

  const existingOtp = await findOtp(email);
  if (existingOtp && new Date(existingOtp.expiresAt) > new Date()) {
    const ageMs = Date.now() - new Date(existingOtp.createdAt).getTime();
    if (ageMs < RESEND_COOLDOWN_MS) {
      return {
        ok: true,
        status: 200,
        message:
          "A code was just sent. Check your inbox (and spam). Use the most recent email.",
      };
    }
  }

  const otp = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  try {
    await saveOtp(email, otp, expiresAt);
  } catch (error) {
    console.error("[otpService] save error:", error.message);
    return {
      ok: false,
      status: 500,
      message: "Failed to generate OTP. Please try again.",
    };
  }

  const displayName = authorizedAdmin.name || email.split("@")[0];

  const emailResult = await sendTransactionalEmail({
    to: { email, name: displayName },
    subject: "GenValue Admin Portal — Your Sign-in Code",
    htmlContent: buildAdminOtpEmailHtml({
      otp,
      email,
      expiresMinutes: OTP_EXPIRY_MINUTES,
    }),
    textContent: buildAdminOtpEmailText({
      otp,
      email,
      expiresMinutes: OTP_EXPIRY_MINUTES,
    }),
  });

  if (!emailResult.ok) {
    await deleteAllOtpsForEmail(email);
    console.error("[otpService] email delivery failed:", emailResult.message);

    return {
      ok: false,
      status: 502,
      message: "Failed to send OTP to your email. Please try again in a moment.",
      hint: emailResult.hint,
    };
  }

  const devConsole = emailResult.channel === "dev-console";

  return {
    ok: true,
    status: 200,
    message: devConsole
      ? "OTP generated. Check the backend terminal for the code (dev mode)."
      : "OTP sent successfully. Check your email.",
    channel: emailResult.channel,
  };
}

/**
 * Verify admin OTP and issue a session token.
 * @param {object} [loginContext] - ipAddress, userAgent for sign-in alert email
 */
export async function verifyAdminOtp(rawEmail, rawOtp, loginContext = {}) {
  const email = normalizeEmail(rawEmail);
  const otp = normalizeOtpCode(rawOtp);

  if (otp.length !== 6) {
    return {
      ok: false,
      status: 400,
      message: "Enter the 6-digit code from your email.",
    };
  }

  const authorizedAdmin = await getAuthorizedAdmin(email);

  if (!authorizedAdmin?.isActive) {
    return {
      ok: false,
      status: 403,
      message: "Unauthorized email address",
    };
  }

  const otpRecord = await findOtp(email);

  if (!otpRecord) {
    console.warn("[otpService] verify: no OTP record for", email);
    return {
      ok: false,
      status: 400,
      message: "OTP not found or expired. Please request a new one.",
    };
  }

  if (new Date(otpRecord.expiresAt) < new Date()) {
    await deleteAllOtpsForEmail(email);
    return {
      ok: false,
      status: 400,
      message: "OTP has expired. Please request a new one.",
    };
  }

  if (!otpsMatch(otpRecord.otp, otp)) {
    return {
      ok: false,
      status: 400,
      message:
        "Invalid OTP. Use the code from your most recent email, or tap Resend Code.",
    };
  }

  const sessionRole = authorizedAdmin.isSuperAdmin ? "SUPER_ADMIN" : "ADMIN";
  const displayName = authorizedAdmin.name || email.split("@")[0];

  let dbUser = await prisma.user.findUnique({ where: { email } });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email,
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

  await deleteAllOtpsForEmail(email);

  await ensureAdminOrgRoleCache();

  const adminRoles = authorizedAdmin.roles?.length
    ? authorizedAdmin.roles
    : authorizedAdmin.isSuperAdmin
      ? ["CTO"]
      : [];
  const adminUserLimit = authorizedAdmin.isSuperAdmin ? null : authorizedAdmin.userLimit;
  const adminPortalSections = normalizePortalSections(authorizedAdmin.portalSections);
  const effectivePortalSections = getEffectivePortalSections({
    isSuperAdmin: authorizedAdmin.isSuperAdmin,
    roles: adminRoles,
    portalSections: adminPortalSections,
  });

  const adminToken = createAdminSessionToken({
    userId: dbUser.id,
    email,
    role: sessionRole,
    name: displayName,
    isSuperAdmin: authorizedAdmin.isSuperAdmin,
    roles: adminRoles,
    portalSections: adminPortalSections,
    userLimit: adminUserLimit,
  });

  const loginAt = new Date();
  const resolvedTimeZone =
    normalizeIanaTimeZone(loginContext.timeZone) ||
    normalizeIanaTimeZone(authorizedAdmin.timezone) ||
    null;

  prisma.authorizedAdmin
    .update({
      where: { email },
      data: {
        lastLoginAt: loginAt,
        ...(resolvedTimeZone ? { timezone: resolvedTimeZone } : {}),
      },
    })
    .catch((error) => {
      console.warn("[otpService] could not persist admin login metadata:", error.message);
    });

  sendAdminLoginAlertEmail({
    email,
    name: displayName,
    isSuperAdmin: authorizedAdmin.isSuperAdmin,
    roles: adminRoles,
    ipAddress: loginContext.ipAddress,
    userAgent: loginContext.userAgent,
    loginAt,
    timeZone: resolvedTimeZone,
  }).catch((error) => {
    console.warn("[otpService] admin login alert email error:", error.message);
  });

  return {
    ok: true,
    status: 200,
    message: "OTP verified successfully",
    data: {
      uid: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: sessionRole,
      isSuperAdmin: authorizedAdmin.isSuperAdmin,
      roles: adminRoles,
      portalSections: adminPortalSections,
      effectivePortalSections,
      userLimit: adminUserLimit,
      adminToken,
    },
  };
}
