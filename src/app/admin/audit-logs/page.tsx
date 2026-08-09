"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaMagnifyingGlass,
  FaRotateRight,
} from "react-icons/fa6";
import {
  getAdminAuditLogs,
  type AdminAuditLog,
  type AdminAuditLogsMeta,
} from "@/services/adminService";
import { TableRowsSkeleton } from "@/components/skeletons";

const ACTION_OPTIONS = [
  { value: "ALL", label: "All events" },
  { value: "USER_LOGIN", label: "Sign-ins" },
  { value: "USER_REGISTERED", label: "Registrations" },
  { value: "USER_REMOVED", label: "Removals" },
  { value: "QUIZ_SUBMITTED", label: "Quiz attempts" },
  { value: "ASSIGNMENT_SUBMITTED", label: "Submissions" },
  { value: "ASSIGNMENT_GRADED", label: "Grades" },
] as const;

const PERIOD_OPTIONS = [
  { value: 0, label: "All time" },
  { value: 1, label: "Today" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
] as const;

const ACTION_STYLES: Record<string, string> = {
  USER_LOGIN: "bg-[#1E3FE0]/10 text-[#1E3FE0] dark:bg-[#60A5FA]/15 dark:text-[#60A5FA]",
  USER_REGISTERED: "bg-[#10B981]/10 text-[#10B981]",
  USER_REMOVED: "bg-red-500/10 text-red-600 dark:text-red-400",
  QUIZ_SUBMITTED: "bg-[#F59E0B]/10 text-[#B45309] dark:text-[#F59E0B]",
  ASSIGNMENT_SUBMITTED: "bg-[#E8622E]/10 text-[#E8622E]",
  ASSIGNMENT_GRADED: "bg-[#8B5CF6]/10 text-[#7C3AED] dark:text-[#A78BFA]",
};

function formatActionLabel(action: string): string {
  return action.replace(/_/g, " ");
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [meta, setMeta] = useState<AdminAuditLogsMeta>({
    total: 0,
    page: 1,
    pageSize: 12,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [daysFilter, setDaysFilter] = useState(7);
  const [page, setPage] = useState(1);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAdminAuditLogs({
        action: actionFilter,
        search: search.trim() || undefined,
        days: daysFilter || undefined,
        page,
        pageSize: 12,
      });
      setLogs(result.logs);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, daysFilter, page, search]);

  useEffect(() => {
    const timer = setTimeout(loadLogs, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadLogs, search]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, daysFilter, search]);

  const labelClass =
    "mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400";
  const fieldClass =
    "h-11 w-full rounded-2xl border border-black/10 bg-white/70 px-4 text-sm font-medium text-[#2A2A28] outline-none transition focus:border-[#1E3FE0] focus:ring-2 focus:ring-[#1E3FE0]/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#60A5FA] dark:focus:ring-[#60A5FA]/20";

  return (
    <div className="space-y-6">
      <div>
        <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#10B981]">
          ★ SECURITY & AUDIT TRAIL
        </span>
        <h1 className="font-display-custom text-2xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-3xl">
          System Audit Logs
        </h1>
        <p className="text-xs font-medium text-[#6B6558] dark:text-slate-400">
          Sign-ins show LMS Portal or Admin Portal. Filter by event type, time range, or user.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-black/10 bg-[#F6F1E4] p-5 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
            <FaFilter className="h-3.5 w-3.5 text-[#1E3FE0] dark:text-[#60A5FA]" aria-hidden="true" />
            Filters
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setActionFilter("ALL");
              setDaysFilter(7);
              setPage(1);
            }}
            aria-label="Reset audit log filters"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-black/10 bg-white/60 px-4 text-xs font-bold text-[#6B6558] transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <FaRotateRight className="h-3 w-3" aria-hidden="true" />
            Reset
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 lg:items-end">
          <div className="lg:col-span-2">
            <label htmlFor="audit-search" className={labelClass}>
              Search
            </label>
            <div className="relative">
              <FaMagnifyingGlass
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6558] dark:text-slate-400"
                aria-hidden="true"
              />
              <input
                id="audit-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="User, action, or details…"
                aria-label="Search audit logs"
                className={`${fieldClass} pl-11`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="audit-action-filter" className={labelClass}>
              Event type
            </label>
            <select
              id="audit-action-filter"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              aria-label="Filter by event type"
              className={fieldClass}
            >
              {ACTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 border-t border-black/10 pt-5 dark:border-white/10">
          <p className={labelClass}>Time range</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by time range">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDaysFilter(option.value)}
                aria-pressed={daysFilter === option.value}
                aria-label={`Show logs from ${option.label}`}
                className={`inline-flex h-9 items-center rounded-full px-4 text-[10px] font-bold uppercase tracking-wider transition ${
                  daysFilter === option.value
                    ? "bg-[#1E3FE0] text-white shadow-sm dark:bg-[#60A5FA] dark:text-[#070B19]"
                    : "border border-black/10 bg-white/60 text-[#6B6558] hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-black/10 bg-[#F6F1E4] shadow-xl dark:border-white/10 dark:bg-[#0D1B2A]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10 sm:px-6">
          <p className="text-xs font-semibold text-[#6B6558] dark:text-slate-400">
            {loading
              ? "Loading…"
              : meta.total === 0
                ? "No events match your filters"
                : `Showing ${(meta.page - 1) * meta.pageSize + 1}-${Math.min(meta.page * meta.pageSize, meta.total)} of ${meta.total} events`}
          </p>
          {!loading && meta.totalPages > 1 && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
              Page {meta.page} of {meta.totalPages}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-white/40 text-[10px] font-bold uppercase tracking-wider text-[#6B6558] dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 sm:px-6" scope="col">
                  User
                </th>
                <th className="px-4 py-3 sm:px-6" scope="col">
                  Event
                </th>
                <th className="hidden px-4 py-3 md:table-cell sm:px-6" scope="col">
                  Details
                </th>
                <th className="px-4 py-3 sm:px-6" scope="col">
                  Time
                </th>
                <th className="hidden px-4 py-3 lg:table-cell sm:px-6" scope="col">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {loading && <TableRowsSkeleton rows={8} cols={5} />}
              {!loading &&
                logs.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="bg-white/60 transition hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-[#1E3FE0] dark:text-[#60A5FA] sm:px-6">
                      {log.userName}
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          ACTION_STYLES[log.action] ??
                          "bg-black/5 text-[#6B6558] dark:bg-white/10 dark:text-slate-300"
                        }`}
                      >
                        {formatActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="hidden max-w-xs truncate px-4 py-3 text-xs text-[#6B6558] dark:text-slate-300 md:table-cell sm:px-6">
                      {log.details}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[11px] font-medium text-[#6B6558] dark:text-slate-400 sm:px-6">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 font-mono text-[10px] text-[#6B6558] dark:text-slate-400 lg:table-cell sm:px-6">
                      {log.ipAddress && log.ipAddress !== "-" ? log.ipAddress : "-"}
                    </td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && logs.length === 0 && (
          <div className="px-6 py-12 text-center text-sm font-medium text-[#6B6558] dark:text-slate-400">
            Try widening the time range or clearing filters.
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-black/10 px-4 py-4 dark:border-white/10 sm:px-6">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              aria-label="Previous page of audit logs"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs font-bold text-[#2A2A28] transition hover:bg-black/5 disabled:opacity-40 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
            >
              <FaChevronLeft className="h-3 w-3" />
              Previous
            </button>
            <span className="text-xs font-semibold text-[#6B6558] dark:text-slate-400">
              Page {meta.page} / {meta.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages || loading}
              aria-label="Next page of audit logs"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs font-bold text-[#2A2A28] transition hover:bg-black/5 disabled:opacity-40 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
            >
              Next
              <FaChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
