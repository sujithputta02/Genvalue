/** Organizational admin roles assigned by the super admin. */
import { toAdminPortalPath } from "@/lib/adminPortalSession";

export type PortalSectionKey =
  | "ANALYTICS"
  | "STUDENTS"
  | "ANNOUNCEMENTS"
  | "AUDIT_LOGS"
  | "DISPATCH"
  | "SECURITY"
  | "BUG_REPORTS";

/** Fallback labels when role catalogue has not loaded yet. */
export const ADMIN_ORG_ROLES: Record<string, { key: string; label: string }> = {
  FOUNDER: { key: "FOUNDER", label: "Founder" },
  COFOUNDER: { key: "COFOUNDER", label: "Co-founder" },
  CTO: { key: "CTO", label: "CTO" },
  CPO: { key: "CPO", label: "CPO" },
  INSTRUCTOR: { key: "INSTRUCTOR", label: "Instructor" },
};

export type AdminOrgRoleKey = string;

export const ADMIN_ORG_ROLE_LIST = Object.values(ADMIN_ORG_ROLES);
/** @deprecated Prefer roles loaded from GET /auth/admin/org-roles */
export const ADMIN_ORG_ROLE_CHECKLIST = ADMIN_ORG_ROLE_LIST;

export const ALL_PORTAL_SECTIONS: PortalSectionKey[] = [
  "ANALYTICS",
  "STUDENTS",
  "ANNOUNCEMENTS",
  "AUDIT_LOGS",
  "DISPATCH",
  "SECURITY",
  "BUG_REPORTS",
];

export const GRANTABLE_PORTAL_SECTIONS: PortalSectionKey[] = ["SECURITY"];

export const GRANTABLE_PORTAL_SECTION_LABELS: Record<PortalSectionKey, string> = {
  ANALYTICS: "Analytics",
  STUDENTS: "Student Roster",
  ANNOUNCEMENTS: "Announcements",
  AUDIT_LOGS: "System Audit Logs",
  DISPATCH: "Dispatch",
  SECURITY: "Portal Security",
  BUG_REPORTS: "Bug Reports",
};

export interface AdminOrgRoleDefinition {
  id?: string;
  key: string;
  label: string;
  portalSections: PortalSectionKey[];
  isActive?: boolean;
  isSystem?: boolean;
  sortOrder?: number;
}

/** Nav href → required portal section */
export const ADMIN_NAV_SECTION_MAP: Record<string, PortalSectionKey> = {
  "/admin": "ANALYTICS",
  "/admin/students": "STUDENTS",
  "/admin/announcements": "ANNOUNCEMENTS",
  "/admin/dispatch": "DISPATCH",
  "/admin/audit-logs": "AUDIT_LOGS",
  "/admin/security": "SECURITY",
  "/admin/bug-reports": "BUG_REPORTS",
};

const FALLBACK_ROLE_SECTIONS: Record<string, PortalSectionKey[]> = {
  FOUNDER: [...ALL_PORTAL_SECTIONS],
  COFOUNDER: [...ALL_PORTAL_SECTIONS],
  CTO: ALL_PORTAL_SECTIONS.filter((s) => s !== "SECURITY"),
  CPO: ALL_PORTAL_SECTIONS.filter((s) => s !== "SECURITY"),
  INSTRUCTOR: ["STUDENTS", "ANNOUNCEMENTS", "DISPATCH", "BUG_REPORTS"],
};

function getPortalSectionsForOrgRoles(
  roles: string[] | undefined,
  catalogue?: AdminOrgRoleDefinition[] | null
): PortalSectionKey[] {
  const sections = new Set<PortalSectionKey>();
  const byKey = new Map((catalogue ?? []).map((role) => [role.key, role]));

  for (const role of roles ?? []) {
    const fromCatalogue = byKey.get(role);
    if (fromCatalogue) {
      for (const section of fromCatalogue.portalSections) {
        if (ALL_PORTAL_SECTIONS.includes(section)) sections.add(section);
      }
      continue;
    }
    const fallback = FALLBACK_ROLE_SECTIONS[role];
    if (fallback) {
      for (const section of fallback) sections.add(section);
    }
  }
  return [...sections];
}

export function adminHasPortalSection(
  profile:
    | {
        isSuperAdmin?: boolean;
        roles?: string[];
        portalSections?: string[];
        effectivePortalSections?: string[];
      }
    | null
    | undefined,
  section: PortalSectionKey,
  catalogue?: AdminOrgRoleDefinition[] | null
): boolean {
  if (!profile) return false;
  if (profile.isSuperAdmin) return true;
  if (Array.isArray(profile.effectivePortalSections)) {
    return profile.effectivePortalSections.includes(section);
  }
  if (getPortalSectionsForOrgRoles(profile.roles, catalogue).includes(section)) return true;
  const extras = (profile.portalSections ?? []).filter((value): value is PortalSectionKey =>
    GRANTABLE_PORTAL_SECTIONS.includes(value as PortalSectionKey)
  );
  return extras.includes(section);
}

export function rolesGrantSecurityAccess(
  roles: string[] | undefined,
  catalogue?: AdminOrgRoleDefinition[] | null
): boolean {
  return getPortalSectionsForOrgRoles(roles, catalogue).includes("SECURITY");
}

const NAV_ROUTE_ORDER: { href: string; section: PortalSectionKey }[] = [
  { href: "/admin", section: "ANALYTICS" },
  { href: "/admin/students", section: "STUDENTS" },
  { href: "/admin/announcements", section: "ANNOUNCEMENTS" },
  { href: "/admin/dispatch", section: "DISPATCH" },
  { href: "/admin/bug-reports", section: "BUG_REPORTS" },
  { href: "/admin/audit-logs", section: "AUDIT_LOGS" },
  { href: "/admin/security", section: "SECURITY" },
];

export function getFirstAllowedAdminHref(
  profile: {
    isSuperAdmin?: boolean;
    roles?: string[];
    portalSections?: string[];
    effectivePortalSections?: string[];
  } | null | undefined,
  sessionId?: string | null,
  catalogue?: AdminOrgRoleDefinition[] | null
): string {
  const match = NAV_ROUTE_ORDER.find((item) =>
    adminHasPortalSection(profile, item.section, catalogue)
  );
  const internal = match?.href ?? "/admin/auth/login";
  if (!sessionId || internal === "/admin/auth/login") return internal;
  return toAdminPortalPath(sessionId, internal);
}

export function getOrgRoleLabel(
  role: string,
  catalogue?: AdminOrgRoleDefinition[] | null
): string {
  const fromCatalogue = catalogue?.find((item) => item.key === role);
  if (fromCatalogue) return fromCatalogue.label;
  return ADMIN_ORG_ROLES[role]?.label ?? role;
}

export function slugifyOrgRoleKey(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}
