"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { SiteLogoMark } from "@/components/layout/SiteLogoMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { EnrollNowLink } from "@/components/ui/EnrollNowLink";
import { SITE } from "@/lib/constants";
import { applyLiquidGlass } from "@/lib/liquid-glass";

export type NavItem = {
  readonly label: string;
  readonly href: string;
};

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "About", href: "/about" },
  { label: "Team", href: "/team" },
  { label: "Instructors", href: "/instructors" },
  { label: "Dispatch", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();

  const updateScroll = useCallback(() => {
    setScrolled(window.scrollY > 40);
  }, []);

  useEffect(() => {
    let rafId = 0;
    const syncFromScrollPosition = () => {
      rafId = requestAnimationFrame(() => updateScroll());
    };
    syncFromScrollPosition();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", updateScroll);
    };
  }, [updateScroll]);

  const closeMobileMenu = useCallback(() => {
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  // Close menu when route changes (phone → tablet rotates / navigates)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = navContainerRef.current;
    if (!el) return;
    const instance = applyLiquidGlass(el, {
      scale: -132,
      chroma: 8,
      border: 0.08,
      mapBlur: 14,
      blur: 3,
      saturate: 1.45,
      fallbackBlur: 18,
    });
    instance.refresh();
    requestAnimationFrame(() => instance.refresh());
    return () => {
      instance.destroy();
    };
  }, []);

  return (
    <header className="sticky top-3 z-50 px-3 sm:top-4 sm:px-6">
      <div className="relative mx-auto max-w-[1240px]">
      <div
        ref={navContainerRef}
        className={`liquid-glass-navbar flex max-w-[1240px] items-center justify-between gap-2 rounded-full px-3 py-2 transition-all duration-300 sm:gap-4 sm:px-5 sm:py-2.5 ${
          scrolled
            ? "shadow-[0_14px_35px_rgba(20,20,20,0.18)] dark:shadow-[0_14px_35px_rgba(0,0,0,0.6)]"
            : "shadow-md"
        }`}
      >
        <Link
          href="/"
          aria-label="GenValue - Home"
          className="flex min-w-0 shrink items-center gap-2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8622E]"
        >
          <SiteLogoMark
            className="h-7 w-auto sm:h-8"
            showText
            textClassName="max-[360px]:hidden"
          />
        </Link>

        {/* Primary links only from lg — avoids tablet squeeze */}
        <nav
          className="hidden min-w-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#6B6558] dark:text-slate-300 lg:flex xl:gap-5 xl:text-xs"
          aria-label="Primary"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 whitespace-nowrap transition-colors hover:text-[#2A2A28] dark:hover:text-white ${
                  active
                    ? "font-bold text-[#1E3FE0] underline underline-offset-4 dark:text-[#60A5FA]"
                    : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <ThemeToggle />

          <EnrollNowLink
            aria-label="Enroll in AI Tools Mastery"
            className="hidden rounded-full bg-[#E8622E] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#d55321] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8622E] md:inline-flex md:items-center md:justify-center xl:px-5 xl:text-xs"
          >
            Enroll Now
          </EnrollNowLink>

          <span className="group relative hidden xl:inline-flex" title="Download Syllabus">
            <DownloadButton
              href={SITE.syllabusPdfUrl}
              filename={SITE.syllabusDownloadFilename}
              label="Download Syllabus"
              variant="ghost"
              size="sm"
              iconOnly
              trackingLabel="Download Syllabus"
            />
          </span>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full p-2 text-[#2A2A28] transition-colors hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8622E] dark:text-white dark:hover:bg-white/10 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls={menuId}
            aria-label={mobileOpen ? "Close main navigation menu" : "Open main navigation menu"}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {mobileOpen ? (
          <>
            {/* Dim backdrop — tap to dismiss without covering entire feel of a full page */}
            <motion.button
              key="mobile-backdrop"
              type="button"
              aria-label="Close navigation menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] lg:hidden"
              onClick={closeMobileMenu}
            />

            <motion.div
              id={menuId}
              key="mobile-panel"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(17.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/98 p-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0D1B2A]/98 lg:hidden"
            >
              <nav className="flex flex-col gap-0.5" aria-label="Mobile primary">
                {NAV_ITEMS.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                        active
                          ? "bg-[#1E3FE0]/10 text-[#1E3FE0] dark:bg-white/10 dark:text-white"
                          : "text-[#2A2A28] hover:bg-zinc-100 dark:text-slate-200 dark:hover:bg-white/5"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                <div className="mt-1.5 space-y-1.5 border-t border-black/5 pt-2 dark:border-white/10">
                  <DownloadButton
                    href={SITE.syllabusPdfUrl}
                    filename={SITE.syllabusDownloadFilename}
                    label="Syllabus"
                    variant="outline"
                    size="sm"
                    className="!h-9 !w-full !px-3 !text-xs"
                    trackingLabel="Download Syllabus (mobile nav)"
                  />
                  {/* Enroll already in the pill from md — only here on small phones */}
                  <EnrollNowLink
                    onClick={closeMobileMenu}
                    aria-label="Enroll in AI Tools Mastery program"
                    className="inline-flex h-9 w-full items-center justify-center rounded-full bg-[#E8622E] px-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#d55321] md:hidden"
                  >
                    Enroll Now
                  </EnrollNowLink>
                </div>
              </nav>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
      </div>
    </header>
  );
}
