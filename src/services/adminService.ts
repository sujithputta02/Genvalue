import type { AdminModuleDetail } from "@/types/moduleEditor";
import type { SecurityReport } from "@/types/security";
import type { SystemHealthReport } from "@/types/systemHealth";
import { API_URL, wrapBackendFetchError } from "@/lib/api";
import { clearPortalSessionId } from "@/lib/lmsSession";
import {
  clearAdminPortalSessionId,
  generateAdminPortalSessionId,
  getStoredAdminPortalSessionId,
  persistAdminPortalSessionId,
  toAdminPortalPath,
} from "@/lib/adminPortalSession";

import {
  ADMIN_AUTH_COOKIE,
  ADMIN_AUTH_TOKEN_KEY,
  ADMIN_TOKEN_PREFIX,
  isAdminTokenValue,
  LMS_AUTH_TOKEN_KEY,
} from "@/lib/authTokens";
import type { AdminOrgRoleDefinition, PortalSectionKey } from "@/lib/adminRoles";
const ADMIN_PROFILE_CACHE_KEY = "adminProfileCache";

export type AdminOrgRoleKey = string;

export interface AdminProfile {
  userId: string;
  email: string;
  role: string;
  name: string;
  isSuperAdmin: boolean;
  roles: AdminOrgRoleKey[];
  portalSections?: PortalSectionKey[];
  effectivePortalSections?: PortalSectionKey[];
  userLimit: number | null;
}

interface AdminSessionPayload extends AdminProfile {
  exp: number;
  effectivePortalSections?: PortalSectionKey[];
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
}

function readStoredAdminToken(): string | null {
  if (typeof window === "undefined") return null;

  const dedicated = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
  if (isAdminTokenValue(dedicated)) return dedicated;

  const legacy = localStorage.getItem(LMS_AUTH_TOKEN_KEY);
  if (isAdminTokenValue(legacy)) return legacy;

  return null;
}

/** Read admin session payload from the stored token (client-side expiry check only). */
export function parseAdminSessionToken(token?: string | null): AdminSessionPayload | null {
  if (typeof window === "undefined") return null;

  const value = token ?? readStoredAdminToken();
  if (!value || !isAdminTokenValue(value)) return null;

  const raw = value.slice(ADMIN_TOKEN_PREFIX.length);
  const dotIndex = raw.lastIndexOf(".");
  if (dotIndex <= 0) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(raw.slice(0, dotIndex))) as AdminSessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function profileFromAdminToken(token?: string | null): AdminProfile | null {
  const payload = parseAdminSessionToken(token);
  if (!payload) return null;

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    name: payload.name,
    isSuperAdmin: payload.isSuperAdmin,
    roles: payload.roles ?? [],
    portalSections: payload.portalSections ?? [],
    effectivePortalSections: payload.effectivePortalSections ?? [],
    userLimit: payload.userLimit,
  };
}

export function cacheAdminProfile(profile: AdminProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_PROFILE_CACHE_KEY, JSON.stringify(profile));
}

/** Profile from token or last successful /admin/me response - survives hot reload and brief API outages. */
export function getCachedAdminProfile(): AdminProfile | null {
  const fromToken = profileFromAdminToken();
  if (fromToken) return fromToken;

  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(ADMIN_PROFILE_CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached) as AdminProfile;
  } catch {
    return null;
  }
}

export interface AdminPortalSettings {
  maxAuthorizedAdmins: number;
  activeAdminCount: number;
  remainingSlots: number;
  canEditLimit: boolean;
}

export interface AuthorizedAdmin {
  id: string;
  email: string;
  name: string | null;
  isSuperAdmin: boolean;
  isActive: boolean;
  roles: AdminOrgRoleKey[];
  portalSections: PortalSectionKey[];
  userLimit: number | null;
  addedByEmail: string | null;
  createdAt: string;
  timezone?: string | null;
  lastLoginAt?: string | null;
  lastLogoutAt?: string | null;
}

export interface AdminAuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress: string | null;
  timestamp: string;
}

export interface AdminAuditLogsMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminAuditLogsResult {
  logs: AdminAuditLog[];
  meta: AdminAuditLogsMeta;
}

