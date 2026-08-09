"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaPause,
  FaPlay,
  FaUserGraduate,
  FaUserPlus,
  FaUserSlash,
  FaUsers,
  FaXmark,
} from "react-icons/fa6";
import {
  DEACTIVATION_DAY_OPTIONS,
  deactivateStudent,
  listAdminUsers,
  reactivateStudent,
  removeStudent,
  type AdminUser,
  type AdminUsersMeta,
  type DeactivationDays,
} from "@/services/adminService";
import { StatCardsSkeleton, TableRowsSkeleton } from "@/components/skeletons";

const MIN_REASON_LENGTH = 10;
const PAGE_SIZE = 15;

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAuthProvider(provider: string): string {
  if (provider === "GOOGLE") return "Google";
  if (provider === "EMAIL") return "Email";
  return provider;
}

function accountStatus(user: AdminUser): { label: string; className: string } {
  if (user.isDeactivated) {
    return {
      label: `Deactivated until ${formatDateTime(user.deactivatedUntil)}`,
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    };
  }
  if (user.lastLoginAt) {
    return {
      label: "Active",
      className: "bg-[#10B981]/10 text-[#0d9668] dark:text-[#10B981]",
    };
  }
  return {
    label: "Registered",
    className: "bg-[#F59E0B]/10 text-[#B45309] dark:text-[#F59E0B]",
  };
}

