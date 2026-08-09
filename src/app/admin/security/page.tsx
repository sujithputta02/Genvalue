"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaCircleCheck,
  FaCircleExclamation,
  FaCircleXmark,
  FaCloud,
  FaGraduationCap,
  FaLock,
  FaRotateRight,
  FaServer,
  FaShieldHalved,
  FaUserShield,
} from "react-icons/fa6";
import { SecurityPageSkeleton } from "@/components/skeletons";
import { SecurityScanAnimation } from "@/components/admin/SecurityScanAnimation";
import { useAdminPortalPath } from "@/hooks/useAdminPortalPath";
import { getAdminProfile, getAdminSecurityReport } from "@/services/adminService";
import type {
  SecurityCheck,
  SecurityCheckStatus,
  SecurityPortal,
  SecurityReport,
} from "@/types/security";
import type { AdminProfile } from "@/services/adminService";

const PORTAL_META: Record<
  SecurityPortal,
  { label: string; description: string; Icon: typeof FaGraduationCap }
> = {
  LMS: {
    label: "LMS Student Portal",
    description: "Firebase auth, obfuscated URLs, dispatch review queue, token isolation.",
    Icon: FaGraduationCap,
  },
  Admin: {
    label: "Admin Portal",
    description: "OTP sessions, role-gated sections, separate admin tokens, instant publish controls.",
    Icon: FaShieldHalved,
  },
  Platform: {
    label: "Platform & API",
    description: "Infrastructure, secrets, Firebase verification, database, rate limits.",
    Icon: FaServer,
  },
  Deployment: {
    label: "Vercel & Production",
    description: "Secrets checklist, HTTPS, Brevo email, Cloudinary, and deploy-time configuration.",
    Icon: FaCloud,
  },
};

const STATUS_CONFIG: Record<
  SecurityCheckStatus,
  { label: string; icon: typeof FaCircleCheck; badge: string; rowAccent: string }
> = {
  pass: {
    label: "Passing",
    icon: FaCircleCheck,
    badge: "bg-[#10B981]/10 text-[#10B981]",
    rowAccent: "border-l-[#10B981]",
  },
  warn: {
    label: "Warning",
    icon: FaCircleExclamation,
    badge: "bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FCD34D]",
    rowAccent: "border-l-[#F59E0B]",
  },
  fail: {
    label: "Needs attention",
    icon: FaCircleXmark,
    badge: "bg-red-500/10 text-red-600 dark:text-red-400",
    rowAccent: "border-l-red-500",
  },
};

const OVERALL_CONFIG = {
  healthy: {
    title: "All checks passing",
    ring: "border-[#10B981]/25 bg-[#10B981]/8",
    text: "text-[#10B981]",
    icon: FaCircleCheck,
  },
  healthy_with_warnings: {
    title: "Healthy with warnings",
    ring: "border-[#F59E0B]/25 bg-[#F59E0B]/8",
    text: "text-[#B45309] dark:text-[#FCD34D]",
    icon: FaCircleExclamation,
  },
  attention: {
    title: "Action required",
    ring: "border-red-500/25 bg-red-500/8",
    text: "text-red-600 dark:text-red-400",
    icon: FaCircleXmark,
  },
} as const;

function formatEvaluatedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function groupChecksByPortal(checks: SecurityCheck[]): Record<SecurityPortal, SecurityCheck[]> {
  return checks.reduce(
    (acc, check) => {
      acc[check.portal].push(check);
      return acc;
    },
    {
      LMS: [] as SecurityCheck[],
      Admin: [] as SecurityCheck[],
      Platform: [] as SecurityCheck[],
      Deployment: [] as SecurityCheck[],
    }
  );
}

