"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  FaBroom,
  FaCircleCheck,
  FaCircleExclamation,
  FaCircleXmark,
  FaDatabase,
  FaEnvelope,
  FaGraduationCap,
  FaImage,
  FaLock,
  FaRotateRight,
  FaServer,
  FaShieldHalved,
  FaScrewdriverWrench,
  FaTriangleExclamation,
  FaUserShield,
  FaVideo,
  FaWaveSquare,
} from "react-icons/fa6";
import { SecurityPageSkeleton } from "@/components/skeletons";
import { useAdminPortalPath } from "@/hooks/useAdminPortalPath";
import {
  clearAdminBrowserCaches,
  getAdminSystemHealth,
  recycleAdminDatabasePool,
  updateAdminSystemMaintenance,
} from "@/services/adminService";
import type {
  ServiceHealthStatus,
  SystemHealthGroup,
  SystemHealthReport,
  SystemHealthStatus,
} from "@/types/systemHealth";

const OVERALL: Record<
  SystemHealthStatus,
  {
    title: string;
    subtitle: string;
    ring: string;
    glow: string;
    text: string;
    Icon: typeof FaCircleCheck;
  }
> = {
  operational: {
    title: "All Systems Operational",
    subtitle: "Core LMS services are responding normally.",
    ring: "border-[#10B981]/35",
    glow: "from-[#10B981]/20 via-transparent to-transparent",
    text: "text-[#10B981]",
    Icon: FaCircleCheck,
  },
  degraded: {
    title: "Degraded Performance",
    subtitle: "Some services are slow or partially impaired.",
    ring: "border-[#F59E0B]/40",
    glow: "from-[#F59E0B]/25 via-transparent to-transparent",
    text: "text-[#B45309] dark:text-[#FCD34D]",
    Icon: FaCircleExclamation,
  },
  partial_outage: {
    title: "Partial Outage",
    subtitle: "At least one critical service is down.",
    ring: "border-[#E8622E]/45",
    glow: "from-[#E8622E]/25 via-transparent to-transparent",
    text: "text-[#E8622E]",
    Icon: FaCircleExclamation,
  },
  major_outage: {
    title: "Major Outage",
    subtitle: "Multiple critical services are unavailable.",
    ring: "border-red-500/50",
    glow: "from-red-500/25 via-transparent to-transparent",
    text: "text-red-600 dark:text-red-400",
    Icon: FaCircleXmark,
  },
};

const SERVICE_STATUS: Record<
  ServiceHealthStatus,
  { label: string; dot: string; badge: string }