export default function AdminStudentsPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<AdminUsersMeta | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("STUDENT");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [removing, setRemoving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<AdminUser | null>(null);
  const [studentToDeactivate, setStudentToDeactivate] = useState<AdminUser | null>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [deactivationReason, setDeactivationReason] = useState("");
  const [deactivationDays, setDeactivationDays] = useState<DeactivationDays>(7);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listAdminUsers({
        search: search.trim() || undefined,
        role: roleFilter,
        page,
        pageSize: PAGE_SIZE,
      });
      setUsers(result.users);
      setMeta(result.meta);
    } catch (err) {
      if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
        setError(
          "Cannot reach the backend API. Start the backend with: cd backend && bun run dev"
        );
      } else {
        setError(err instanceof Error ? err.message : "Failed to load users");
      }
      setUsers([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const handleExportCSV = async () => {
    setExporting(true);
    setError("");
    try {
      const result = await listAdminUsers({
        search: search.trim() || undefined,
        role: roleFilter,
        page: 1,
        pageSize: 100,
      });

      let allUsers = result.users;
      if (result.meta.totalPages > 1) {
        const pages = await Promise.all(
          Array.from({ length: result.meta.totalPages - 1 }, (_, index) =>
            listAdminUsers({
              search: search.trim() || undefined,
              role: roleFilter,
              page: index + 2,
              pageSize: 100,
            })
          )
        );
        allUsers = allUsers.concat(pages.flatMap((pageResult) => pageResult.users));
      }

      const headers =
        "ID,Name,Email,Role,AuthProvider,EmailVerified,AccountCreated,LastLogin,Status,DeactivatedUntil\n";
      const rows = allUsers
        .map((u) => {
          const status = u.isDeactivated
            ? "Deactivated"
            : u.lastLoginAt
              ? "Active"
              : "Registered";
          return `"${u.id}","${u.name}","${u.email}","${u.role}","${u.authProvider}","${u.emailVerified}","${u.createdAt}","${u.lastLoginAt ?? ""}","${status}","${u.deactivatedUntil ?? ""}"`;
        })
        .join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "genvalue-student-accounts.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export roster");
    } finally {
      setExporting(false);
    }
  };

  const openRemoveModal = (user: AdminUser) => {
    setStudentToRemove(user);
    setRemovalReason("");
    setError("");
    setSuccess("");
  };

  const closeRemoveModal = () => {
    if (removing) return;
    setStudentToRemove(null);
    setRemovalReason("");
  };

  const openDeactivateModal = (user: AdminUser) => {
    setStudentToDeactivate(user);
    setDeactivationReason("");
    setDeactivationDays(7);
    setError("");
    setSuccess("");
  };

  const closeDeactivateModal = () => {
    if (deactivating) return;
    setStudentToDeactivate(null);
    setDeactivationReason("");
    setDeactivationDays(7);
  };

  const handleConfirmRemove = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!studentToRemove) return;

    const trimmedReason = removalReason.trim();
    if (trimmedReason.length < MIN_REASON_LENGTH) {
      setError(`Please provide a reason of at least ${MIN_REASON_LENGTH} characters`);
      return;
    }

    setRemoving(true);
    setError("");
    setSuccess("");

    try {
      await removeStudent(studentToRemove.id, trimmedReason);
      setSuccess(`${studentToRemove.name} has been permanently removed from GenValue`);
      setStudentToRemove(null);
      setRemovalReason("");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove student");
    } finally {
      setRemoving(false);
    }
  };

  const handleConfirmDeactivate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!studentToDeactivate) return;

    const trimmedReason = deactivationReason.trim();
    if (trimmedReason.length < MIN_REASON_LENGTH) {
      setError(`Please provide a reason of at least ${MIN_REASON_LENGTH} characters`);
      return;
    }

    setDeactivating(true);
    setError("");
    setSuccess("");

    try {
      const result = await deactivateStudent(
        studentToDeactivate.id,
        deactivationDays,
        trimmedReason
      );
      setSuccess(
        `${studentToDeactivate.name} deactivated for ${result.days} days${
          result.deactivatedUntil ? ` (until ${formatDateTime(result.deactivatedUntil)})` : ""
        }`
      );
      setStudentToDeactivate(null);
      setDeactivationReason("");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate student");
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivate = async (user: AdminUser) => {
    setReactivatingId(user.id);
    setError("");
    setSuccess("");
    try {
      await reactivateStudent(user.id);
      setSuccess(`${user.name} has been reactivated`);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reactivate student");
    } finally {
      setReactivatingId(null);
    }
  };

  const reasonTooShort =
    removalReason.trim().length > 0 && removalReason.trim().length < MIN_REASON_LENGTH;
  const deactivationReasonTooShort =
    deactivationReason.trim().length > 0 &&
    deactivationReason.trim().length < MIN_REASON_LENGTH;

  const stats = meta?.stats;
  const rowOffset = meta ? (meta.page - 1) * meta.pageSize : 0;
  const showBannerError = error && !studentToRemove && !studentToDeactivate;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#10B981]">
            ★ USER & ROSTER MANAGEMENT
          </span>
          <h1 className="font-display-custom text-2xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-3xl">
            Manage Students
          </h1>
          <p className="text-xs font-medium text-[#6B6558] dark:text-slate-400">
            Track every student account created on GenValue - sign-up date, method, and activity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={loading || exporting || (meta?.total ?? 0) === 0}
          aria-label="Export all student accounts as CSV"
          className="inline-flex items-center gap-2 rounded-full bg-[#10B981] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-xl hover:bg-[#0d9668] disabled:opacity-50"
        >
          <FaDownload className="h-3.5 w-3.5" />
          {exporting ? "Exporting…" : "Export All Accounts"}
        </button>
      </div>

      {loading && !stats && <StatCardsSkeleton count={4} cols={4} />}

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Student Accounts",
              value: stats.totalStudents,
              Icon: FaUsers,
              accent: "text-[#1E3FE0] dark:text-[#60A5FA]",
            },
            {
              label: "New This Week",
              value: stats.newThisWeek,
              Icon: FaUserPlus,
              accent: "text-[#10B981]",
            },
            {
              label: "Active (30 days)",
              value: stats.activeLast30Days,
              Icon: FaUserGraduate,
              accent: "text-[#F59E0B]",
            },
            {
              label: "Never Signed In",
              value: stats.neverLoggedIn,
              Icon: FaUserSlash,
              accent: "text-[#6B6558] dark:text-slate-400",
            },
          ].map(({ label, value, Icon, accent }) => (
            <div
              key={label}
              className="rounded-2xl border border-black/10 bg-[#F6F1E4] p-4 shadow-sm dark:border-white/10 dark:bg-[#0D1B2A]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
                  {label}
                </p>
                <Icon className={`h-4 w-4 ${accent}`} aria-hidden="true" />
              </div>
              <p className="mt-2 font-display-custom text-2xl font-extrabold text-[#2A2A28] dark:text-white">
                {value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {showBannerError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 p-4 text-sm font-semibold text-[#0d9668] dark:text-[#10B981]">
          {success}
        </div>
      )}

      {meta?.capped && (
        <div className="rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/10 p-3 text-xs font-semibold text-[#B45309] dark:text-[#F59E0B]">
          Your admin account can view up to {meta.userLimit} student records. Contact a super admin to
          increase this limit.
        </div>
      )}

      <div className="rounded-3xl border border-black/10 bg-[#F6F1E4] p-6 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A] sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            aria-label="Search student accounts by name or email"
            className="flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs outline-none dark:border-white/10 dark:bg-white/5"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter accounts by role"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs font-bold outline-none dark:border-white/10 dark:bg-[#070B19]"
          >
            <option value="STUDENT">Students Only</option>
            <option value="ALL">All Roles</option>
            <option value="INSTRUCTOR">Instructors</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
          <span>
            {meta
              ? `Showing ${users.length === 0 ? 0 : rowOffset + 1}-${rowOffset + users.length} of ${meta.total} account${meta.total === 1 ? "" : "s"}`
              : "Loading accounts…"}
          </span>
          {roleFilter === "STUDENT" && stats && (
            <span>{stats.totalStudents} total student accounts registered</span>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/10 text-[10px] font-extrabold uppercase tracking-wider text-[#6B6558] dark:border-white/10 dark:text-slate-400">
                <th className="py-3 px-3 w-10">#</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Account Created</th>
                <th className="py-3 px-4">Sign-up</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {loading && <TableRowsSkeleton rows={6} cols={7} />}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6B6558] dark:text-slate-400">
                    No student accounts found.
                  </td>
                </tr>
              )}
              {!loading &&
                users.map((u, index) => {
                  const status = accountStatus(u);
                  return (
                    <tr key={u.id}>
                      <td className="py-4 px-3 font-bold text-[#6B6558] dark:text-slate-500">
                        {rowOffset + index + 1}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-[#2A2A28] dark:text-white">{u.name}</p>
                        <p className="text-[11px] text-[#6B6558] dark:text-slate-400">{u.email}</p>
                        {roleFilter !== "STUDENT" && (
                          <span className="mt-1 inline-block rounded-full bg-black/5 px-2 py-0.5 text-[9px] font-extrabold dark:bg-white/10">
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-[#6B6558] dark:text-slate-400">
                        {formatDateTime(u.createdAt)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-extrabold dark:bg-white/10">
                          {formatAuthProvider(u.authProvider)}
                        </span>
                        {u.emailVerified && (
                          <span className="ml-1.5 text-[9px] font-bold text-[#10B981]">Verified</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block max-w-[12rem] rounded-full px-2.5 py-1 text-[10px] font-extrabold leading-snug ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#6B6558] dark:text-slate-400">
                        {formatDateTime(u.lastLoginAt)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {u.role === "STUDENT" ? (
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {u.isDeactivated ? (
                              <button
                                type="button"
                                onClick={() => handleReactivate(u)}
                                disabled={reactivatingId === u.id}
                                aria-label={`Reactivate student ${u.name}`}
                                className="inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#0d9668] transition hover:bg-[#10B981]/20 disabled:opacity-50 dark:text-[#10B981]"
                              >
                                <FaPlay className="h-3 w-3" />
                                {reactivatingId === u.id ? "…" : "Reactivate"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openDeactivateModal(u)}
                                aria-label={`Temporarily deactivate student ${u.name}`}
                                className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 transition hover:bg-amber-500/20 dark:text-amber-400"
                              >
                                <FaPause className="h-3 w-3" />
                                Deactivate
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openRemoveModal(u)}
                              aria-label={`Permanently remove student ${u.name}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-red-600 transition hover:bg-red-500/20 dark:text-red-400"
                            >
                              <FaUserSlash className="h-3 w-3" />
                              Remove
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-medium text-[#6B6558] dark:text-slate-500">
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-black/10 pt-4 dark:border-white/10">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || meta.page <= 1}
              aria-label="Previous page of student accounts"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#6B6558] hover:bg-black/5 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <FaChevronLeft className="h-3 w-3" />
              Previous
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
              disabled={loading || meta.page >= meta.totalPages}
              aria-label="Next page of student accounts"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#6B6558] hover:bg-black/5 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Next
              <FaChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {studentToDeactivate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={closeDeactivateModal}
            role="presentation"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-black/10 bg-[#F6F1E4] p-6 shadow-2xl dark:border-white/10 dark:bg-[#0D1B2A]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="deactivate-student-title"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-annotation text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Temporary Deactivation
                  </span>
                  <h2
                    id="deactivate-student-title"
                    className="mt-1 font-display-custom text-lg font-extrabold text-[#2A2A28] dark:text-white"
                  >
                    Deactivate account
                  </h2>
                  <p className="mt-1 text-xs text-[#6B6558] dark:text-slate-400">
                    Pause access for{" "}
                    <span className="font-bold text-[#2A2A28] dark:text-white">
                      {studentToDeactivate.name}
                    </span>{" "}
                    ({studentToDeactivate.email}). The account stays in the roster and can be
                    reactivated early, or restores automatically when the period ends.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDeactivateModal}
                  disabled={deactivating}
                  aria-label="Close deactivate student dialog"
                  className="rounded-full p-2 text-[#6B6558] hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <FaXmark className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmDeactivate} className="mt-5 space-y-4">
                <fieldset>
                  <legend className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
                    Deactivation period <span className="text-red-500">*</span>
                  </legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {DEACTIVATION_DAY_OPTIONS.map((days) => {
                      const selected = deactivationDays === days;
                      return (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setDeactivationDays(days)}
                          aria-pressed={selected}
                          aria-label={`Deactivate for ${days} days`}
                          className={`rounded-2xl border px-3 py-2.5 text-xs font-extrabold transition ${
                            selected
                              ? "border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300"
                              : "border-black/10 bg-white text-[#2A2A28] hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                          }`}
                        >
                          {days} days
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div>
                  <label
                    htmlFor="deactivation-reason"
                    className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-[#6B6558] dark:text-slate-400"
                  >
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="deactivation-reason"
                    value={deactivationReason}
                    onChange={(event) => setDeactivationReason(event.target.value)}
                    rows={4}
                    required
                    minLength={MIN_REASON_LENGTH}
                    placeholder="Why is this account being temporarily deactivated…"
                    aria-label="Reason for temporary deactivation"
                    className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs outline-none focus:border-amber-500/40 dark:border-white/10 dark:bg-white/5"
                  />
                  <p
                    className={`mt-1.5 text-[10px] font-medium ${
                      deactivationReasonTooShort
                        ? "text-red-500"
                        : "text-[#6B6558] dark:text-slate-500"
                    }`}
                  >
                    Minimum {MIN_REASON_LENGTH} characters ({deactivationReason.trim().length}/
                    {MIN_REASON_LENGTH})
                  </p>
                </div>

                {error && studentToDeactivate && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeDeactivateModal}
                    disabled={deactivating}
                    aria-label="Cancel temporary deactivation"
                    className="rounded-full border border-black/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#6B6558] hover:bg-black/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      deactivating || deactivationReason.trim().length < MIN_REASON_LENGTH
                    }
                    aria-label={`Confirm ${deactivationDays}-day deactivation of ${studentToDeactivate.name}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    <FaPause className="h-3.5 w-3.5" />
                    {deactivating ? "Deactivating…" : `Deactivate ${deactivationDays} days`}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {studentToRemove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={closeRemoveModal}
            role="presentation"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-black/10 bg-[#F6F1E4] p-6 shadow-2xl dark:border-white/10 dark:bg-[#0D1B2A]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="remove-student-title"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-annotation text-[10px] font-bold uppercase tracking-widest text-red-500">
                    Permanent Removal
                  </span>
                  <h2
                    id="remove-student-title"
                    className="mt-1 font-display-custom text-lg font-extrabold text-[#2A2A28] dark:text-white"
                  >
                    Remove from GenValue
                  </h2>
                  <p className="mt-1 text-xs text-[#6B6558] dark:text-slate-400">
                    This permanently deletes{" "}
                    <span className="font-bold text-[#2A2A28] dark:text-white">
                      {studentToRemove.name}
                    </span>{" "}
                    ({studentToRemove.email}) from Firebase Auth and the LMS. Prefer temporary
                    deactivation if you may reinstate them later.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeRemoveModal}
                  disabled={removing}
                  aria-label="Close remove student dialog"
                  className="rounded-full p-2 text-[#6B6558] hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <FaXmark className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmRemove} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="removal-reason"
                    className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-[#6B6558] dark:text-slate-400"
                  >
                    Reason for removal <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="removal-reason"
                    value={removalReason}
                    onChange={(event) => setRemovalReason(event.target.value)}
                    rows={4}
                    required
                    minLength={MIN_REASON_LENGTH}
                    placeholder="Describe why this student is being removed (e.g. policy violation, duplicate account, requested account deletion)…"
                    aria-label="Reason for removing student"
                    className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs outline-none focus:border-red-500/40 dark:border-white/10 dark:bg-white/5"
                  />
                  <p
                    className={`mt-1.5 text-[10px] font-medium ${
                      reasonTooShort ? "text-red-500" : "text-[#6B6558] dark:text-slate-500"
                    }`}
                  >
                    Minimum {MIN_REASON_LENGTH} characters ({removalReason.trim().length}/
                    {MIN_REASON_LENGTH})
                  </p>
                </div>

                {error && studentToRemove && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeRemoveModal}
                    disabled={removing}
                    aria-label="Cancel student removal"
                    className="rounded-full border border-black/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#6B6558] hover:bg-black/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={removing || removalReason.trim().length < MIN_REASON_LENGTH}
                    aria-label={`Confirm permanent removal of ${studentToRemove.name}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <FaUserSlash className="h-3.5 w-3.5" />
                    {removing ? "Removing…" : "Remove Student"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
