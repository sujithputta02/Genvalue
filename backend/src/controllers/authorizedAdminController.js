import { prisma } from "../config/database.js";
import { sendBrevoEmail } from "../services/brevoService.js";
import {
  buildAdminWelcomeEmailHtml,
  buildAdminWelcomeEmailText,
} from "../templates/adminWelcomeEmail.js";
import { verifyAdminSessionToken } from "../utils/adminSession.js";
import {
  ensureAuthorizedAdminSchema,
  ensureSuperAdminRecord,
} from "../utils/ensureAuthorizedAdminSchema.js";
import {
  countActiveNonSuperAdmins,
  getAdminPortalSettingsRecord,
  updateAdminPortalSettingsRecord,
} from "../utils/ensureAdminPortalSettings.js";
import {
  SUPER_ADMIN_ORG_ROLES,
  adminHasPortalSection,
  getEffectivePortalSections,
  normalizeAdminOrgRoles,
  normalizePortalSections,
} from "../constants/adminPortalRoles.js";
import { ensureAdminOrgRoleCache } from "../services/adminOrgRoleStore.js";

const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() || "sujithputta02@gmail.com";

function buildAdminContext(authorized, payload) {
  const base = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    name: payload.name,
    isSuperAdmin: authorized.isSuperAdmin,
    roles: authorized.roles ?? [],
    portalSections: normalizePortalSections(authorized.portalSections),
    userLimit: authorized.isSuperAdmin ? null : authorized.userLimit,
  };
  return {
    ...base,
    effectivePortalSections: getEffectivePortalSections(base),
  };
}

async function countActiveSuperAdmins(excludeEmail = null) {
  return prisma.authorizedAdmin.count({
    where: {
      isActive: true,
      isSuperAdmin: true,
      ...(excludeEmail ? { email: { not: excludeEmail.toLowerCase() } } : {}),
    },
  });
}

function parseUserLimit(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return { error: "User limit must be a positive whole number" };
  }
  return parsed;
}

function parseMaxAuthorizedAdmins(value) {
  if (value === null || value === undefined || value === "") {
    return { error: "Admin email limit is required" };
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    return { error: "Admin email limit must be between 1 and 100" };
  }
  return parsed;
}

async function assertAdminSlotAvailable({ excludeEmail = null } = {}) {
  const settings = await getAdminPortalSettingsRecord();
  const activeCount = await countActiveNonSuperAdmins();

  let effectiveCount = activeCount;
  if (excludeEmail) {
    const existing = await prisma.authorizedAdmin.findUnique({
      where: { email: excludeEmail },
    });
    if (existing?.isActive && !existing.isSuperAdmin) {
      effectiveCount = Math.max(0, activeCount - 1);
    }
  }

  if (effectiveCount >= settings.maxAuthorizedAdmins) {
    return {
      ok: false,
      message: `Admin email limit reached (${settings.maxAuthorizedAdmins}). Revoke an admin or increase the limit.`,
    };
  }

  return { ok: true, settings, activeCount: effectiveCount };
}

async function validateAdminPayload({
  roles,
  userLimit,
  isSuperAdmin = false,
  portalSections = [],
}) {
  await ensureAdminOrgRoleCache();

  if (isSuperAdmin) {
    return {
      isSuperAdmin: true,
      roles: SUPER_ADMIN_ORG_ROLES,
      userLimit: null,
      portalSections: [],
    };
  }

  const normalizedRoles = normalizeAdminOrgRoles(roles);

  if (normalizedRoles.length === 0) {
    return {
      error: "Select at least one role",
    };
  }

  const parsedLimit = parseUserLimit(userLimit);
  if (parsedLimit && typeof parsedLimit === "object" && parsedLimit.error) {
    return parsedLimit;
  }

  return {
    isSuperAdmin: false,
    roles: normalizedRoles,
    userLimit: parsedLimit,
    portalSections: normalizePortalSections(portalSections),
  };
}

async function assertCanChangeSuperAdminStatus({
  targetEmail,
  requestedSuperAdmin,
  requesterIsSuperAdmin,
}) {
  if (requestedSuperAdmin && !requesterIsSuperAdmin) {
    return "Only super admins can grant super admin access";
  }

  const target = await prisma.authorizedAdmin.findUnique({
    where: { email: targetEmail },
  });

  if (!target?.isSuperAdmin || requestedSuperAdmin) {
    return null;
  }

  if (targetEmail === SUPER_ADMIN_EMAIL) {
    return "The primary super admin account cannot be demoted";
  }

  const remainingSuperAdmins = await countActiveSuperAdmins(targetEmail);
  if (remainingSuperAdmins === 0) {
    return "At least one super admin must remain active";
  }

  return null;
}

