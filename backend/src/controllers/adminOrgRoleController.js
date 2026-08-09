import { prisma } from "../config/database.js";
import { PORTAL_SECTIONS } from "../constants/adminPortalRoles.js";
import {
  ensureAdminOrgRoleCache,
  normalizePortalSectionList,
  refreshAdminOrgRoleCache,
  slugifyOrgRoleKey,
} from "../services/adminOrgRoleStore.js";

function serializeRole(row) {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    portalSections: normalizePortalSectionList(row.portalSections),
    isActive: row.isActive,
    isSystem: row.isSystem,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * GET /api/auth/admin/org-roles
 */
export const listAdminOrgRoles = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const rows = await prisma.adminOrgRole.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });
    await refreshAdminOrgRoleCache();
    res.status(200).json({
      success: true,
      data: {
        roles: rows.map(serializeRole),
        portalSections: Object.values(PORTAL_SECTIONS),
      },
    });
  } catch (error) {
    console.error("listAdminOrgRoles error:", error);
    res.status(500).json({ success: false, message: "Failed to list org roles" });
  }
};

/**
 * POST /api/auth/admin/org-roles
 */
export const createAdminOrgRole = async (req, res) => {
  try {
    const label = String(req.body?.label || "").trim();
    if (!label || label.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Role label is required (max 80 characters)",
      });
    }

    const requestedKey = req.body?.key ? slugifyOrgRoleKey(req.body.key) : slugifyOrgRoleKey(label);
    if (!requestedKey || requestedKey.length < 2 || requestedKey.length > 40) {
      return res.status(400).json({
        success: false,
        message: "Role key must be 2–40 characters (letters, numbers, underscores)",
      });
    }

    const portalSections = normalizePortalSectionList(req.body?.portalSections);
    if (portalSections.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Select at least one portal section for this role",
      });
    }

    const existing = await prisma.adminOrgRole.findUnique({ where: { key: requestedKey } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Role key "${requestedKey}" already exists`,
      });
    }

    const maxSort = await prisma.adminOrgRole.aggregate({ _max: { sortOrder: true } });
    const sortOrder =
      Number.isInteger(req.body?.sortOrder) && req.body.sortOrder >= 0
        ? req.body.sortOrder
        : (maxSort._max.sortOrder ?? 0) + 10;

    const created = await prisma.adminOrgRole.create({
      data: {
        key: requestedKey,
        label,
        portalSections,
        isSystem: false,
        isActive: true,
        sortOrder,
      },
    });

    await refreshAdminOrgRoleCache();

    res.status(201).json({
      success: true,
      message: `Role "${created.label}" created`,
      data: serializeRole(created),
    });
  } catch (error) {
    console.error("createAdminOrgRole error:", error);
    res.status(500).json({ success: false, message: "Failed to create org role" });
  }
};

/**
 * PATCH /api/auth/admin/org-roles/:key
 */
export const updateAdminOrgRole = async (req, res) => {
  try {
    const key = slugifyOrgRoleKey(req.params.key);
    const existing = await prisma.adminOrgRole.findUnique({ where: { key } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    const data = {};

    if (req.body?.label !== undefined) {
      const label = String(req.body.label).trim();
      if (!label || label.length > 80) {
        return res.status(400).json({
          success: false,
          message: "Role label is required (max 80 characters)",
        });
      }
      data.label = label;
    }

    if (req.body?.portalSections !== undefined) {
      const portalSections = normalizePortalSectionList(req.body.portalSections);
      if (portalSections.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Select at least one portal section for this role",
        });
      }
      data.portalSections = portalSections;
    }

    if (req.body?.isActive !== undefined) {
      const nextActive = Boolean(req.body.isActive);
      if (!nextActive && existing.isSystem) {
        return res.status(400).json({
          success: false,
          message: "Built-in system roles cannot be deactivated",
        });
      }
      if (!nextActive) {
        const assigned = await prisma.authorizedAdmin.count({
          where: {
            isActive: true,
            roles: { has: key },
          },
        });
        if (assigned > 0) {
          return res.status(400).json({
            success: false,
            message: `Cannot deactivate — ${assigned} active admin(s) still use this role`,
          });
        }
      }
      data.isActive = nextActive;
    }

    if (Number.isInteger(req.body?.sortOrder) && req.body.sortOrder >= 0) {
      data.sortOrder = req.body.sortOrder;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: "No changes provided" });
    }

    const updated = await prisma.adminOrgRole.update({
      where: { key },
      data,
    });

    await refreshAdminOrgRoleCache();

    res.status(200).json({
      success: true,
      message: `Role "${updated.label}" updated`,
      data: serializeRole(updated),
    });
  } catch (error) {
    console.error("updateAdminOrgRole error:", error);
    res.status(500).json({ success: false, message: "Failed to update org role" });
  }
};

/**
 * Warm cache — called from boot / schema ensure.
 */
export async function ensureAdminOrgRolesReady() {
  await ensureAdminOrgRoleCache();
}