export default function AdminSecurityPage() {
  const { toPortal } = useAdminPortalPath();
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadReport = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [data, adminProfile] = await Promise.all([
        getAdminSecurityReport(),
        getAdminProfile(),
      ]);
      setReport(data);
      setProfile(adminProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load security report");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const grouped = useMemo(
    () => (report ? groupChecksByPortal(report.checks) : null),
    [report]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#10B981]">
            ★ LEADERSHIP · PORTAL SECURITY
          </span>
          <h1 className="font-display-custom mt-1 text-2xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-3xl">
            Security Evaluation
          </h1>
        </div>
        <SecurityScanAnimation active label="Scanning portal controls…" />
        <SecurityPageSkeleton />
      </div>
    );
  }

  const overall = report ? OVERALL_CONFIG[report.overallStatus] : null;
  const OverallIcon = overall?.icon ?? FaLock;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#10B981]">
            ★ LEADERSHIP · PORTAL SECURITY
          </span>
          <h1 className="font-display-custom mt-1 text-2xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-3xl">
            Security Evaluation
          </h1>
          <p className="mt-2 max-w-2xl text-xs font-medium text-[#6B6558] dark:text-slate-400 sm:text-sm">
            Cross-portal controls for LMS, admin, and platform layers. Always visible to Super
            Admin, Founder, and Co-founder. Other admins can be granted access from Authorized
            Admins.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadReport(true)}
          disabled={refreshing}
          aria-label="Re-run security evaluation"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-black/10 bg-white/60 px-5 text-xs font-bold uppercase tracking-wider text-[#2A2A28] transition hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
        >
          <FaRotateRight className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
          {refreshing ? "Evaluating…" : "Re-evaluate"}
        </button>
      </div>

      {error ? (
        <div
          className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-600 dark:text-red-400"
          role="alert"
        >
          <p>{error}</p>
          {error.includes("localhost:5001") ? (
            <p className="mt-2 text-xs font-medium text-red-600/90 dark:text-red-300">
              In a second terminal run{" "}
              <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono dark:bg-white/10">
                cd backend && bun run dev
              </code>{" "}
              or from the project root:{" "}
              <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono dark:bg-white/10">
                bun run dev:full
              </code>
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void loadReport()}
            aria-label="Retry loading security report"
            className="mt-3 inline-flex min-h-9 items-center rounded-full border border-red-500/30 px-4 text-xs font-bold uppercase tracking-wider text-red-600 transition hover:bg-red-500/10 dark:text-red-300"
          >
            Retry
          </button>
        </div>
      ) : null}

      {report && overall ? (
        <>
          <SecurityScanAnimation
            active={refreshing}
            label={refreshing ? "Re-scanning portal controls…" : "Security systems online"}
          />

          <div className="rounded-3xl border border-black/10 bg-[#F6F1E4] p-5 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
                  Access policy
                </p>
                <p className="mt-2 max-w-2xl text-sm font-medium text-[#2A2A28] dark:text-white">
                  Super admins always see this page. Founders and co-founders inherit access by
                  role. You can grant Portal Security to CTO, CPO, or Instructor admins from
                  Authorized Admins.
                </p>
                {profile && (
                  <p className="mt-2 text-xs font-medium text-[#6B6558] dark:text-slate-400">
                    Signed in as {profile.email}
                    {profile.isSuperAdmin ? " · Super Admin" : ""}
                  </p>
                )}
              </div>
              {profile?.isSuperAdmin && (
                <Link
                  href={toPortal("/admin/authorized-admins")}
                  aria-label="Manage authorized admins and security permissions"
                  className="inline-flex items-center gap-2 rounded-full border border-[#1E3FE0]/20 bg-white/60 px-4 py-2.5 text-xs font-bold text-[#1E3FE0] transition hover:bg-[#1E3FE0]/10 dark:border-[#60A5FA]/30 dark:bg-white/5 dark:text-[#60A5FA]"
                >
                  <FaUserShield className="h-3.5 w-3.5" aria-hidden />
                  Manage access
                </Link>
              )}
            </div>
          </div>

          {report.deploymentSnapshot ? (
            <DeploymentSnapshotCard snapshot={report.deploymentSnapshot} />
          ) : null}

          {/* Summary strip */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Passing" value={report.summary.pass} tone="pass" />
            <SummaryCard label="Warnings" value={report.summary.warn} tone="warn" />
            <SummaryCard label="Needs attention" value={report.summary.fail} tone="fail" />
            <div className="rounded-3xl border border-black/10 bg-[#F6F1E4] p-5 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
                Environment
              </p>
              <p className="mt-2 font-display-custom text-xl font-extrabold capitalize text-[#2A2A28] dark:text-white">
                {report.environment}
              </p>
              <p className="mt-1 text-[10px] font-medium text-[#6B6558] dark:text-slate-400">
                Evaluated {formatEvaluatedAt(report.evaluatedAt)}
              </p>
            </div>
          </div>

          {/* Overall status */}
          <div
            className={`flex items-start gap-4 rounded-3xl border p-5 shadow-xl sm:p-6 ${overall.ring}`}
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/60 dark:bg-white/10 ${overall.text}`}
            >
              <OverallIcon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className={`text-sm font-extrabold uppercase tracking-wider ${overall.text}`}>
                {overall.title}
              </p>
              <p className="mt-1 text-xs font-medium text-[#6B6558] dark:text-slate-400">
                {report.summary.total} controls evaluated across {report.portals.length} portal
                layers — LMS, Admin, Platform, and Deployment.
              </p>
            </div>
          </div>

          {/* Portal sections */}
          <div className="space-y-6">
            {report.portals.map((portal, portalIndex) => {
              const meta = PORTAL_META[portal];
              const checks = grouped?.[portal] ?? [];
              const PortalIcon = meta.Icon;
              const portalFails = checks.filter((c) => c.status === "fail").length;
              const portalWarns = checks.filter((c) => c.status === "warn").length;

              return (
                <motion.section
                  key={portal}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: portalIndex * 0.05 }}
                  className="overflow-hidden rounded-3xl border border-black/10 bg-[#F6F1E4] shadow-xl dark:border-white/10 dark:bg-[#0D1B2A]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 px-5 py-5 dark:border-white/10 sm:px-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1E3FE0]/10 text-[#1E3FE0] dark:bg-[#60A5FA]/15 dark:text-[#60A5FA]">
                        <PortalIcon className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <h2 className="font-display-custom text-lg font-extrabold text-[#2A2A28] dark:text-white">
                          {meta.label}
                        </h2>
                        <p className="mt-1 max-w-xl text-xs font-medium text-[#6B6558] dark:text-slate-400">
                          {meta.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {portalFails > 0 ? (
                        <span className="rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400">
                          {portalFails} critical
                        </span>
                      ) : null}
                      {portalWarns > 0 ? (
                        <span className="rounded-full bg-[#F59E0B]/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#B45309] dark:text-[#FCD34D]">
                          {portalWarns} warning{portalWarns !== 1 ? "s" : ""}
                        </span>
                      ) : null}
                      {portalFails === 0 && portalWarns === 0 ? (
                        <span className="rounded-full bg-[#10B981]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#10B981]">
                          All clear
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <ul className="divide-y divide-black/5 dark:divide-white/5">
                    {checks.map((check, index) => (
                      <CheckRow key={check.id} check={check} index={index} />
                    ))}
                  </ul>
                </motion.section>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

function DeploymentSnapshotCard({
  snapshot,
}: {
  snapshot: NonNullable<SecurityReport["deploymentSnapshot"]>;
}) {
  const hostingLabel =
    snapshot.hosting === "vercel"
      ? "Vercel"
      : snapshot.hosting === "local"
        ? "Local development"
        : snapshot.hosting;

  return (
    <div className="rounded-3xl border border-[#1E3FE0]/20 bg-[#F6F1E4] p-5 shadow-xl dark:border-[#60A5FA]/25 dark:bg-[#0D1B2A] sm:p-6">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#1E3FE0] dark:text-[#60A5FA]">
        Deployment snapshot
      </p>
      <p className="mt-1 text-xs font-medium text-[#6B6558] dark:text-slate-400">
        Hosting: {hostingLabel}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SnapshotStat label="Super admins" value={snapshot.superAdminCount} />
        <SnapshotStat label="Security access" value={snapshot.securityAccessCount} />
        <SnapshotStat
          label="Admin OTP email"
          value={snapshot.emailReachable ? "Ready" : snapshot.emailConfigured ? "Check" : "Missing"}
          tone={snapshot.emailReachable ? "pass" : snapshot.emailConfigured ? "warn" : "fail"}
        />
        <SnapshotStat
          label="Cloudinary"
          value={
            snapshot.cloudinaryReachable
              ? "Ready"
              : snapshot.cloudinaryConfigured
                ? "Check"
                : "Missing"
          }
          tone={
            snapshot.cloudinaryReachable
              ? "pass"
              : snapshot.cloudinaryConfigured
                ? "warn"
                : "fail"
          }
        />
      </div>

      {snapshot.missingProductionSecrets.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-[#F59E0B]/25 bg-[#F59E0B]/8 p-4">
          <p className="text-xs font-bold text-[#B45309] dark:text-[#FCD34D]">
            Before Vercel deploy — set these backend env vars:
          </p>
          <p className="mt-1 text-xs font-medium text-[#6B6558] dark:text-slate-400">
            {snapshot.missingProductionSecrets.join(" · ")}
          </p>
          <p className="mt-2 text-[10px] font-medium text-[#6B6558] dark:text-slate-400">
            Frontend (Vercel): NEXT_PUBLIC_API_URL → your backend URL. Backend (Vercel/Railway):
            all secrets above plus FRONTEND_URL=https://your-domain.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-xs font-medium text-[#10B981]">
          All required production backend secrets are configured.
        </p>
      )}
    </div>
  );
}

function SnapshotStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: SecurityCheckStatus;
}) {
  const toneClass =
    tone === "pass"
      ? "text-[#10B981]"
      : tone === "warn"
        ? "text-[#B45309] dark:text-[#FCD34D]"
        : tone === "fail"
          ? "text-red-600 dark:text-red-400"
          : "text-[#2A2A28] dark:text-white";

  return (
    <div className="rounded-2xl border border-black/10 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-1 font-display-custom text-lg font-extrabold ${toneClass}`}>{value}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: SecurityCheckStatus;
}) {
  const config = STATUS_CONFIG[tone];
  const Icon = config.icon;

  return (
    <div className="rounded-3xl border border-black/10 bg-[#F6F1E4] p-5 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
          {label}
        </p>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${config.badge}`}
        >
          <Icon className="h-3 w-3" aria-hidden />
        </span>
      </div>
      <p className="mt-3 font-display-custom text-3xl font-extrabold text-[#2A2A28] dark:text-white">
        {value}
      </p>
    </div>
  );
}

function CheckRow({ check, index }: { check: SecurityCheck; index: number }) {
  const config = STATUS_CONFIG[check.status];
  const Icon = config.icon;

  return (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025 }}
      className={`border-l-4 bg-white/30 px-5 py-4 dark:bg-white/[0.02] sm:px-6 ${config.rowAccent}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-full bg-black/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6B6558] dark:bg-white/10 dark:text-slate-300">
            {check.category}
          </span>
          <h3 className="mt-2 text-sm font-extrabold text-[#2A2A28] dark:text-white">{check.name}</h3>
          <p className="mt-1 text-xs font-medium leading-relaxed text-[#6B6558] dark:text-slate-400">
            {check.detail}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider ${config.badge}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {config.label}
        </span>
      </div>
    </motion.li>
  );
}