/**
 * Middleware: require valid admin session token.
 */
export const requireAdminSession = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split("Bearer ")[1];
    const payload = verifyAdminSessionToken(token);

    if (!payload) {
      return res.status(401).json({ success: false, message: "Invalid or expired admin session" });
    }

    await ensureAdminOrgRoleCache();

    const authorized = await prisma.authorizedAdmin.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (!authorized?.isActive) {
      return res.status(403).json({ success: false, message: "Admin access revoked" });
    }

    req.admin = buildAdminContext(authorized, payload);

    next();
  } catch (error) {
    console.error("requireAdminSession error:", error);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

/**
 * Middleware: require super admin.
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.admin?.isSuperAdmin) {
    return res.status(403).json({
      success: false,
      message: "Super admin access required",
    });
  }
  next();
};

/** Only the main super admin account may change portal security settings. */
export const requireMainSuperAdmin = (req, res, next) => {
  if (!req.admin?.isSuperAdmin || req.admin.email !== SUPER_ADMIN_EMAIL) {
    return res.status(403).json({
      success: false,
      message: "Only the main super admin can change this setting",
    });
  }
  next();
};

/**
 * Attach req.user from a validated admin OTP session (for controllers that expect req.user).
 */
export const attachAdminUser = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ success: false, message: "Admin session required" });
  }

  req.user = {
    uid: req.admin.userId,
    email: req.admin.email,
    role: req.admin.role,
    name: req.admin.name,
    isSuperAdmin: req.admin.isSuperAdmin,
  };

  next();
};

/**
 * Middleware: require portal section access derived from org roles (super admin bypasses).
 */
export const requireAdminPortalRole =
  (...requiredSections) =>
  (req, res, next) => {
    if (req.admin?.isSuperAdmin) {
      return next();
    }

    const hasAccess = requiredSections.some((section) =>
      adminHasPortalSection(req.admin, section)
    );
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
    }

    next();
  };

/**
 * GET /api/auth/admin/portal-settings
 */
export const getAdminPortalSettings = async (req, res) => {
  try {
    const settings = await getAdminPortalSettingsRecord();
    const activeAdminCount = await countActiveNonSuperAdmins();

    res.status(200).json({
      success: true,
      data: {
        maxAuthorizedAdmins: settings.maxAuthorizedAdmins,
        activeAdminCount,
        remainingSlots: Math.max(0, settings.maxAuthorizedAdmins - activeAdminCount),
        canEditLimit: req.admin.email === SUPER_ADMIN_EMAIL,
      },
    });
  } catch (error) {
    console.error("getAdminPortalSettings error:", error);
    res.status(500).json({ success: false, message: "Failed to load portal settings" });
  }
};

/**
 * PATCH /api/auth/admin/portal-settings
 */