> = {
  operational: {
    label: "Operational",
    dot: "bg-[#10B981]",
    badge: "bg-[#10B981]/10 text-[#0d9668] dark:text-[#10B981]",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-[#F59E0B]",
    badge: "bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FCD34D]",
  },
  down: {
    label: "Down",
    dot: "bg-red-500",
    badge: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
};

const GROUP_META: Record<
  SystemHealthGroup,
  { label: string; Icon: typeof FaServer }
> = {
  core: { label: "Core Platform", Icon: FaServer },
  auth: { label: "Authentication", Icon: FaShieldHalved },
  comms: { label: "Communications", Icon: FaEnvelope },
  media: { label: "Media & Files", Icon: FaImage },
};

const SERVICE_ICONS: Record<string, typeof FaServer> = {
  api: FaWaveSquare,
  database: FaDatabase,
  "firebase-auth": FaGraduationCap,
  "admin-auth": FaLock,
  email: FaEnvelope,
  cloudinary: FaImage,
  "lms-frontend": FaServer,
  "lesson-media": FaVideo,
};

function formatCheckedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatLatency(ms: number | null): string {
  if (ms == null) return "—";
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${ms} ms`;
}

export default function AdminSystemHealthPage() {
  const { toPortal } = useAdminPortalPath();
  const reduceMotion = useReducedMotion();
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const data = await getAdminSystemHealth();
      setReport(data);
      setMaintenanceMessage(data.maintenance.message || "");
      setDenied(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load system health";
      if (/403|not authorized|forbidden|permission|access/i.test(message)) {
        setDenied(true);
      }
      setError(message);
      setReport(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleMaintenance = async () => {
    if (!report) return;
    const nextEnabled = !report.maintenance.enabled;
    const confirmMsg = nextEnabled
      ? "Enable maintenance mode? Students will see a maintenance screen in the LMS."
      : "Disable maintenance mode and restore LMS access?";
    if (!window.confirm(confirmMsg)) return;

    setActionBusy("maintenance");
    setActionNote("");
    try {
      await updateAdminSystemMaintenance({
        enabled: nextEnabled,
        message: maintenanceMessage.trim() || undefined,
      });
      setActionNote(
        nextEnabled
          ? "Maintenance mode is ON — LMS students will see the maintenance screen."
          : "Maintenance mode is OFF — LMS access restored."
      );
      await load(true);
    } catch (err) {
      setActionNote(err instanceof Error ? err.message : "Failed to update maintenance");
    } finally {
      setActionBusy(null);
    }
  };

  const handleRecycleDb = async () => {
    if (!window.confirm("Recycle the database connection pool? This is a soft restart, not a full host reboot.")) {
      return;
    }
    setActionBusy("recycle");
    setActionNote("");
    try {
      const result = await recycleAdminDatabasePool();
      setActionNote(`${result.detail} (${result.latencyMs} ms)`);
      await load(true);
    } catch (err) {
      setActionNote(err instanceof Error ? err.message : "Failed to recycle database pool");
    } finally {
      setActionBusy(null);
    }
  };

  const handleClearBrowserCache = () => {
    const { cleared } = clearAdminBrowserCaches();
    setActionNote(
      cleared.length
        ? `Cleared browser caches: ${cleared.join(", ")}. Reloading…`
        : "No admin cache keys found. Reloading…"
    );
    window.setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const overall = report ? OVERALL[report.overall] : null;

  const grouped = useMemo(() => {
    if (!report) return [];
    const order: SystemHealthGroup[] = ["core", "auth", "comms", "media"];
    return order
      .map((group) => ({
        group,
        meta: GROUP_META[group],
        items: report.services.filter((s) => s.group === group),
      }))
      .filter((row) => row.items.length > 0);
  }, [report]);

  if (loading) {
    return <SecurityPageSkeleton />;
  }

  if (denied) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-black/10 bg-[#F6F1E4] p-8 text-center shadow-xl dark:border-white/10 dark:bg-[#0D1B2A]">
        <FaUserShield className="mx-auto h-10 w-10 text-[#1E3FE0] dark:text-[#60A5FA]" aria-hidden />
        <h1 className="font-display-custom mt-4 text-2xl font-extrabold text-[#2A2A28] dark:text-white">
          Restricted operations view
        </h1>
        <p className="mt-2 text-sm text-[#6B6558] dark:text-slate-400">
          System Health is limited to leadership with Portal Security access.
        </p>
        <Link
          href={toPortal("/admin")}
          className="mt-6 inline-flex rounded-full bg-[#1E3FE0] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white dark:bg-[#60A5FA] dark:text-[#070B19]"
        >
          Back to Analytics
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#10B981]">
            ★ OPERATIONS CENTER
          </span>
          <h1 className="font-display-custom text-2xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-3xl">
            System Health
          </h1>
          <p className="mt-1 max-w-2xl text-xs font-medium text-[#6B6558] dark:text-slate-400 sm:text-sm">
            Live pulse of GenValue services that actually run today — API, database, auth, email, and
            media. No fake uptime. No payment or AI stubs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load(true)}
          disabled={refreshing}
          aria-label="Refresh system health"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black/10 bg-white/70 px-5 text-xs font-bold uppercase tracking-wider text-[#2A2A28] transition hover:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          <FaRotateRight className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
          {refreshing ? "Checking…" : "Re-check"}
        </button>
      </div>

      {error && !denied ? (
        <div
          className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {report && overall ? (
        <>
          {/* Hero status plane */}
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-[#0D1B2A] p-6 text-white shadow-2xl sm:p-8"
            aria-labelledby="system-health-status"
          >
            <div
              className={`pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-gradient-to-br ${overall.glow} blur-2xl`}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:28px_28px]"
              aria-hidden
            />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-5">
                <div
                  className={`relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 ${overall.ring} bg-white/5`}
                >
                  {!reduceMotion ? (
                    <span
                      className={`absolute inset-0 animate-ping rounded-full opacity-20 ${SERVICE_STATUS[report.counts.down ? "down" : report.counts.degraded ? "degraded" : "operational"].dot}`}
                      aria-hidden
                    />
                  ) : null}
                  <overall.Icon className={`relative h-8 w-8 ${overall.text}`} aria-hidden />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">
                    System Status
                  </p>
                  <h2
                    id="system-health-status"
                    className={`font-display-custom mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl ${overall.text}`}
                  >
                    {overall.title}
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-white/65">{overall.subtitle}</p>
                  {report.maintenance.enabled ? (
                    <p className="mt-2 inline-flex rounded-full bg-[#F59E0B]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#FCD34D]">
                      LMS maintenance mode active
                    </p>
                  ) : null}
                  <p className="mt-3 text-[11px] font-medium text-white/40">
                    Last checked {formatCheckedAt(report.checkedAt)} · {report.environment.hosting} ·{" "}
                    {report.environment.nodeEnv}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {[
                  { label: "Operational", value: report.counts.operational, tone: "text-[#10B981]" },
                  { label: "Degraded", value: report.counts.degraded, tone: "text-[#F59E0B]" },
                  { label: "Down", value: report.counts.down, tone: "text-red-400" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="min-w-[5.5rem] rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center backdrop-blur-sm"
                  >
                    <p className={`font-display-custom text-2xl font-extrabold ${stat.tone}`}>
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-white/45">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Auth / secrets signal strip */}
          <section
            className="grid gap-3 sm:grid-cols-3"
            aria-label="Authentication and secrets signals"
          >
            <SignalCard
              label="Active admins"
              value={String(report.authSignals.activeAdmins)}
              hint={`${report.authSignals.superAdmins} super · ${report.authSignals.securityAccessCount} security`}
              Icon={FaUserShield}
            />
            <SignalCard
              label="Production secrets"
              value={report.secrets.productionReady ? "Ready" : "Gaps"}
              hint={
                report.secrets.missingInProduction.length
                  ? `Missing: ${report.secrets.missingInProduction.join(", ")}`
                  : report.environment.isProduction
                    ? "Required production secrets are configured"
                    : "Non-production environment"
              }
              Icon={FaLock}
              warn={!report.secrets.productionReady && report.environment.isProduction}
            />
            <SignalCard
              label="Security deep-dive"
              value="Open"
              hint="Posture checks, portal isolation, probe details"
              Icon={FaShieldHalved}
              href={toPortal("/admin/security")}
            />
          </section>

          {actionNote ? (
            <div
              className="rounded-2xl border border-[#1E3FE0]/20 bg-[#1E3FE0]/8 p-4 text-sm font-semibold text-[#1E3FE0] dark:border-[#60A5FA]/25 dark:bg-[#60A5FA]/10 dark:text-[#60A5FA]"
              role="status"
            >
              {actionNote}
            </div>
          ) : null}

          {/* Operations */}
          <section
            className="rounded-3xl border border-black/10 bg-[#F6F1E4] p-5 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A] sm:p-6"
            aria-labelledby="ops-controls-heading"
          >
            <div className="mb-4 flex items-center gap-2">
              <FaScrewdriverWrench className="h-4 w-4 text-[#E8622E]" aria-hidden />
              <h3
                id="ops-controls-heading"
                className="font-display-custom text-sm font-extrabold uppercase tracking-wider text-[#2A2A28] dark:text-white"
              >
                Operations
              </h3>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-black/8 bg-white/55 p-4 dark:border-white/10 dark:bg-white/5 lg:col-span-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[#2A2A28] dark:text-white">Maintenance</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      report.maintenance.enabled
                        ? "bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FCD34D]"
                        : "bg-[#10B981]/10 text-[#10B981]"
                    }`}
                  >
                    {report.maintenance.enabled ? "Enabled" : "Off"}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-[#6B6558] dark:text-slate-400">
                  Blocks LMS student access with a maintenance screen. Admin portal stays available.
                </p>
                <label htmlFor="maintenance-message" className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-[#6B6558]">
                  Student message
                </label>
                <textarea
                  id="maintenance-message"
                  rows={3}
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white/80 px-3 py-2 text-sm text-[#2A2A28] outline-none focus:border-[#1E3FE0] dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#60A5FA]"
                  aria-label="Maintenance message shown to students"
                />
                <button
                  type="button"
                  onClick={() => void handleToggleMaintenance()}
                  disabled={actionBusy === "maintenance"}
                  aria-label={report.maintenance.enabled ? "Disable maintenance mode" : "Enable maintenance mode"}
                  className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50 ${
                    report.maintenance.enabled
                      ? "bg-[#10B981] hover:bg-[#0d9668]"
                      : "bg-[#E8622E] hover:bg-[#d55321]"
                  }`}
                >
                  <FaTriangleExclamation className="h-3.5 w-3.5" aria-hidden />
                  {actionBusy === "maintenance"
                    ? "Updating…"
                    : report.maintenance.enabled
                      ? "Disable maintenance"
                      : "Enable maintenance"}
                </button>
              </div>

              <div className="rounded-2xl border border-black/8 bg-white/55 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm font-bold text-[#2A2A28] dark:text-white">Restart services</p>
                <p className="mt-2 text-[11px] leading-relaxed text-[#6B6558] dark:text-slate-400">
                  {report.operations.restartNote}
                </p>
                <button
                  type="button"
                  onClick={() => void handleRecycleDb()}
                  disabled={actionBusy === "recycle"}
                  aria-label="Recycle database connection pool"
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#1E3FE0] px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#1530b5] disabled:opacity-50 dark:bg-[#60A5FA] dark:text-[#070B19]"
                >
                  <FaDatabase className="h-3.5 w-3.5" aria-hidden />
                  {actionBusy === "recycle" ? "Recycling…" : "Recycle DB pool"}
                </button>
                <p className="mt-3 text-[10px] font-medium text-[#6B6558] dark:text-slate-500">
                  API process restart: use Render dashboard (not available in-app).
                </p>
              </div>

              <div className="rounded-2xl border border-black/8 bg-white/55 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm font-bold text-[#2A2A28] dark:text-white">Reset browser cache</p>
                <p className="mt-2 text-[11px] leading-relaxed text-[#6B6558] dark:text-slate-400">
                  {report.operations.browserCacheNote}
                </p>
                <button
                  type="button"
                  onClick={handleClearBrowserCache}
                  aria-label="Clear admin browser caches and reload"
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 text-xs font-bold uppercase tracking-wider text-[#2A2A28] hover:bg-black/5 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  <FaBroom className="h-3.5 w-3.5" aria-hidden />
                  Clear & reload
                </button>
              </div>
            </div>
          </section>

          {/* System information */}
          <section
            className="rounded-3xl border border-black/10 bg-[#F6F1E4] p-5 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A] sm:p-6"
            aria-labelledby="system-info-heading"
          >
            <div className="mb-4 flex items-center gap-2">
              <FaServer className="h-4 w-4 text-[#1E3FE0] dark:text-[#60A5FA]" aria-hidden />
              <h3
                id="system-info-heading"
                className="font-display-custom text-sm font-extrabold uppercase tracking-wider text-[#2A2A28] dark:text-white"
              >
                System information
              </h3>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Application", value: `${report.systemInfo.appName} v${report.systemInfo.appVersion}` },
                { label: "Runtime", value: report.systemInfo.nodeVersion },
                { label: "Host / env", value: `${report.environment.hosting} · ${report.environment.nodeEnv}` },
                { label: "Platform", value: `${report.systemInfo.platform}/${report.systemInfo.arch}` },
                { label: "Process uptime", value: report.systemInfo.processUptimeLabel },
                { label: "PID", value: String(report.systemInfo.pid) },
                {
                  label: "Memory (RSS / heap)",
                  value: `${report.systemInfo.memory.rssMb} MB / ${report.systemInfo.memory.heapUsedMb} MB`,
                },
                {
                  label: "Maintenance",
                  value: report.maintenance.enabled ? "Enabled for LMS" : "Disabled",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="rounded-2xl border border-black/8 bg-white/55 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                >
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
                    {row.label}
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-[#2A2A28] dark:text-white">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Service groups */}
          <div className="space-y-6">
            {grouped.map(({ group, meta, items }, groupIndex) => (
              <motion.section
                key={group}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: reduceMotion ? 0 : groupIndex * 0.05 }}
                className="rounded-3xl border border-black/10 bg-[#F6F1E4] p-5 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A] sm:p-6"
                aria-labelledby={`health-group-${group}`}
              >
                <div className="mb-4 flex items-center gap-2">
                  <meta.Icon className="h-4 w-4 text-[#1E3FE0] dark:text-[#60A5FA]" aria-hidden />
                  <h3
                    id={`health-group-${group}`}
                    className="font-display-custom text-sm font-extrabold uppercase tracking-wider text-[#2A2A28] dark:text-white"
                  >
                    {meta.label}
                  </h3>
                </div>

                <ul className="grid gap-3 md:grid-cols-2">
                  {items.map((service) => {
                    const status = SERVICE_STATUS[service.status];
                    const Icon = SERVICE_ICONS[service.id] ?? FaServer;
                    return (
                      <li
                        key={service.id}
                        className="relative overflow-hidden rounded-2xl border border-black/8 bg-white/55 p-4 dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0D1B2A]/5 text-[#1E3FE0] dark:bg-white/10 dark:text-[#60A5FA]">
                              <Icon className="h-4 w-4" aria-hidden />
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-[#2A2A28] dark:text-white">
                                  {service.name}
                                </p>
                                {service.informational ? (
                                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#6B6558] dark:bg-white/10 dark:text-slate-400">
                                    Info
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-xs leading-relaxed text-[#6B6558] dark:text-slate-400">
                                {service.detail}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status.badge}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} aria-hidden />
                              {status.label}
                            </span>
                            <p className="mt-2 font-display-custom text-lg font-extrabold tabular-nums text-[#2A2A28] dark:text-white">
                              {formatLatency(service.latencyMs)}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </motion.section>
            ))}
          </div>

          {/* Explicitly not monitored */}
          <section
            className="rounded-3xl border border-dashed border-black/15 bg-[#F6F1E4]/60 p-5 dark:border-white/15 dark:bg-[#0D1B2A]/60 sm:p-6"
            aria-labelledby="out-of-scope-heading"
          >
            <h3
              id="out-of-scope-heading"
              className="font-display-custom text-sm font-extrabold text-[#2A2A28] dark:text-white"
            >
              Not in GenValue yet
            </h3>
            <p className="mt-1 text-xs text-[#6B6558] dark:text-slate-400">
              These common health modules are omitted on purpose until the product supports them.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {report.outOfScope.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-black/8 bg-white/40 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                >
                  <p className="text-xs font-bold text-[#2A2A28] dark:text-white">{item.label}</p>
                  <p className="mt-0.5 text-[11px] text-[#6B6558] dark:text-slate-400">{item.reason}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}

function SignalCard({
  label,
  value,
  hint,
  Icon,
  href,
  warn = false,
}: {
  label: string;
  value: string;
  hint: string;
  Icon: typeof FaServer;
  href?: string;
  warn?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
          {label}
        </p>
        <Icon
          className={`h-4 w-4 ${warn ? "text-[#F59E0B]" : "text-[#1E3FE0] dark:text-[#60A5FA]"}`}
          aria-hidden
        />
      </div>
      <p className="font-display-custom mt-2 text-xl font-extrabold text-[#2A2A28] dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-[#6B6558] dark:text-slate-400">{hint}</p>
    </>
  );

  const className = `rounded-3xl border border-black/10 bg-[#F6F1E4] p-4 shadow-lg transition dark:border-white/10 dark:bg-[#0D1B2A] ${
    href ? "hover:border-[#1E3FE0]/30 dark:hover:border-[#60A5FA]/30" : ""
  }`;

  if (href) {
    return (
      <Link href={href} className={className} aria-label={`${label}: ${value}`}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