export interface AdminAnalytics {
  totalRegistered: number;
  studentCount: number;
  activePrograms: number;
  programLabel: string;
  submissionsEvaluated: number;
  completionRate: number;
  recentAuditLogs: AdminAuditLog[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  authProvider: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  deactivatedUntil?: string | null;
  deactivationReason?: string | null;
  isDeactivated?: boolean;
}

export const DEACTIVATION_DAY_OPTIONS = [7, 14, 30, 90] as const;
export type DeactivationDays = (typeof DEACTIVATION_DAY_OPTIONS)[number];

export interface AdminUsersStats {
  totalStudents: number;
  newThisWeek: number;
  activeLast30Days: number;
  neverLoggedIn: number;
}

export interface AdminUsersMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: AdminUsersStats;
  userLimit?: number;
  capped?: boolean;
}

export interface AdminUsersResult {
  users: AdminUser[];
  meta: AdminUsersMeta;
}

export function isValidAdminToken(): boolean {
  if (typeof window === "undefined") return false;
  const token = readStoredAdminToken();
  return !!token && !!parseAdminSessionToken(token);
}

export function getAdminAuthToken(): string | null {
  if (typeof window === "undefined" || !isValidAdminToken()) return null;
  return readStoredAdminToken();
}

export function getAdminAuthHeaders(): HeadersInit {
  const token = getAdminAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getAdminProfile(): Promise<AdminProfile | null> {
  if (!isValidAdminToken()) {
    return null;
  }

  const cached = getCachedAdminProfile();

  try {
    const response = await fetch(`${API_URL}/auth/admin/me`, {
      headers: getAdminAuthHeaders(),
    });

    if (response.status === 401 || response.status === 403) {
      return null;
    }

    if (!response.ok) {
      return cached;
    }

    const data = await response.json();
    const profile = (data.data ?? null) as AdminProfile | null;
    if (profile) {
      cacheAdminProfile(profile);
    }
    return profile ?? cached;
  } catch {
    return cached;
  }
}

export async function listAuthorizedAdmins(): Promise<AuthorizedAdmin[]> {
  const response = await fetch(`${API_URL}/auth/admin/authorized-emails`, {
    headers: getAdminAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to load authorized admins");
  }

  return data.data ?? [];
}

export async function getAdminPortalSettings(): Promise<AdminPortalSettings> {
  const response = await fetch(`${API_URL}/auth/admin/portal-settings`, {
    headers: getAdminAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to load portal settings");
  }

  return data.data;
}

export async function updateAdminPortalSettings(maxAuthorizedAdmins: number): Promise<AdminPortalSettings> {
  const response = await fetch(`${API_URL}/auth/admin/portal-settings`, {
    method: "PATCH",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({ maxAuthorizedAdmins }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update admin email limit");
  }

  return data.data;
}

export async function addAuthorizedAdmin(
  email: string,
  options: {
    name?: string;
    roles: AdminOrgRoleKey[];
    userLimit?: number | null;
    isSuperAdmin?: boolean;
    portalSections?: PortalSectionKey[];
  }
): Promise<{ emailSent: boolean; message: string }> {
  const response = await fetch(`${API_URL}/auth/admin/authorized-emails`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({
      email,
      name: options.name,
      roles: options.roles,
      userLimit: options.userLimit ?? null,
      isSuperAdmin: options.isSuperAdmin ?? false,
      portalSections: options.portalSections ?? [],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to add admin email");
  }

  return {
    emailSent: Boolean(data.emailSent),
    message: typeof data.message === "string" ? data.message : "Admin email authorized",
  };
}

export async function updateAuthorizedAdmin(
  email: string,
  options: {
    name?: string;
    roles: AdminOrgRoleKey[];
    userLimit?: number | null;
    isSuperAdmin?: boolean;
    portalSections?: PortalSectionKey[];
  }
): Promise<void> {
  const response = await fetch(
    `${API_URL}/auth/admin/authorized-emails/${encodeURIComponent(email)}`,
    {
      method: "PATCH",
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({
        name: options.name,
        roles: options.roles,
        userLimit: options.userLimit ?? null,
        isSuperAdmin: options.isSuperAdmin,
        portalSections: options.portalSections ?? [],
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update admin permissions");
  }
}

export async function removeAuthorizedAdmin(email: string): Promise<void> {
  const response = await fetch(
    `${API_URL}/auth/admin/authorized-emails/${encodeURIComponent(email)}`,
    {
      method: "DELETE",
      headers: getAdminAuthHeaders(),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to revoke admin access");
  }
}

/** Best-effort: record logout time before clearing the local admin session. */
export async function recordAdminLogout(): Promise<void> {
  if (!isValidAdminToken()) return;
  try {
    await fetch(`${API_URL}/auth/admin/logout`, {
      method: "POST",
      headers: getAdminAuthHeaders(),
      keepalive: true,
    });
  } catch {
    // Session clear should still proceed even if logging fails.
  }
}

export async function listAdminOrgRoles(includeInactive = false): Promise<{
  roles: AdminOrgRoleDefinition[];
  portalSections: PortalSectionKey[];
}> {
  const query = includeInactive ? "?includeInactive=true" : "";
  const response = await fetch(`${API_URL}/auth/admin/org-roles${query}`, {
    headers: getAdminAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to load org roles");
  }
  return {
    roles: (data.data?.roles ?? []) as AdminOrgRoleDefinition[],
    portalSections: (data.data?.portalSections ?? []) as PortalSectionKey[],
  };
}

export async function createAdminOrgRole(payload: {
  label: string;
  key?: string;
  portalSections: PortalSectionKey[];
}): Promise<AdminOrgRoleDefinition> {
  const response = await fetch(`${API_URL}/auth/admin/org-roles`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create role");
  }
  return data.data as AdminOrgRoleDefinition;
}

export async function updateAdminOrgRole(
  key: string,
  payload: {
    label?: string;
    portalSections?: PortalSectionKey[];
    isActive?: boolean;
    sortOrder?: number;
  }
): Promise<AdminOrgRoleDefinition> {
  const response = await fetch(
    `${API_URL}/auth/admin/org-roles/${encodeURIComponent(key)}`,
    {
      method: "PATCH",
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update role");
  }
  return data.data as AdminOrgRoleDefinition;
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const response = await fetch(`${API_URL}/admin/analytics`, {
    headers: getAdminAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to load admin analytics");
  }

  return data.data;
}

export async function listAdminUsers(params?: {
  search?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminUsersResult> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.role) query.set("role", params.role);
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("pageSize", String(params.pageSize));

  const qs = query.toString();
  const response = await fetch(`${API_URL}/admin/users${qs ? `?${qs}` : ""}`, {
    headers: getAdminAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to load users");
  }

  return {
    users: data.data ?? [],
    meta: data.meta ?? {
      total: 0,
      page: 1,
      pageSize: 15,
      totalPages: 1,
      stats: {
        totalStudents: 0,
        newThisWeek: 0,
        activeLast30Days: 0,
        neverLoggedIn: 0,
      },
    },
  };
}

export async function removeStudent(userId: string, reason: string): Promise<void> {
  const response = await fetch(`${API_URL}/admin/users/${encodeURIComponent(userId)}/remove`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({ reason: reason.trim() }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to remove student");
  }
}

export async function deactivateStudent(
  userId: string,
  days: DeactivationDays,
  reason: string
): Promise<{ deactivatedUntil: string | null; days: number }> {
  const response = await fetch(
    `${API_URL}/admin/users/${encodeURIComponent(userId)}/deactivate`,
    {
      method: "POST",
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({ days, reason: reason.trim() }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to deactivate student");
  }

  return {
    deactivatedUntil: data.data?.deactivatedUntil ?? null,
    days: data.data?.days ?? days,
  };
}

export async function reactivateStudent(userId: string): Promise<void> {
  const response = await fetch(
    `${API_URL}/admin/users/${encodeURIComponent(userId)}/reactivate`,
    {
      method: "POST",
      headers: getAdminAuthHeaders(),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to reactivate student");
  }
}

export interface AdminCourseWeek {
  moduleId: string;
  week: number;
  title: string;
  description: string;
  status: string;
  isReleased: boolean;
  difficultyLevel?: string;
  estimatedMinutes?: number | null;
  lessonCount?: number;
  topicsCount?: number;
  resourceCount?: number;
  videoCount?: number;
  hasQuiz?: boolean;
  hasAssignment?: boolean;
  learningOutcomes?: string[];
  /** @deprecated legacy card fields */
  topics?: string[];
  videoUrl?: string | null;
  pdfUrl?: string | null;
  objectives?: string;
}

export interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  duration: string;
  level: string;
  status: string;
  enrollmentCount: number;
  createdAt: string;
  updatedAt: string;
  weeks: AdminCourseWeek[];
}

export async function listAdminCourses(): Promise<AdminCourse[]> {
  const response = await fetch(`${API_URL}/admin/courses`, {
    headers: getAdminAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to load courses");
  }

  return data.data ?? [];
}

export async function createAdminCourse(payload: {
  title: string;
  slug: string;
  description?: string;
  level?: string;
  duration?: string;
  status?: string;
  weekCount?: number;
}): Promise<AdminCourse> {
  const response = await fetch(`${API_URL}/admin/courses`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create course");
  }

  return data.data;
}

export async function updateAdminCourse(
  courseId: string,
  payload: Partial<Pick<AdminCourse, "title" | "slug" | "description" | "level" | "duration" | "status">>
): Promise<AdminCourse> {
  const response = await fetch(`${API_URL}/admin/courses/${encodeURIComponent(courseId)}`, {
    method: "PUT",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update course");
  }

  return data.data;
}

export async function deleteAdminCourse(courseId: string): Promise<void> {
  const response = await fetch(`${API_URL}/admin/courses/${encodeURIComponent(courseId)}`, {
    method: "DELETE",
    headers: getAdminAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete course");
  }
}

export async function updateAdminCourseWeek(
  courseId: string,
  weekNumber: number,
  payload: Partial<AdminCourseWeek>
): Promise<AdminCourseWeek> {
  const response = await fetch(
    `${API_URL}/admin/courses/${encodeURIComponent(courseId)}/weeks/${weekNumber}`,
    {
      method: "PUT",
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update week");
  }

  return data.data;
}

export async function getAdminModuleDetail(
  courseId: string,
  weekNumber: number
): Promise<AdminModuleDetail> {
  const response = await fetch(
    `${API_URL}/admin/courses/${encodeURIComponent(courseId)}/modules/${weekNumber}`,
    { headers: getAdminAuthHeaders() }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to load module");
  }

  return data.data;
}

export async function updateAdminModuleDetail(
  courseId: string,
  weekNumber: number,
  payload: Partial<AdminModuleDetail>
): Promise<AdminModuleDetail> {
  const response = await fetch(
    `${API_URL}/admin/courses/${encodeURIComponent(courseId)}/modules/${weekNumber}`,
    {
      method: "PUT",
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to save module");
  }

  return data.data;
}

export async function getAdminAuditLogs(params?: {
  action?: string;
  search?: string;
  days?: number;
  page?: number;
  pageSize?: number;
}): Promise<AdminAuditLogsResult> {
  const query = new URLSearchParams();
  if (params?.action && params.action !== "ALL") query.set("action", params.action);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.days) query.set("days", String(params.days));
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("pageSize", String(params.pageSize));

  const qs = query.toString();
  const response = await fetch(`${API_URL}/admin/audit-logs${qs ? `?${qs}` : ""}`, {
    headers: getAdminAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to load audit logs");
  }

  return {
    logs: data.data ?? [],
    meta: data.meta ?? { total: 0, page: 1, pageSize: 12, totalPages: 1 },
  };
}

export async function getAdminSecurityReport(): Promise<SecurityReport> {
  try {
    const response = await fetch(`${API_URL}/admin/security/report`, {
      headers: getAdminAuthHeaders(),
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to load security report");
    }

    return data.data;
  } catch (err) {
    throw wrapBackendFetchError(err, "Failed to load security report");
  }
}

export async function getAdminSystemHealth(): Promise<SystemHealthReport> {
  try {
    const response = await fetch(`${API_URL}/admin/system-health`, {
      headers: getAdminAuthHeaders(),
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to load system health");
    }

    return data.data;
  } catch (err) {
    throw wrapBackendFetchError(err, "Failed to load system health");
  }
}

export async function updateAdminSystemMaintenance(payload: {
  enabled: boolean;
  message?: string;
}): Promise<SystemHealthReport["maintenance"]> {
  try {
    const response = await fetch(`${API_URL}/admin/system-health/maintenance`, {
      method: "PATCH",
      headers: {
        ...getAdminAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to update maintenance mode");
    }

    return data.data;
  } catch (err) {
    throw wrapBackendFetchError(err, "Failed to update maintenance mode");
  }
}

export async function recycleAdminDatabasePool(): Promise<{
  latencyMs: number;
  detail: string;
  recycledAt: string;
}> {
  try {
    const response = await fetch(`${API_URL}/admin/system-health/recycle-db`, {
      method: "POST",
      headers: getAdminAuthHeaders(),
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to recycle database pool");
    }

    return data.data;
  } catch (err) {
    throw wrapBackendFetchError(err, "Failed to recycle database pool");
  }
}

export async function getPublicPlatformStatus(): Promise<{
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  checkedAt: string;
}> {
  try {
    const response = await fetch(`${API_URL}/platform/status`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to load platform status");
    }
    return data.data;
  } catch (err) {
    throw wrapBackendFetchError(err, "Failed to load platform status");
  }
}

/** Clears admin UI caches in this browser without signing the admin out. */
export function clearAdminBrowserCaches(): { cleared: string[] } {
  const cleared: string[] = [];
  if (typeof window === "undefined") return { cleared };

  const keys = [ADMIN_PROFILE_CACHE_KEY, "adminSearchRecent"];
  for (const key of keys) {
    if (localStorage.getItem(key) != null) {
      localStorage.removeItem(key);
      cleared.push(key);
    }
  }

  try {
    sessionStorage.clear();
    cleared.push("sessionStorage");
  } catch {
    /* ignore */
  }

  return { cleared };
}


export interface AdminAssignmentRecord {
  id: string;
  week: number;
  title: string;
  description: string | null;
  instructions: string | null;
  type: "PDF" | "MCQ" | "MIXED";
  isRequired: boolean;
  questions: string | unknown[] | null;
  passingScore: number | null;
  dueDate: string;
  status: string;
  createdAt: string;
}

function wrapAdminFetchError(err: unknown, fallback: string): Error {
  return wrapBackendFetchError(err, fallback);
}

export async function listAdminAssignments(): Promise<AdminAssignmentRecord[]> {
  try {
    const response = await fetch(`${API_URL}/admin/assignments`, {
      headers: getAdminAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to load assignments");
    }

    return data.data ?? [];
  } catch (err) {
    throw wrapAdminFetchError(err, "Failed to load assignments");
  }
}

export async function createAdminAssignment(
  payload: Record<string, unknown>
): Promise<AdminAssignmentRecord> {
  try {
    const response = await fetch(`${API_URL}/admin/assignments`, {
      method: "POST",
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to create assignment");
    }

    return data.data;
  } catch (err) {
    throw wrapAdminFetchError(err, "Failed to create assignment");
  }
}

export async function updateAdminAssignment(
  assignmentId: string,
  payload: Record<string, unknown>
): Promise<AdminAssignmentRecord> {
  try {
    const response = await fetch(`${API_URL}/admin/assignments/${encodeURIComponent(assignmentId)}`, {
      method: "PUT",
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to update assignment");
    }

    return data.data;
  } catch (err) {
    throw wrapAdminFetchError(err, "Failed to update assignment");
  }
}

export async function deleteAdminAssignment(assignmentId: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/admin/assignments/${encodeURIComponent(assignmentId)}`, {
      method: "DELETE",
      headers: getAdminAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to delete assignment");
    }
  } catch (err) {
    throw wrapAdminFetchError(err, "Failed to delete assignment");
  }
}

export interface AdminSubmissionAssignment {
  id: string;
  week: number;
  title: string;
  type: "PDF" | "MCQ" | "MIXED";
  passingScore: number | null;
  questionCount: number;
}

export interface AdminSubmissionUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AdminSubmissionRecord {
  id: string;
  userId: string;
  assignmentId: string;
  submissionType: "PDF" | "MCQ" | "MIXED";
  pdfUrl: string | null;
  answers: unknown[] | null;
  quizScore: number | null;
  grade: number | null;
  feedback: string | null;
  status: string;
  submittedAt: string | null;
  gradedAt: string | null;
  createdAt: string;
  needsManualReview: boolean;
  user: AdminSubmissionUser;
  assignment: AdminSubmissionAssignment | null;
}

export interface AdminSubmissionsMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminSubmissionsResult {
  submissions: AdminSubmissionRecord[];
  meta: AdminSubmissionsMeta;
}

export interface AdminSubmissionsFilters {
  page?: number;
  pageSize?: number;
  week?: number;
  status?: string;
  type?: string;
  search?: string;
  needsReview?: boolean;
}

export async function listAdminSubmissions(
  filters: AdminSubmissionsFilters = {}
): Promise<AdminSubmissionsResult> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters.week) params.set("week", String(filters.week));
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  if (filters.search) params.set("search", filters.search);
  if (filters.needsReview) params.set("needsReview", "true");

  const query = params.toString();
  const url = `${API_URL}/admin/submissions${query ? `?${query}` : ""}`;

  try {
    const response = await fetch(url, {
      headers: getAdminAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to load submissions");
    }

    return {
      submissions: data.data ?? [],
      meta: data.meta ?? { total: 0, page: 1, pageSize: 20, totalPages: 1 },
    };
  } catch (err) {
    throw wrapAdminFetchError(err, "Failed to load submissions");
  }
}

export async function gradeAdminSubmission(
  submissionId: string,
  payload: { grade: number; feedback?: string }
): Promise<AdminSubmissionRecord> {
  try {
    const response = await fetch(`${API_URL}/admin/submissions/${encodeURIComponent(submissionId)}/grade`, {
      method: "PUT",
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to grade submission");
    }

    return data.data;
  } catch (err) {
    throw wrapAdminFetchError(err, "Failed to grade submission");
  }
}

export interface AdminQuizQuestion {
  id: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER";
  question: string;
  options?: string[];
  correctAnswer: string | number | boolean;
  points: number;
}

export interface AdminQuizRecord {
  id: string;
  week: number;
  title: string;
  description: string;
  duration: number;
  passingScore: number;
  questions: AdminQuizQuestion[] | string;
  createdAt?: string;
  updatedAt?: string;
}

export async function listAdminQuizzes(): Promise<AdminQuizRecord[]> {
  try {
    const response = await fetch(`${API_URL}/admin/quizzes`, {
      headers: getAdminAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to load quizzes");
    }

    return data.data ?? [];
  } catch (err) {
    throw wrapAdminFetchError(err, "Failed to load quizzes");
  }
}

export async function createAdminQuiz(payload: Record<string, unknown>): Promise<AdminQuizRecord> {
  try {
    const response = await fetch(`${API_URL}/admin/quizzes`, {
      method: "POST",
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to create quiz");
    }

    return data.data;
  } catch (err) {
    throw wrapAdminFetchError(err, "Failed to create quiz");
  }
}

export async function updateAdminQuiz(
  quizId: string,
  payload: Record<string, unknown>
): Promise<AdminQuizRecord> {
  try {
    const response = await fetch(`${API_URL}/admin/quizzes/${encodeURIComponent(quizId)}`, {
      method: "PUT",
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to update quiz");
    }

    return data.data;
  } catch (err) {
    throw wrapAdminFetchError(err, "Failed to update quiz");
  }
}

export async function deleteAdminQuiz(quizId: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/admin/quizzes/${encodeURIComponent(quizId)}`, {
      method: "DELETE",
      headers: getAdminAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to delete quiz");
    }
  } catch (err) {
    throw wrapAdminFetchError(err, "Failed to delete quiz");
  }
}

/** Persist admin OTP session with a fresh obfuscated portal slug. */
export function storeAdminAuthSession(adminToken: string, profile: AdminProfile): string {
  const sessionId = generateAdminPortalSessionId();

  clearPortalSessionId();
  localStorage.removeItem(LMS_AUTH_TOKEN_KEY);
  localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, adminToken);
  localStorage.setItem("userRole", profile.role);
  localStorage.setItem("adminEmail", profile.email);
  localStorage.setItem("isSuperAdmin", String(profile.isSuperAdmin));
  persistAdminPortalSessionId(sessionId);
  cacheAdminProfile(profile);

  const maxAge = 30 * 24 * 60 * 60;
  document.cookie = `${ADMIN_AUTH_COOKIE}=${adminToken}; path=/; max-age=${maxAge}; SameSite=Strict`;
  document.cookie = `${LMS_AUTH_TOKEN_KEY}=; path=/; max-age=0`;
  document.cookie = `userRole=${profile.role}; path=/; max-age=${maxAge}; SameSite=Strict`;

  return sessionId;
}

/** Re-sync admin portal cookie after refresh (does not rotate slug). */
export function restoreAdminSessionIfNeeded(): string | null {
  if (typeof window === "undefined") return null;

  const sessionId = getStoredAdminPortalSessionId();
  if (!sessionId || !isValidAdminToken()) return null;

  persistAdminPortalSessionId(sessionId);

  const token = readStoredAdminToken();
  const role = localStorage.getItem("userRole");
  if (token && role) {
    const maxAge = 30 * 24 * 60 * 60;
    document.cookie = `${ADMIN_AUTH_COOKIE}=${token}; path=/; max-age=${maxAge}; SameSite=Strict`;
    document.cookie = `userRole=${role}; path=/; max-age=${maxAge}; SameSite=Strict`;
  }

  return sessionId;
}

export function getAdminPortalRedirect(sessionId?: string, internalPath = "/admin"): string {
  const sid = sessionId ?? getStoredAdminPortalSessionId();
  if (!sid) return "/admin/auth/login";
  return toAdminPortalPath(sid, internalPath);
}

/** Clear admin OTP session without removing a valid Firebase LMS token. */
export function clearAdminPortalSessionOnly(): void {
  clearAdminPortalSessionId();
  localStorage.removeItem("adminEmail");
  localStorage.removeItem("isSuperAdmin");
  localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
  document.cookie = `${ADMIN_AUTH_COOKIE}=; path=/; max-age=0`;

  const legacy = localStorage.getItem(LMS_AUTH_TOKEN_KEY);
  if (isAdminTokenValue(legacy)) {
    localStorage.removeItem(LMS_AUTH_TOKEN_KEY);
    localStorage.removeItem("userRole");
    document.cookie = `${LMS_AUTH_TOKEN_KEY}=; path=/; max-age=0`;
    document.cookie = "userRole=; path=/; max-age=0";
  }
}

export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
  localStorage.removeItem("userRole");
  localStorage.removeItem("adminEmail");
  localStorage.removeItem("isSuperAdmin");
  localStorage.removeItem(ADMIN_PROFILE_CACHE_KEY);
  clearAdminPortalSessionId();
  document.cookie = `${ADMIN_AUTH_COOKIE}=; path=/; max-age=0`;
  document.cookie = "userRole=; path=/; max-age=0";

  const legacy = localStorage.getItem(LMS_AUTH_TOKEN_KEY);
  if (isAdminTokenValue(legacy)) {
    localStorage.removeItem(LMS_AUTH_TOKEN_KEY);
    document.cookie = `${LMS_AUTH_TOKEN_KEY}=; path=/; max-age=0`;
  }
}

export function isAdminAuthenticated(): boolean {
  const role = localStorage.getItem("userRole");
  return isValidAdminToken() && (role === "ADMIN" || role === "SUPER_ADMIN");
}

/** Clear stale non-admin tokens left from student/instructor login */
export function clearStaleNonAdminTokens(): void {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem(LMS_AUTH_TOKEN_KEY);
  if (token && !isAdminTokenValue(token)) {
    clearAdminSession();
  }
}