export const updateAdminPortalSettings = async (req, res) => {
  try {
    const { maxAuthorizedAdmins } = req.body;
    const parsed = parseMaxAuthorizedAdmins(maxAuthorizedAdmins);

    if (parsed && typeof parsed === "object" && parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const activeAdminCount = await countActiveNonSuperAdmins();
    if (parsed < activeAdminCount) {
      return res.status(400).json({
        success: false,
        message: `Cannot set limit below current active admin count (${activeAdminCount})`,
      });
    }

    const updated = await updateAdminPortalSettingsRecord(parsed, req.admin.email);

    res.status(200).json({
      success: true,
      message: "Admin email limit updated",
      data: {
        maxAuthorizedAdmins: updated.maxAuthorizedAdmins,
        activeAdminCount,
        remainingSlots: Math.max(0, updated.maxAuthorizedAdmins - activeAdminCount),
        canEditLimit: true,
      },
    });
  } catch (error) {
    console.error("updateAdminPortalSettings error:", error);
    res.status(500).json({ success: false, message: "Failed to update portal settings" });
  }
};

/**
 * GET /api/auth/admin/authorized-emails
 */
export const listAuthorizedAdmins = async (req, res) => {
  try {
    const admins = await prisma.authorizedAdmin.findMany({
      orderBy: [{ isSuperAdmin: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
        isActive: true,
        roles: true,
        portalSections: true,
        userLimit: true,
        addedByEmail: true,
        createdAt: true,
        timezone: true,
        lastLoginAt: true,
        lastLogoutAt: true,
      },
    });

    res.status(200).json({ success: true, data: admins });
  } catch (error) {
    console.error("listAuthorizedAdmins error:", error);
    res.status(500).json({ success: false, message: "Failed to list authorized admins" });
  }
};

/**
 * POST /api/auth/admin/authorized-emails
 */
export const addAuthorizedAdmin = async (req, res) => {
  try {
    const { email, name, roles, userLimit, isSuperAdmin: requestedSuperAdmin, portalSections } =
      req.body;

    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === SUPER_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Super admin account is managed by the system",
      });
    }

    const grantSuperAdmin = Boolean(requestedSuperAdmin);
    if (grantSuperAdmin && !req.admin?.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only super admins can grant super admin access",
      });
    }

    const validated = await validateAdminPayload({
      roles,
      userLimit,
      isSuperAdmin: grantSuperAdmin,
      portalSections,
    });
    if (validated.error) {
      return res.status(400).json({ success: false, message: validated.error });
    }

    const existing = await prisma.authorizedAdmin.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      if (existing.isActive) {
        return res.status(409).json({ success: false, message: "Email is already authorized" });
      }

      if (!validated.isSuperAdmin) {
        const slotCheck = await assertAdminSlotAvailable();
        if (!slotCheck.ok) {
          return res.status(403).json({ success: false, message: slotCheck.message });
        }
      }

      const reactivated = await prisma.authorizedAdmin.update({
        where: { email: normalizedEmail },
        data: {
          isActive: true,
          isSuperAdmin: validated.isSuperAdmin,
          name: name?.trim() || existing.name,
          roles: validated.roles,
          portalSections: validated.portalSections,
          userLimit: validated.userLimit,
          addedByEmail: req.admin.email,
        },
      });

      const welcomeEmail = await sendAdminWelcomeEmail({
        email: normalizedEmail,
        name: reactivated.name,
        addedByEmail: req.admin.email,
        isReactivate: true,
      });

      return res.status(200).json({
        success: true,
        message: welcomeEmail.ok
          ? "Admin access reactivated and welcome email sent"
          : "Admin access reactivated (welcome email could not be sent)",
        data: reactivated,
        emailSent: welcomeEmail.ok,
      });
    }

    if (!validated.isSuperAdmin) {
      const slotCheck = await assertAdminSlotAvailable();
      if (!slotCheck.ok) {
        return res.status(403).json({ success: false, message: slotCheck.message });
      }
    }

    const created = await prisma.authorizedAdmin.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || null,
        isSuperAdmin: validated.isSuperAdmin,
        isActive: true,
        roles: validated.roles,
        portalSections: validated.portalSections,
        userLimit: validated.userLimit,
        addedByEmail: req.admin.email,
      },
    });

    const welcomeEmail = await sendAdminWelcomeEmail({
      email: normalizedEmail,
      name: created.name,
      addedByEmail: req.admin.email,
      isReactivate: false,
    });

    res.status(201).json({
      success: true,
      message: welcomeEmail.ok
        ? "Admin email authorized and welcome email sent"
        : "Admin email authorized (welcome email could not be sent)",
      data: created,
      emailSent: welcomeEmail.ok,
    });
  } catch (error) {
    console.error("addAuthorizedAdmin error:", error);
    res.status(500).json({ success: false, message: "Failed to add authorized admin" });
  }
};

/**
 * PATCH /api/auth/admin/authorized-emails/:email
 */
export const updateAuthorizedAdmin = async (req, res) => {
  try {
    const normalizedEmail = decodeURIComponent(req.params.email).trim().toLowerCase();
    const { name, roles, userLimit, isSuperAdmin: requestedSuperAdmin, portalSections } = req.body;

    const target = await prisma.authorizedAdmin.findUnique({
      where: { email: normalizedEmail },
    });

    if (!target) {
      return res.status(404).json({ success: false, message: "Authorized admin not found" });
    }

    const grantSuperAdmin =
      requestedSuperAdmin === undefined ? target.isSuperAdmin : Boolean(requestedSuperAdmin);

    const superAdminChangeError = await assertCanChangeSuperAdminStatus({
      targetEmail: normalizedEmail,
      requestedSuperAdmin: grantSuperAdmin,
      requesterIsSuperAdmin: Boolean(req.admin?.isSuperAdmin),
    });
    if (superAdminChangeError) {
      return res.status(403).json({ success: false, message: superAdminChangeError });
    }

    const validated = await validateAdminPayload({
      roles,
      userLimit,
      isSuperAdmin: grantSuperAdmin,
      portalSections,
    });
    if (validated.error) {
      return res.status(400).json({ success: false, message: validated.error });
    }

    if (target.isSuperAdmin && !validated.isSuperAdmin) {
      const slotCheck = await assertAdminSlotAvailable({ excludeEmail: normalizedEmail });
      if (!slotCheck.ok) {
        return res.status(403).json({ success: false, message: slotCheck.message });
      }
    }

    const updated = await prisma.authorizedAdmin.update({
      where: { email: normalizedEmail },
      data: {
        ...(name !== undefined ? { name: name?.trim() || null } : {}),
        isSuperAdmin: validated.isSuperAdmin,
        roles: validated.roles,
        portalSections: validated.portalSections,
        userLimit: validated.userLimit,
      },
    });

    res.status(200).json({
      success: true,
      message: "Admin permissions updated",
      data: updated,
    });
  } catch (error) {
    console.error("updateAuthorizedAdmin error:", error);
    res.status(500).json({ success: false, message: "Failed to update authorized admin" });
  }
};

