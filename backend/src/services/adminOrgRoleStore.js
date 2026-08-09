import { prisma } from "../config/database.js";

export const PORTAL_SECTION_KEYS = [
  "ANALYTICS",
  "STUDENTS",
  "ANNOUNCEMENTS",
  "AUDIT_LOGS",
  "DISPATCH",
  "SECURITY",
  "BUG_REPORTS",
];

const PORTAL_SECTIONS = Object.fromEntries(
  PORTAL_SECTION_KEYS.map((key) => [key, key])
);

const ALL_PORTAL_SECTION_KEYS = PORTAL_SECTION_KEYS;

const FULL_PORTAL_ACCESS = [
  PORTAL_SECTIONS.ANALYTICS,
  PORTAL_SECTIONS.STUDENTS,
  PORTAL_SECTIONS.ANNOUNCEMENTS,
  PORTAL_SECTIONS.AUDIT_LOGS,
  PORTAL_SECTIONS.DISPATCH,
  PORTAL_SECTIONS.BUG_REPORTS,
];

const LEADERSHIP_PORTAL_ACCESS = [...FULL_PORTAL_ACCESS, PORTAL_SECTIONS.SECURITY];

const INSTRUCTOR_PORTAL_ACCESS = [
  PORTAL_SECTIONS.STUDENTS,
  PORTAL_SECTIONS.ANNOUNCEMENTS,
  PORTAL_SECTIONS.DISPATCH,
  PORTAL_SECTIONS.BUG_REPORTS,
];

/** Seeded defaults — inserted only when missing; thereafter editable in DB/UI. */
export const DEFAULT_ADMIN_ORG_ROLES = [
  {
    key: "FOUNDER",
    label: "Founder",
    portalSections: LEADERSHIP_PORTAL_ACCESS,
    isSystem: true,
    sortOrder: 10,
  },
  {
    key: "COFOUNDER",
    label: "Co-founder",
    portalSections: LEADERSHIP_PORTAL_ACCESS,
    isSystem: true,
    sortOrder: 20,
  },
  {
    key: "CTO",
    label: "CTO",
    portalSections: FULL_PORTAL_ACCESS,
    isSystem: true,
    sortOrder: 30,
  },
  {
    key: "CPO",
    label: "CPO",
    portalSections: FULL_PORTAL_ACCESS,
    isSystem: true,
    sortOrder: 40,
  },
  {
    key: "INSTRUCTOR",
    label: "Instructor",
    portalSections: INSTRUCTOR_PORTAL_ACCESS,
    isSystem: true,
    sortOrder: 50,
  },
];

const ROLE_ALIASES = {
  "CO-FOUNDER": "COFOUNDER",
  CO_FOUNDER: "COFOUNDER",
};

/** @type {Map<string, { key: string, label: string, portalSections: string[], isActive: boolean, isSystem: boolean, sortOrder: number }>} */
let roleCacheByKey = new Map();
let cacheLoadedAt = 0;

export function slugifyOrgRoleKey(input) {
  return String(input || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

export function normalizePortalSectionList(sections) {
  if (!Array.isArray(sections)) return [];
  return [
    ...new Set(
      sections
        .map((s) => String(s).trim().toUpperCase())
        .filter((s) => ALL_PORTAL_SECTION_KEYS.includes(s))
    ),
  ];
}

export async function refreshAdminOrgRoleCache() {
  const rows = await prisma.adminOrgRole.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
  roleCacheByKey = new Map(
    rows.map((row) => [
      row.key,
      {
        key: row.key,
        label: row.label,
        portalSections: normalizePortalSectionList(row.portalSections),
        isActive: row.isActive,
        isSystem: row.isSystem,
        sortOrder: row.sortOrder,
      },
    ])
  );
  cacheLoadedAt = Date.now();
  return rows;
}

export async function ensureAdminOrgRoleCache() {
  if (roleCacheByKey.size === 0 || Date.now() - cacheLoadedAt > 60_000) {
    await refreshAdminOrgRoleCache();
  }
}

export function getCachedAdminOrgRoles({ activeOnly = false } = {}) {
  const rows = [...roleCacheByKey.values()];
  return activeOnly ? rows.filter((r) => r.isActive) : rows;
}

export function getCachedAdminOrgRole(key) {
  if (!key) return null;
  return roleCacheByKey.get(String(key).toUpperCase()) ?? null;
}

export function normalizeAdminOrgRoleKey(role) {
  const raw = String(role || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
  const aliased = ROLE_ALIASES[raw] ?? raw;
  if (!aliased) return null;
  if (roleCacheByKey.has(aliased)) return aliased;
  // Allow unknown keys that look like slugs (validated against DB elsewhere)
  if (/^[A-Z][A-Z0-9_]*$/.test(aliased)) return aliased;
  return null;
}

export function normalizeAdminOrgRolesAgainstCache(roles, { activeOnly = true } = {}) {
  if (!Array.isArray(roles)) return [];
  const allowed = new Set(
    getCachedAdminOrgRoles({ activeOnly }).map((r) => r.key)
  );
  return [
    ...new Set(
      roles
        .map(normalizeAdminOrgRoleKey)
        .filter((key) => key && allowed.has(key))
    ),
  ];
}

export function getPortalSectionsForOrgRolesFromCache(roles) {
  const sections = new Set();
  for (const role of roles ?? []) {
    const row = getCachedAdminOrgRole(role);
    if (!row?.isActive) continue;
    for (const section of row.portalSections) sections.add(section);
  }
  return [...sections];
}

export function rolesGrantSecurityFromCache(roles) {
  return getPortalSectionsForOrgRolesFromCache(roles).includes(PORTAL_SECTIONS.SECURITY);
}

export async function seedDefaultAdminOrgRoles() {
  for (const role of DEFAULT_ADMIN_ORG_ROLES) {
    const existing = await prisma.adminOrgRole.findUnique({ where: { key: role.key } });
    if (existing) continue;
    await prisma.adminOrgRole.create({
      data: {
        key: role.key,
        label: role.label,
        portalSections: role.portalSections,
        isSystem: role.isSystem,
        isActive: true,
        sortOrder: role.sortOrder,
      },
    });
  }
  await refreshAdminOrgRoleCache();
}
