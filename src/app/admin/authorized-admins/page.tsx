"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaLock,
  FaPen,
  FaPlus,
  FaShieldHalved,
  FaTrash,
  FaUserShield,
  FaIdBadge,
} from "react-icons/fa6";
import {
  addAuthorizedAdmin,
  createAdminOrgRole,
  getAdminPortalSettings,
  getAdminProfile,
  listAdminOrgRoles,
  listAuthorizedAdmins,
  removeAuthorizedAdmin,
  updateAdminOrgRole,
  updateAdminPortalSettings,
  updateAuthorizedAdmin,
  type AdminOrgRoleKey,
  type AdminPortalSettings,
  type AuthorizedAdmin,
} from "@/services/adminService";
import {
  ALL_PORTAL_SECTIONS,
  GRANTABLE_PORTAL_SECTION_LABELS,
  adminHasPortalSection,
  getFirstAllowedAdminHref,
  getOrgRoleLabel,
  rolesGrantSecurityAccess,
  slugifyOrgRoleKey,
  type AdminOrgRoleDefinition,
  type PortalSectionKey,
} from "@/lib/adminRoles";
import { useAdminPortalPath } from "@/hooks/useAdminPortalPath";
import { ListItemsSkeleton } from "@/components/skeletons";

function formatAdminSessionTime(
  value: string | null | undefined,
  timeZone?: string | null
): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";

  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  };

  try {
    if (timeZone) {
      return date.toLocaleString(undefined, { ...options, timeZone });
    }
  } catch {
    // Fall through to viewer locale if stored zone is invalid.
  }

  return date.toLocaleString(undefined, options);
}