/**
 * DELETE /api/auth/admin/authorized-emails/:email
 */
export const removeAuthorizedAdmin = async (req, res) => {
  try {
    const normalizedEmail = decodeURIComponent(req.params.email).trim().toLowerCase();

    const target = await prisma.authorizedAdmin.findUnique({
      where: { email: normalizedEmail },
    });

    if (!target) {
      return res.status(404).json({ success: false, message: "Authorized admin not found" });
    }

    if (target.isSuperAdmin) {
      if (normalizedEmail === SUPER_ADMIN_EMAIL) {
        return res.status(403).json({
          success: false,
          message: "The primary super admin account cannot be removed",
        });
      }

      const remainingSuperAdmins = await countActiveSuperAdmins(normalizedEmail);
      if (remainingSuperAdmins === 0) {
        return res.status(403).json({
          success: false,
          message: "Cannot remove the last super admin",
        });
      }
    }

    await prisma.authorizedAdmin.update({
      where: { email: normalizedEmail },
      data: { isActive: false },
    });

    res.status(200).json({ success: true, message: "Admin access revoked" });
  } catch (error) {
    console.error("removeAuthorizedAdmin error:", error);
    res.status(500).json({ success: false, message: "Failed to revoke admin access" });
  }
};

/**
 * GET /api/auth/admin/me
 */
export const getAdminProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.admin,
  });
};

/**
 * POST /api/auth/admin/logout
 * Records last logout timestamp for the signed-in authorized admin.
 */
export const recordAdminLogout = async (req, res) => {
  try {
    const email = req.admin?.email?.trim().toLowerCase();
    if (!email) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await prisma.authorizedAdmin.updateMany({
      where: { email, isActive: true },
      data: { lastLogoutAt: new Date() },
    });

    res.status(200).json({ success: true, message: "Logout recorded" });
  } catch (error) {
    console.error("recordAdminLogout error:", error);
    res.status(500).json({ success: false, message: "Failed to record logout" });
  }
};

const PRODUCTION_FRONTEND_URL = "https://genvalue-ten.vercel.app";
const ADMIN_PORTAL_LOGIN_PATH = "/admin/auth/login";

/**
 * Welcome emails should deep-link to the live Admin login page.
 * Prefer FRONTEND_URL when it's a public https origin; otherwise use production.
 */
function getAdminPortalLoginUrl() {
  const configured = process.env.FRONTEND_URL?.trim().replace(/\/+$/, "") || "";
  const isLocal =
    !configured ||
    /localhost|127\.0\.0\.1/i.test(configured) ||
    configured.startsWith("http://");
  const base = isLocal ? PRODUCTION_FRONTEND_URL : configured;
  return `${base}${ADMIN_PORTAL_LOGIN_PATH}`;
}

async function sendAdminWelcomeEmail({ email, name, addedByEmail, isReactivate = false }) {
  const portalUrl = getAdminPortalLoginUrl();
  const subject = isReactivate
    ? "GenValue Academy — Your admin access has been restored"
    : "Welcome to GenValue Academy Admin Portal";

  const result = await sendBrevoEmail({
    to: { email, name: (name && String(name).trim()) || email.split("@")[0] },
    subject,
    htmlContent: buildAdminWelcomeEmailHtml({
      email,
      name,
      addedByEmail,
      portalUrl,
      isReactivate,
    }),
    textContent: buildAdminWelcomeEmailText({
      email,
      name,
      addedByEmail,
      portalUrl,
      isReactivate,
    }),
  });

  if (!result.ok) {
    console.warn("[authorizedAdmin] welcome email failed:", result.message);
  }

  return result;
}

export async function ensureSuperAdminSeeded() {
  try {
    await ensureAuthorizedAdminSchema();
    const { seedDefaultAdminOrgRoles } = await import("../services/adminOrgRoleStore.js");
    await seedDefaultAdminOrgRoles();
    await getAdminPortalSettingsRecord();
    await ensureSuperAdminRecord();
  } catch (error) {
    console.warn("⚠️  Could not seed super admin:", error.message);
  }
}
