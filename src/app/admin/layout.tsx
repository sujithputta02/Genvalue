"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaBars,
  FaBell,
  FaBug,
  FaChartPie,
  FaClockRotateLeft,
  FaGear,
  FaMagnifyingGlass,
  FaNewspaper,
  FaRightFromBracket,
  FaShieldHalved,
  FaUserShield,
  FaUsers,
  FaXmark,
  FaLock,
} from "react-icons/fa6";
import Avatar from "@/components/ui/Avatar";
import { applyLiquidGlass } from "@/lib/liquid-glass";
import { adminPortalPathToAdmin } from "@/lib/adminPortalSession";
import { useAdminPortalPath } from "@/hooks/useAdminPortalPath";
import {
  clearAdminSession,
  getAdminProfile,
  getCachedAdminProfile,
  isAdminAuthenticated,
  recordAdminLogout,
  restoreAdminSessionIfNeeded,
  type AdminProfile,
} from "@/services/adminService";
import {
  ADMIN_NAV_SECTION_MAP,
  adminHasPortalSection,
  getFirstAllowedAdminHref,
} from "@/lib/adminRoles";
import { PortalLayoutSkeleton } from "@/components/skeletons";

const SUPER_ADMIN_ONLY_PATH = "/admin/authorized-admins";
const SETTINGS_PATH = "/admin/settings";

const NAV_ITEMS = [
  { label: "Analytics", href: "/admin", Icon: FaChartPie, section: "ANALYTICS" as const },
  { label: "Student Roster", href: "/admin/students", Icon: FaUsers, section: "STUDENTS" as const },
  { label: "Announcements", href: "/admin/announcements", Icon: FaBell, section: "ANNOUNCEMENTS" as const },
  { label: "The Dispatch", href: "/admin/dispatch", Icon: FaNewspaper, section: "DISPATCH" as const },
  { label: "Bug Reports", href: "/admin/bug-reports", Icon: FaBug, section: "BUG_REPORTS" as const },
  { label: "System Audit Logs", href: "/admin/audit-logs", Icon: FaClockRotateLeft, section: "AUDIT_LOGS" as const },
  { label: "Security", href: "/admin/security", Icon: FaLock, section: "SECURITY" as const },
  { label: "Settings", href: SETTINGS_PATH, Icon: FaGear, section: null },
];

const SEARCH_DESTINATIONS = [
  { keywords: ["analytics", "dashboard", "overview"], href: "/admin", label: "Analytics" },
  { keywords: ["student", "roster", "users"], href: "/admin/students", label: "Student Roster" },
  { keywords: ["announcement", "notice", "broadcast"], href: "/admin/announcements", label: "Announcements" },
  { keywords: ["dispatch", "blog", "post", "article"], href: "/admin/dispatch", label: "The Dispatch" },
  { keywords: ["bug", "report", "issue", "student feedback"], href: "/admin/bug-reports", label: "Bug Reports" },
  { keywords: ["audit", "log", "system"], href: "/admin/audit-logs", label: "System Audit Logs" },
  { keywords: ["security", "portal", "auth", "token", "evaluation"], href: "/admin/security", label: "Security" },
  { keywords: ["authorized", "admin", "email"], href: SUPER_ADMIN_ONLY_PATH, label: "Authorized Admins" },
  { keywords: ["settings", "profile", "account"], href: SETTINGS_PATH, label: "Settings" },
];