export default function AuthorizedAdminsPage() {
  const router = useRouter();
  const { sessionId } = useAdminPortalPath();
  const [admins, setAdmins] = useState<AuthorizedAdmin[]>([]);
  const [orgRoles, setOrgRoles] = useState<AdminOrgRoleDefinition[]>([]);
  const [portalSettings, setPortalSettings] = useState<AdminPortalSettings | null>(null);
  const [adminEmailLimit, setAdminEmailLimit] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingLimit, setSavingLimit] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<AdminOrgRoleKey[]>(["CTO"]);
  const [userLimit, setUserLimit] = useState("");
  const [grantSuperAdmin, setGrantSuperAdmin] = useState(false);
  const [grantSecurityAccess, setGrantSecurityAccess] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AuthorizedAdmin | null>(null);
  const [editRoles, setEditRoles] = useState<AdminOrgRoleKey[]>([]);
  const [editUserLimit, setEditUserLimit] = useState("");
  const [editGrantSuperAdmin, setEditGrantSuperAdmin] = useState(false);
  const [editGrantSecurityAccess, setEditGrantSecurityAccess] = useState(false);

  const [newRoleLabel, setNewRoleLabel] = useState("");
  const [newRoleKey, setNewRoleKey] = useState("");
  const [newRoleSections, setNewRoleSections] = useState<PortalSectionKey[]>([
    "STUDENTS",
    "ANNOUNCEMENTS",
  ]);
  const [editingRoleKey, setEditingRoleKey] = useState<string | null>(null);
  const [editRoleLabel, setEditRoleLabel] = useState("");
  const [editRoleSections, setEditRoleSections] = useState<PortalSectionKey[]>([]);

  const activeRoleChecklist = useMemo(
    () =>
      orgRoles
        .filter((role) => role.isActive !== false)
        .map((role) => ({ key: role.key, label: role.label })),
    [orgRoles]
  );

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");
      const [adminList, settings, roleCatalogue] = await Promise.all([
        listAuthorizedAdmins(),
        getAdminPortalSettings(),
        listAdminOrgRoles(true),
      ]);
      setAdmins(adminList);
      setPortalSettings(settings);
      setAdminEmailLimit(String(settings.maxAuthorizedAdmins));
      setOrgRoles(roleCatalogue.roles);
      const activeKeys = roleCatalogue.roles
        .filter((role) => role.isActive !== false)
        .map((role) => role.key);
      if (activeKeys.includes("CTO")) {
        setSelectedRoles((prev) =>
          prev.length === 0 || prev.every((key) => activeKeys.includes(key)) ? prev : ["CTO"]
        );
      } else if (activeKeys[0]) {
        setSelectedRoles((prev) =>
          prev.every((key) => activeKeys.includes(key)) ? prev : [activeKeys[0]!]
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load authorized admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAdminProfile().then((profile) => {
      if (!profile?.isSuperAdmin) {
        router.replace(getFirstAllowedAdminHref(profile, sessionId));
        return;
      }
      loadPageData();
    });
  }, [router, sessionId]);

  const buildPortalSections = (
    roles: AdminOrgRoleKey[],
    securityGranted: boolean,
    isSuperAdmin: boolean
  ): PortalSectionKey[] => {
    if (isSuperAdmin || rolesGrantSecurityAccess(roles, orgRoles)) return [];
    return securityGranted ? ["SECURITY"] : [];
  };

  const adminCanViewSecurity = (admin: AuthorizedAdmin): boolean =>
    adminHasPortalSection(
      {
        isSuperAdmin: admin.isSuperAdmin,
        roles: admin.roles,
        portalSections: admin.portalSections,
      },
      "SECURITY",
      orgRoles
    );

  const isPrimarySuperAdmin = (admin: AuthorizedAdmin): boolean =>
    admin.isSuperAdmin && admin.addedByEmail === "system";

  const toggleRole = (
    role: AdminOrgRoleKey,
    current: AdminOrgRoleKey[],
    setter: (roles: AdminOrgRoleKey[]) => void
  ) => {
    setter(current.includes(role) ? current.filter((r) => r !== role) : [...current, role]);
  };

  const toggleSection = (
    section: PortalSectionKey,
    current: PortalSectionKey[],
    setter: (sections: PortalSectionKey[]) => void
  ) => {
    setter(
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section]
    );
  };

  const parseUserLimitInput = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new Error("Student limit must be a positive whole number");
    }
    return parsed;
  };

  const handleSaveAdminLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLimit(true);
    setError("");
    setSuccess("");

    try {
      const parsed = Number(adminEmailLimit);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
        throw new Error("Admin email limit must be between 1 and 100");
      }

      const settings = await updateAdminPortalSettings(parsed);
      setPortalSettings(settings);
      setAdminEmailLimit(String(settings.maxAuthorizedAdmins));
      setSuccess(`Admin email limit set to ${settings.maxAuthorizedAdmins}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update admin email limit");
    } finally {
      setSavingLimit(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRole(true);
    setError("");
    setSuccess("");

    try {
      const label = newRoleLabel.trim();
      if (!label) throw new Error("Role label is required");
      if (newRoleSections.length === 0) {
        throw new Error("Select at least one portal section for the role");
      }

      const created = await createAdminOrgRole({
        label,
        key: newRoleKey.trim() || undefined,
        portalSections: newRoleSections,
      });

      setNewRoleLabel("");
      setNewRoleKey("");
      setNewRoleSections(["STUDENTS", "ANNOUNCEMENTS"]);
      setSuccess(`Role "${created.label}" created. You can assign it to admins below.`);
      await loadPageData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create role");
    } finally {
      setSavingRole(false);
    }
  };

  const openEditRole = (role: AdminOrgRoleDefinition) => {
    setEditingRoleKey(role.key);
    setEditRoleLabel(role.label);
    setEditRoleSections(role.portalSections ?? []);
    setError("");
    setSuccess("");
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoleKey) return;
    setSavingRole(true);
    setError("");
    setSuccess("");

    try {
      const label = editRoleLabel.trim();
      if (!label) throw new Error("Role label is required");
      if (editRoleSections.length === 0) {
        throw new Error("Select at least one portal section for the role");
      }

      const updated = await updateAdminOrgRole(editingRoleKey, {
        label,
        portalSections: editRoleSections,
      });
      setEditingRoleKey(null);
      setSuccess(`Role "${updated.label}" updated.`);
      await loadPageData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeactivateRole = async (role: AdminOrgRoleDefinition) => {
    if (role.isSystem) return;
    if (!confirm(`Deactivate role "${role.label}"? Admins must not be using it.`)) return;

    try {
      setError("");
      await updateAdminOrgRole(role.key, { isActive: false });
      setSuccess(`Role "${role.label}" deactivated.`);
      await loadPageData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to deactivate role");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (!grantSuperAdmin && selectedRoles.length === 0) {
        throw new Error("Select at least one role or grant super admin access");
      }

      if (!grantSuperAdmin && portalSettings && portalSettings.remainingSlots <= 0) {
        throw new Error(
          `Admin email limit reached (${portalSettings.maxAuthorizedAdmins}). Increase the limit or revoke an admin first.`
        );
      }

      const limit = grantSuperAdmin ? null : parseUserLimitInput(userLimit);

      const result = await addAuthorizedAdmin(email, {
        name: name || undefined,
        roles: grantSuperAdmin ? ["CTO"] : selectedRoles,
        userLimit: limit,
        isSuperAdmin: grantSuperAdmin,
        portalSections: buildPortalSections(selectedRoles, grantSecurityAccess, grantSuperAdmin),
      });

      setEmail("");
      setName("");
      setSelectedRoles(["CTO"]);
      setUserLimit("");
      setGrantSuperAdmin(false);
      setGrantSecurityAccess(false);
      setSuccess(
        result.emailSent
          ? `Access granted to ${email.trim().toLowerCase()}. A GenValue welcome email was sent.`
          : `Access granted to ${email.trim().toLowerCase()}, but the welcome email could not be sent. Check Brevo settings.`
      );
      await loadPageData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add admin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (adminEmail: string) => {
    if (!confirm(`Revoke admin access for ${adminEmail}?`)) return;

    try {
      setError("");
      await removeAuthorizedAdmin(adminEmail);
      setSuccess(`Access revoked for ${adminEmail}`);
      await loadPageData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to revoke access");
    }
  };

  const openEdit = (admin: AuthorizedAdmin) => {
    setEditingAdmin(admin);
    setEditRoles(admin.roles ?? []);
    setEditUserLimit(admin.userLimit != null ? String(admin.userLimit) : "");
    setEditGrantSuperAdmin(admin.isSuperAdmin);
    setEditGrantSecurityAccess((admin.portalSections ?? []).includes("SECURITY"));
    setError("");
    setSuccess("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (!editGrantSuperAdmin && editRoles.length === 0) {
        throw new Error("Select at least one role or keep super admin access");
      }

      const limit = editGrantSuperAdmin ? null : parseUserLimitInput(editUserLimit);

      await updateAuthorizedAdmin(editingAdmin.email, {
        roles: editGrantSuperAdmin ? ["CTO"] : editRoles,
        userLimit: limit,
        isSuperAdmin: editGrantSuperAdmin,
        portalSections: buildPortalSections(editRoles, editGrantSecurityAccess, editGrantSuperAdmin),
      });

      setSuccess(`Updated permissions for ${editingAdmin.email}`);
      setEditingAdmin(null);
      await loadPageData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update admin");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm font-medium text-[#2A2A28] outline-none transition focus:border-[#1E3FE0] dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#60A5FA]";

  const RoleCheckboxGroup = ({
    roles,
    selected,
    onToggle,
    idPrefix,
    disabled = false,
  }: {
    roles: { key: string; label: string }[];
    selected: AdminOrgRoleKey[];
    onToggle: (role: AdminOrgRoleKey) => void;
    idPrefix: string;
    disabled?: boolean;
  }) => (
    <div className="grid gap-2 sm:grid-cols-2">
      {roles.length === 0 ? (
        <p className="text-xs text-[#6B6558] dark:text-slate-400 sm:col-span-2">
          No active roles yet. Create a role above first.
        </p>
      ) : (
        roles.map((role) => (
          <label
            key={role.key}
            htmlFor={`${idPrefix}-${role.key}`}
            className={`flex items-center gap-3 rounded-xl border border-black/10 bg-white/40 px-4 py-3 transition dark:border-white/10 dark:bg-white/5 ${
              disabled
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:border-[#1E3FE0]/30 dark:hover:border-[#60A5FA]/30"
            }`}
          >
            <input
              id={`${idPrefix}-${role.key}`}
              type="checkbox"
              checked={selected.includes(role.key)}
              disabled={disabled}
              onChange={() => onToggle(role.key)}
              aria-label={`Assign ${role.label} role`}
              className="h-4 w-4 rounded border-black/20 accent-[#1E3FE0]"
            />
            <span className="text-sm font-semibold text-[#2A2A28] dark:text-white">{role.label}</span>
          </label>
        ))
      )}
    </div>
  );

  const SectionCheckboxGroup = ({
    selected,
    onToggle,
    idPrefix,
  }: {
    selected: PortalSectionKey[];
    onToggle: (section: PortalSectionKey) => void;
    idPrefix: string;
  }) => (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {ALL_PORTAL_SECTIONS.map((section) => (
        <label
          key={section}
          htmlFor={`${idPrefix}-${section}`}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/10 bg-white/40 px-4 py-3 transition hover:border-[#1E3FE0]/30 dark:border-white/10 dark:bg-white/5 dark:hover:border-[#60A5FA]/30"
        >
          <input
            id={`${idPrefix}-${section}`}
            type="checkbox"
            checked={selected.includes(section)}
            onChange={() => onToggle(section)}
            aria-label={`Grant ${GRANTABLE_PORTAL_SECTION_LABELS[section]}`}
            className="h-4 w-4 rounded border-black/20 accent-[#1E3FE0]"
          />
          <span className="text-sm font-semibold text-[#2A2A28] dark:text-white">
            {GRANTABLE_PORTAL_SECTION_LABELS[section]}
          </span>
        </label>
      ))}
    </div>
  );

  const slotsFull = portalSettings != null && portalSettings.remainingSlots <= 0 && !grantSuperAdmin;

  const PermissionToggle = ({
    id,
    label,
    description,
    checked,
    disabled,
    onChange,
  }: {
    id: string;
    label: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 bg-white/40 px-4 py-3 transition dark:border-white/10 dark:bg-white/5 ${
        disabled ? "opacity-60" : "hover:border-[#1E3FE0]/30 dark:hover:border-[#60A5FA]/30"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="mt-0.5 h-4 w-4 rounded border-black/20 accent-[#1E3FE0]"
      />
      <span>
        <span className="block text-sm font-semibold text-[#2A2A28] dark:text-white">{label}</span>
        <span className="mt-0.5 block text-[11px] font-medium text-[#6B6558] dark:text-slate-400">
          {description}
        </span>
      </span>
    </label>
  );

  return (
    <div className="space-y-8">
      <div>
        <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#E8622E]">
          ★ SUPER ADMIN
        </span>
        <h1 className="font-display-custom text-2xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-3xl">
          Authorized Admin Emails
        </h1>
        <p className="text-xs font-medium text-[#6B6558] dark:text-slate-400">
          Create org roles, assign them to admins, and control portal access — no code changes
          required for new titles.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-[#10B981]/20 bg-[#10B981]/10 p-4 text-sm font-bold text-[#10B981]">
          {success}
        </div>
      )}

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleCreateRole}
        className="rounded-2xl border border-[#1E3FE0]/20 bg-[#F6F1E4] p-6 shadow-lg dark:border-[#60A5FA]/30 dark:bg-[#0D1B2A]"
      >
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-[#2A2A28] dark:text-white">
          <FaIdBadge className="h-4 w-4 text-[#1E3FE0]" />
          Create Org Role
        </h2>
        <p className="mb-4 text-xs text-[#6B6558] dark:text-slate-400">
          Roles are stored in the database. Pick which portal sections this title unlocks, then
          assign it when authorizing an admin email.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="new-role-label"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B6558]"
            >
              Role label <span className="text-red-500">*</span>
            </label>
            <input
              id="new-role-label"
              type="text"
              required
              value={newRoleLabel}
              onChange={(e) => {
                setNewRoleLabel(e.target.value);
                if (!newRoleKey || newRoleKey === slugifyOrgRoleKey(newRoleLabel)) {
                  setNewRoleKey(slugifyOrgRoleKey(e.target.value));
                }
              }}
              placeholder="e.g. Marketing Lead"
              aria-label="New role label"
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="new-role-key"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B6558]"
            >
              Role key (auto)
            </label>
            <input
              id="new-role-key"
              type="text"
              value={newRoleKey}
              onChange={(e) => setNewRoleKey(slugifyOrgRoleKey(e.target.value))}
              placeholder="MARKETING_LEAD"
              aria-label="New role key slug"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6B6558]">
            Portal sections <span className="text-red-500">*</span>
          </p>
          <SectionCheckboxGroup
            idPrefix="create-role-section"
            selected={newRoleSections}
            onToggle={(section) => toggleSection(section, newRoleSections, setNewRoleSections)}
          />
        </div>

        <button
          type="submit"
          disabled={savingRole}
          aria-label="Create organization role"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1E3FE0] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#12266E] disabled:opacity-50 dark:bg-[#60A5FA] dark:text-[#070B19]"
        >
          <FaPlus className="h-4 w-4" />
          {savingRole ? "Creating..." : "Create Role"}
        </button>
      </motion.form>

      <div className="rounded-2xl border border-black/10 bg-[#F6F1E4] shadow-lg dark:border-white/10 dark:bg-[#0D1B2A]">
        <div className="border-b border-black/10 px-6 py-4 dark:border-white/10">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#2A2A28] dark:text-white">
            <FaIdBadge className="h-4 w-4 text-[#1E3FE0]" />
            Org Roles
          </h2>
        </div>

        {loading ? (
          <div className="p-4">
            <ListItemsSkeleton count={4} />
          </div>
        ) : orgRoles.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6B6558] dark:text-slate-400">
            No roles in the database yet.
          </div>
        ) : (
          <ul className="divide-y divide-black/10 dark:divide-white/10">
            {orgRoles.map((role) => (
              <li key={role.key} className="px-6 py-4">
                {editingRoleKey === role.key ? (
                  <form onSubmit={handleUpdateRole} className="space-y-4">
                    <div className="max-w-md">
                      <label
                        htmlFor={`edit-role-label-${role.key}`}
                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B6558]"
                      >
                        Label
                      </label>
                      <input
                        id={`edit-role-label-${role.key}`}
                        type="text"
                        required
                        value={editRoleLabel}
                        onChange={(e) => setEditRoleLabel(e.target.value)}
                        aria-label={`Edit label for ${role.key}`}
                        className={inputClass}
                      />
                    </div>
                    <SectionCheckboxGroup
                      idPrefix={`edit-role-${role.key}`}
                      selected={editRoleSections}
                      onToggle={(section) =>
                        toggleSection(section, editRoleSections, setEditRoleSections)
                      }
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={savingRole}
                        aria-label={`Save role ${role.key}`}
                        className="rounded-full bg-[#1E3FE0] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {savingRole ? "Saving..." : "Save Role"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingRoleKey(null)}
                        aria-label="Cancel editing role"
                        className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-bold text-[#6B6558] dark:border-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#2A2A28] dark:text-white">{role.label}</p>
                        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold uppercase text-[#6B6558] dark:bg-white/10 dark:text-slate-300">
                          {role.key}
                        </span>
                        {role.isSystem && (
                          <span className="rounded-full bg-[#1E3FE0]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#1E3FE0]">
                            Built-in
                          </span>
                        )}
                        {role.isActive === false && (
                          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(role.portalSections ?? []).map((section) => (
                          <span
                            key={`${role.key}-${section}`}
                            className="rounded-full bg-[#10B981]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#10B981]"
                          >
                            {GRANTABLE_PORTAL_SECTION_LABELS[section] ?? section}
                          </span>
                        ))}
                      </div>
                    </div>
                    {role.isActive !== false && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditRole(role)}
                          aria-label={`Edit role ${role.label}`}
                          className="inline-flex items-center gap-2 rounded-full border border-[#1E3FE0]/20 px-4 py-2 text-xs font-bold text-[#1E3FE0] dark:text-[#60A5FA]"
                        >
                          <FaPen className="h-3 w-3" />
                          Edit
                        </button>
                        {!role.isSystem && (
                          <button
                            type="button"
                            onClick={() => handleDeactivateRole(role)}
                            aria-label={`Deactivate role ${role.label}`}
                            className="inline-flex items-center gap-2 rounded-full border border-red-500/20 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400"
                          >
                            <FaTrash className="h-3 w-3" />
                            Deactivate
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {portalSettings && (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveAdminLimit}
          className="rounded-2xl border border-[#E8622E]/20 bg-[#F6F1E4] p-6 shadow-lg dark:border-[#E8622E]/30 dark:bg-[#0D1B2A]"
        >
          <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-[#2A2A28] dark:text-white">
            <FaLock className="h-4 w-4 text-[#E8622E]" />
            Admin Email Limit
          </h2>
          <p className="mb-4 text-xs text-[#6B6558] dark:text-slate-400">
            Maximum authorized admin emails (excluding your super admin account). Only the main
            super admin account can change this number.
          </p>

          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[140px] max-w-xs flex-1">
              <label
                htmlFor="admin-email-limit"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B6558]"
              >
                Max admin emails
              </label>
              <input
                id="admin-email-limit"
                type="number"
                min={1}
                max={100}
                required
                value={adminEmailLimit}
                onChange={(e) => setAdminEmailLimit(e.target.value)}
                disabled={!portalSettings.canEditLimit || savingLimit}
                aria-label="Maximum number of authorized admin email addresses"
                className={inputClass}
              />
            </div>

            <div className="rounded-xl border border-black/10 bg-white/50 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5">
              <p className="font-bold text-[#2A2A28] dark:text-white">
                {portalSettings.activeAdminCount} / {portalSettings.maxAuthorizedAdmins} used
              </p>
              <p className="text-xs text-[#6B6558] dark:text-slate-400">
                {portalSettings.remainingSlots} slot{portalSettings.remainingSlots === 1 ? "" : "s"}{" "}
                remaining
              </p>
            </div>

            {portalSettings.canEditLimit && (
              <button
                type="submit"
                disabled={savingLimit}
                aria-label="Save admin email limit"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#E8622E] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#c44e1f] disabled:opacity-50"
              >
                {savingLimit ? "Saving..." : "Save Limit"}
              </button>
            )}
          </div>
        </motion.form>
      )}

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleAdd}
        className="rounded-2xl border border-black/10 bg-[#F6F1E4] p-6 shadow-lg dark:border-white/10 dark:bg-[#0D1B2A]"
      >
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#2A2A28] dark:text-white">
          <FaPlus className="h-4 w-4 text-[#1E3FE0]" />
          Add Admin Email
        </h2>

        {slotsFull && (
          <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-semibold text-amber-700 dark:text-amber-300">
            Admin email limit reached. Revoke an admin or increase the limit above before adding a
            new email.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="new-admin-email" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B6558]">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="new-admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              aria-label="New admin email"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="new-admin-name" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B6558]">
              Name (optional)
            </label>
            <input
              id="new-admin-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              aria-label="Admin name"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6B6558]">
            Roles {!grantSuperAdmin && <span className="text-red-500">*</span>}
          </p>
          <RoleCheckboxGroup
            idPrefix="add"
            roles={activeRoleChecklist}
            selected={selectedRoles}
            onToggle={(role) => toggleRole(role, selectedRoles, setSelectedRoles)}
            disabled={grantSuperAdmin}
          />
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B6558]">
            Elevated Access
          </p>
          <PermissionToggle
            id="add-grant-super-admin"
            label="Super Admin"
            description="Full portal access, authorized admin management, and the ability to grant security access to others."
            checked={grantSuperAdmin}
            onChange={(checked) => {
              setGrantSuperAdmin(checked);
              if (checked) setGrantSecurityAccess(false);
            }}
          />
          <PermissionToggle
            id="add-grant-security"
            label={GRANTABLE_PORTAL_SECTION_LABELS.SECURITY}
            description={
              rolesGrantSecurityAccess(selectedRoles, orgRoles)
                ? "This role already includes Portal Security."
                : "Allow this admin to view the Security evaluation page and reports."
            }
            checked={
              grantSecurityAccess ||
              rolesGrantSecurityAccess(selectedRoles, orgRoles) ||
              grantSuperAdmin
            }
            disabled={grantSuperAdmin || rolesGrantSecurityAccess(selectedRoles, orgRoles)}
            onChange={setGrantSecurityAccess}
          />
        </div>

        {!grantSuperAdmin && (
          <div className="mt-4 max-w-xs">
            <label htmlFor="new-admin-user-limit" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B6558]">
              Student roster limit (optional)
            </label>
            <input
              id="new-admin-user-limit"
              type="number"
              min={1}
              value={userLimit}
              onChange={(e) => setUserLimit(e.target.value)}
              placeholder="Unlimited"
              aria-label="Maximum students this admin can view in their roster"
              className={inputClass}
            />
            <p className="mt-1 text-[10px] text-[#6B6558] dark:text-slate-400">
              Per-admin cap on students shown in their roster. Leave blank for unlimited.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || slotsFull}
          aria-label="Authorize admin email"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1E3FE0] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#12266E] disabled:opacity-50 dark:bg-[#60A5FA] dark:text-[#070B19]"
        >
          <FaUserShield className="h-4 w-4" />
          {submitting ? "Adding..." : "Authorize Email"}
        </button>
      </motion.form>

      {editingAdmin && (
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleUpdate}
          className="rounded-2xl border border-[#1E3FE0]/30 bg-[#F6F1E4] p-6 shadow-lg dark:border-[#60A5FA]/30 dark:bg-[#0D1B2A]"
        >
          <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-[#2A2A28] dark:text-white">
            <FaPen className="h-4 w-4 text-[#1E3FE0]" />
            Edit Permissions
          </h2>
          <p className="mb-4 text-xs text-[#6B6558] dark:text-slate-400">{editingAdmin.email}</p>

          <RoleCheckboxGroup
            idPrefix="edit"
            roles={activeRoleChecklist}
            selected={editRoles}
            onToggle={(role) => toggleRole(role, editRoles, setEditRoles)}
            disabled={editGrantSuperAdmin}
          />

          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#6B6558]">
              Elevated Access
            </p>
            <PermissionToggle
              id="edit-grant-super-admin"
              label="Super Admin"
              description="Full portal access and permission management. At least one super admin must remain."
              checked={editGrantSuperAdmin}
              disabled={editingAdmin ? isPrimarySuperAdmin(editingAdmin) : false}
              onChange={(checked) => {
                setEditGrantSuperAdmin(checked);
                if (checked) setEditGrantSecurityAccess(false);
              }}
            />
            <PermissionToggle
              id="edit-grant-security"
              label={GRANTABLE_PORTAL_SECTION_LABELS.SECURITY}
              description={
                rolesGrantSecurityAccess(editRoles, orgRoles)
                  ? "This role already includes Portal Security."
                  : "Allow this admin to view the Security evaluation page and reports."
              }
              checked={
                editGrantSecurityAccess ||
                rolesGrantSecurityAccess(editRoles, orgRoles) ||
                editGrantSuperAdmin
              }
              disabled={
                editGrantSuperAdmin ||
                rolesGrantSecurityAccess(editRoles, orgRoles) ||
                (editingAdmin ? isPrimarySuperAdmin(editingAdmin) && editGrantSuperAdmin : false)
              }
              onChange={setEditGrantSecurityAccess}
            />
          </div>

          {!editGrantSuperAdmin && (
            <div className="mt-4 max-w-xs">
              <label htmlFor="edit-admin-user-limit" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B6558]">
                Student roster limit (optional)
              </label>
              <input
                id="edit-admin-user-limit"
                type="number"
                min={1}
                value={editUserLimit}
                onChange={(e) => setEditUserLimit(e.target.value)}
                placeholder="Unlimited"
                aria-label="Maximum students this admin can view in their roster"
                className={inputClass}
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              aria-label="Save admin permissions"
              className="inline-flex items-center gap-2 rounded-full bg-[#1E3FE0] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#12266E] disabled:opacity-50 dark:bg-[#60A5FA] dark:text-[#070B19]"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditingAdmin(null)}
              aria-label="Cancel editing admin permissions"
              className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-bold text-[#6B6558] transition hover:bg-black/5 dark:border-white/10 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      <div className="rounded-2xl border border-black/10 bg-[#F6F1E4] shadow-lg dark:border-white/10 dark:bg-[#0D1B2A]">
        <div className="border-b border-black/10 px-6 py-4 dark:border-white/10">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#2A2A28] dark:text-white">
            <FaEnvelope className="h-4 w-4 text-[#1E3FE0]" />
            Authorized Emails
          </h2>
        </div>

        {loading ? (
          <div className="p-4">
            <ListItemsSkeleton count={5} />
          </div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6B6558] dark:text-slate-400">
            No authorized admin emails yet.
          </div>
        ) : (
          <ul className="divide-y divide-black/10 dark:divide-white/10">
            {admins.map((admin) => (
              <li key={admin.id} className="flex flex-wrap items-start justify-between gap-4 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-[#2A2A28] dark:text-white">{admin.email}</p>
                    {admin.isSuperAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/10 px-2 py-1 text-[10px] font-bold uppercase text-[#10B981]">
                        <FaShieldHalved className="h-3 w-3" />
                        Super Admin
                      </span>
                    )}
                    {!admin.isActive && (
                      <span className="rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase text-red-600">
                        Revoked
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#6B6558] dark:text-slate-400">
                    {admin.name || "No name"} · Added by {admin.addedByEmail || "system"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-[#6B6558] dark:text-slate-400">
                    <p>
                      <span className="font-bold text-[#2A2A28] dark:text-slate-200">Last login:</span>{" "}
                      {formatAdminSessionTime(admin.lastLoginAt, admin.timezone)}
                    </p>
                    <p>
                      <span className="font-bold text-[#2A2A28] dark:text-slate-200">Last logout:</span>{" "}
                      {formatAdminSessionTime(admin.lastLogoutAt, admin.timezone)}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(admin.roles ?? []).map((role) => (
                      <span
                        key={role}
                        className="rounded-full bg-[#1E3FE0]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#1E3FE0] dark:bg-[#60A5FA]/15 dark:text-[#60A5FA]"
                      >
                        {getOrgRoleLabel(role, orgRoles)}
                      </span>
                    ))}
                    {adminCanViewSecurity(admin) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#10B981]">
                        <FaLock className="h-2.5 w-2.5" />
                        Security
                      </span>
                    )}
                    {!admin.isSuperAdmin && (
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-[#6B6558] dark:bg-white/10 dark:text-slate-300">
                        Students: {admin.userLimit ?? "Unlimited"}
                      </span>
                    )}
                  </div>
                </div>

                {admin.isActive && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(admin)}
                      aria-label={`Edit permissions for ${admin.email}`}
                      className="inline-flex items-center gap-2 rounded-full border border-[#1E3FE0]/20 px-4 py-2 text-xs font-bold text-[#1E3FE0] transition hover:bg-[#1E3FE0]/10 dark:text-[#60A5FA]"
                    >
                      <FaPen className="h-3 w-3" />
                      Edit
                    </button>
                    {!isPrimarySuperAdmin(admin) && (
                      <button
                        type="button"
                        onClick={() => handleRemove(admin.email)}
                        aria-label={`Revoke access for ${admin.email}`}
                        className="inline-flex items-center gap-2 rounded-full border border-red-500/20 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
                      >
                        <FaTrash className="h-3 w-3" />
                        Revoke
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
