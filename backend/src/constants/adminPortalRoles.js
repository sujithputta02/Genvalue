import {
  getCachedAdminOrgRole,
  getPortalSectionsForOrgRolesFromCache,
  normalizeAdminOrgRoleKey,
  normalizeAdminOrgRolesAgainstCache,
  rolesGrantSecurityFromCache,
} from "../services/adminOrgRoleStore.js";

/** Organizational admin roles — definitions live in DB (`admin_org_roles`). */
export const ADMIN_ORG_ROLES = {
  FOUNDER: { key: "FOUNDER", label: "Founder" },
  COFOUNDER: { key: "COFOUNDER", label: "Co-founder" },
  CTO: { key: "CTO", label: "CTO" },
  CPO: { key: "CPO", label: "CPO" },
  INSTRUCTOR: { key: "INSTRUCTOR", label: "Instructor" },
};

/** @deprecated Prefer DB catalogue via adminOrgRoleStore — kept for seeds/docs. */
export const ALL_ADMIN_ORG_ROLE_KEYS = Object.keys(ADMIN_ORG_ROLES);
export const ADMIN_ORG_ROLE_CHECKLIST = ALL_ADMIN_ORG_ROLE_KEYS;
export const ASSIGNABLE_ADMIN_ORG_ROLES = ALL_ADMIN_ORG_ROLE_KEYS;

export const SUPER_ADMIN_ORG_ROLES = ["CTO"];

export const PORTAL_SECTIONS = {
  ANALYTICS: "ANALYTICS",
  STUDENTS: "STUDENTS",
  ANNOUNCEMENTS: "ANNOUNCEMENTS",
  AUDIT_LOGS: "AUDIT_LOGS",
  DISPATCH: "DISPATCH",
  SECURITY: "SECURITY",
  BUG_REPORTS: "BUG_REPORTS",
};

/** Sections a super admin can explicitly grant beyond org-role defaults. */
export const GRANTABLE_PORTAL_SECTIONS = [PORTAL_SECTIONS.SECURITY];

export function normalizeAdminOrgRole(role) {
  return normalizeAdminOrgRoleKey(role);
}

export function isValidAdminOrgRole(role) {
  return Boolean(getCachedAdminOrgRole(role)?.isActive);
}

export function isAssignableAdminOrgRole(role) {
  return isValidAdminOrgRole(role);
}

export function normalizeAdminOrgRoles(roles) {
  return normalizeAdminOrgRolesAgainstCache(roles, { activeOnly: true });
}

export function getPortalSectionsForOrgRoles(roles) {
  return getPortalSectionsForOrgRolesFromCache(roles);
}

export function rolesGrantSecurityAccess(roles) {
  return rolesGrantSecurityFromCache(roles);
}

export function normalizePortalSections(sections) {
  if (!Array.isArray(sections)) return [];
  return [
    ...new Set(
      sections.filter((section) => GRANTABLE_PORTAL_SECTIONS.includes(section))
    ),
  ];
}

export function getEffectivePortalSections(admin) {
  if (!admin) return [];
  if (admin.isSuperAdmin) return Object.values(PORTAL_SECTIONS);
  const fromRoles = getPortalSectionsForOrgRoles(admin.roles);
  const extras = normalizePortalSections(admin.portalSections);
  return [...new Set([...fromRoles, ...extras])];
}

export function adminHasPortalSection(admin, section) {
  if (!admin) return false;
  if (admin.isSuperAdmin) return true;
  if (Array.isArray(admin.effectivePortalSections)) {
    return admin.effectivePortalSections.includes(section);
  }
  return getEffectivePortalSections(admin).includes(section);
}

/** @deprecated use adminHasPortalSection — kept for route middleware param names */
export function adminHasPortalRole(admin, section) {
  return adminHasPortalSection(admin, section);
}