function resolveAdminSearch(query: string): string | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;

  const direct = SEARCH_DESTINATIONS.find(
    (item) =>
      item.label.toLowerCase().includes(normalized) ||
      item.keywords.some((keyword) => keyword.includes(normalized) || normalized.includes(keyword))
  );
  if (direct) return direct.href;

  return `/admin/students?search=${encodeURIComponent(normalized)}`;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { sessionId, toPortal, portalRoot } = useAdminPortalPath();
  const internalPathname =
    adminPortalPathToAdmin(pathname ?? "") ?? pathname ?? "";
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navbarRef = useRef<HTMLDivElement>(null);

  const isAuthPage =
    pathname === "/admin/auth" || pathname?.startsWith("/admin/auth/");

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isAuthPage || checkingAuth) return;

    const el = navbarRef.current;
    if (!el) return;

    let glass: ReturnType<typeof applyLiquidGlass> | null = null;
    let raf1 = 0;
    let raf2 = 0;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        glass = applyLiquidGlass(el, {
          scale: -132,
          chroma: 8,
          border: 0.08,
          mapBlur: 14,
          blur: 3,
          saturate: 1.45,
          fallbackBlur: 18,
        });
        glass.refresh();
        requestAnimationFrame(() => glass?.refresh());
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      glass?.destroy();
    };
  }, [isAuthPage, checkingAuth, sidebarOpen]);

  useEffect(() => {
    if (isAuthPage) {
      setCheckingAuth(false);
      return;
    }

    if (!isAdminAuthenticated()) {
      router.replace("/admin/auth/login");
      return;
    }

    restoreAdminSessionIfNeeded();

    const cachedProfile = getCachedAdminProfile();
    if (cachedProfile) {
      setAdminProfile(cachedProfile);
    }

    getAdminProfile()
      .then((profile) => {
        const activeProfile = profile ?? cachedProfile;

        if (!activeProfile) {
          clearAdminSession();
          router.replace("/admin/auth/login");
          return;
        }

        if (internalPathname === SUPER_ADMIN_ONLY_PATH && !activeProfile.isSuperAdmin) {
          router.replace(getFirstAllowedAdminHref(activeProfile, sessionId));
          return;
        }

        const requiredSection =
          internalPathname && internalPathname !== SETTINGS_PATH
            ? ADMIN_NAV_SECTION_MAP[internalPathname]
            : undefined;
        if (requiredSection && !adminHasPortalSection(activeProfile, requiredSection)) {
          router.replace(getFirstAllowedAdminHref(activeProfile, sessionId));
          return;
        }

        setAdminProfile(activeProfile);
      })
      .finally(() => setCheckingAuth(false));
  }, [isAuthPage, internalPathname, pathname, router, sessionId]);

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const destination = resolveAdminSearch(searchQuery);
      if (destination) {
        router.push(toPortal(destination));
        setSearchQuery("");
        setMobileNavOpen(false);
      }
    },
    [router, searchQuery, toPortal]
  );

  const handleSignOut = () => {
    void (async () => {
      await recordAdminLogout();
      clearAdminSession();
      router.push("/admin/auth/login");
    })();
  };

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (checkingAuth) {
    return <PortalLayoutSkeleton portal="admin" />;
  }

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => item.section === null || adminHasPortalSection(adminProfile, item.section)
  );

  const navItems = adminProfile?.isSuperAdmin
    ? [
        ...visibleNavItems.filter((item) => item.href !== SETTINGS_PATH),
        {
          label: "Authorized Admins",
          href: SUPER_ADMIN_ONLY_PATH,
          Icon: FaUserShield,
          section: null as null,
        },
        visibleNavItems.find((item) => item.href === SETTINGS_PATH)!,
      ].filter(Boolean)
    : visibleNavItems;

  const renderNavLinks = (onNavigate?: () => void) =>
    navItems.map((item) => {
      const portalHref = toPortal(item.href);
      const active =
        internalPathname === item.href ||
        (item.href !== "/admin" && internalPathname?.startsWith(item.href));
      return (
        <Link
          key={item.href}
          href={portalHref}
          aria-label={item.label}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold transition ${
            active
              ? "bg-[#1E3FE0] text-white shadow-md dark:bg-[#60A5FA] dark:text-[#070B19]"
              : "text-[#6B6558] hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5"
          }`}
        >
          <item.Icon className="h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      );
    });

  const sidebarFooter = (
    <div className="border-t border-black/10 pt-4 dark:border-white/10">
      <div className="mb-3 flex items-center gap-3 px-2">
        <FaShieldHalved className="h-8 w-8 shrink-0 text-[#10B981]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-[#2A2A28] dark:text-white">
            {adminProfile?.name || "Administrator"}
          </p>
          <p className="truncate text-[10px] font-medium text-[#6B6558] dark:text-slate-400">
            {adminProfile?.email ?? ""}
          </p>
          {adminProfile?.isSuperAdmin && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#E8622E]">
              Super Admin
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        aria-label="Sign out of admin portal"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:border-white/10 dark:bg-white/5 dark:text-red-400"
      >
        <FaRightFromBracket className="h-3.5 w-3.5" />
        <span>Sign Out</span>
      </button>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#EDE6D3] text-[#2A2A28] dark:bg-[#070B19] dark:text-slate-200">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04] [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.06] dark:[background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)]"
        aria-hidden="true"
      />

      {/* Desktop sidebar - fixed, scrolls independently */}
      {sidebarOpen && (
        <aside className="relative hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-black/10 bg-[#F6F1E4] p-6 dark:border-white/10 dark:bg-[#0D1B2A] lg:flex">
          <div>
            <div className="flex items-center justify-between gap-2">
              <Link href={portalRoot} className="flex min-w-0 items-center gap-2 px-2 py-1" aria-label="GenValue Admin home">
                <div className="relative h-9 w-9 shrink-0">
                  <Image src="/Genvalue Light.svg" alt="GenValue Logo" fill className="object-contain dark:hidden" priority />
                  <Image src="/Genvalue Dark.svg" alt="GenValue Logo" fill className="hidden object-contain dark:block" priority />
                </div>
                <span className="font-display-custom text-xl font-extrabold tracking-tight">
                  <span className="text-[#2A2A28] dark:text-white">Gen</span>
                  <span className="text-[#1E3FE0] dark:text-[#60A5FA]">Value</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
                className="shrink-0 rounded-lg p-2 text-[#6B6558] transition hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5"
              >
                <FaXmark className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-8 space-y-1.5">{renderNavLinks()}</nav>
          </div>
          {sidebarFooter}
        </aside>
      )}

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Close navigation menu"
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col justify-between overflow-y-auto border-r border-black/10 bg-[#F6F1E4] p-6 shadow-2xl dark:border-white/10 dark:bg-[#0D1B2A] lg:hidden"
            >
              <div>
                <div className="mb-6 flex items-center justify-between gap-2">
                  <Link
                    href={portalRoot}
                    className="flex items-center gap-2"
                    aria-label="GenValue Admin home"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <div className="relative h-9 w-9">
                      <Image src="/Genvalue Light.svg" alt="GenValue Logo" fill className="object-contain dark:hidden" priority />
                      <Image src="/Genvalue Dark.svg" alt="GenValue Logo" fill className="hidden object-contain dark:block" priority />
                    </div>
                    <span className="font-display-custom text-xl font-extrabold tracking-tight">
                      <span className="text-[#2A2A28] dark:text-white">Gen</span>
                      <span className="text-[#1E3FE0] dark:text-[#60A5FA]">Value</span>
                    </span>
                    <span className="rounded-full bg-[#10B981]/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#10B981]">
                      Admin
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="rounded-lg p-2 text-[#6B6558] hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <FaXmark className="h-5 w-5" />
                  </button>
                </div>
                <nav className="space-y-1.5">{renderNavLinks(() => setMobileNavOpen(false))}</nav>
              </div>
              {sidebarFooter}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column - content scrolls under sticky glass navbar (same as hero) */}
      <div className="relative min-w-0 flex-1 overflow-y-auto">
        <header className="sticky top-4 z-50 px-4 pb-4 sm:px-6 sm:pb-5">
          <div
            ref={navbarRef}
            className="liquid-glass-navbar mx-auto flex max-w-[1240px] items-center justify-between gap-3 rounded-full px-4 py-2.5 shadow-md transition-all duration-300 sm:gap-4 sm:px-5"
          >
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              {!sidebarOpen && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                  className="hidden rounded-full p-2 text-[#2A2A28] transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10 lg:inline-flex"
                >
                  <FaBars className="h-5 w-5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation menu"
                className="inline-flex rounded-full p-2 text-[#2A2A28] transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10 lg:hidden"
              >
                <FaBars className="h-5 w-5" />
              </button>

              <Link href={portalRoot} className="flex shrink-0 items-center gap-2" aria-label="GenValue Admin">
                <div className="relative h-7 w-7 sm:h-8 sm:w-8">
                  <Image src="/Genvalue Light.svg" alt="GenValue Logo" fill className="object-contain dark:hidden" priority />
                  <Image src="/Genvalue Dark.svg" alt="GenValue Logo" fill className="hidden object-contain dark:block" priority />
                </div>
                <span className="font-display-custom text-sm font-extrabold tracking-tight sm:text-base">
                  <span className="text-[#2A2A28] dark:text-white">Gen</span>
                  <span className="text-[#1E3FE0] dark:text-[#60A5FA]">Value</span>
                  <span className="ml-1.5 rounded-full bg-[#10B981]/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#10B981]">
                    Admin
                  </span>
                </span>
              </Link>
            </div>

            <form onSubmit={handleSearchSubmit} className="hidden min-w-0 flex-1 max-w-md lg:block">
              <div className="relative">
                <FaMagnifyingGlass className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6558] dark:text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search admin pages, students..."
                  aria-label="Search admin portal"
                  className="w-full rounded-full border border-black/10 bg-white/40 py-2 pl-11 pr-4 text-sm font-medium text-[#2A2A28] placeholder:text-[#6B6558]/60 outline-none transition focus:border-[#1E3FE0] focus:bg-white/70 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-slate-400/60 dark:focus:border-[#60A5FA] dark:focus:bg-white/20"
                />
              </div>
            </form>

            <Link
              href={SETTINGS_PATH}
              aria-label="Admin settings and profile"
              className="shrink-0 rounded-full p-0.5 transition hover:ring-2 hover:ring-[#1E3FE0]/20 dark:hover:ring-[#60A5FA]/20"
            >
              <Avatar
                name={adminProfile?.name || adminProfile?.email || "Admin"}
                size="sm"
                className="border-2 border-white/80 ring-1 ring-black/5 dark:border-white/20 dark:ring-white/10"
              />
            </Link>
          </div>

          <form onSubmit={handleSearchSubmit} className="mx-auto mt-2 max-w-[1240px] lg:hidden">
            <div className="relative">
              <FaMagnifyingGlass className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6558] dark:text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search admin portal..."
                aria-label="Search admin portal"
                className="w-full rounded-full border border-black/10 bg-[#F6F1E4]/80 py-2.5 pl-11 pr-4 text-sm font-medium text-[#2A2A28] placeholder:text-[#6B6558]/60 outline-none backdrop-blur-sm transition focus:border-[#1E3FE0] focus:bg-white dark:border-white/10 dark:bg-[#0D1B2A]/80 dark:text-white dark:placeholder:text-slate-400/60 dark:focus:border-[#60A5FA]"
              />
            </div>
          </form>
        </header>

        <main className="px-4 pb-10 pt-6 sm:px-6 sm:pt-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
