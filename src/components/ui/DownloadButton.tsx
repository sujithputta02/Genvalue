"use client";

// TODO: Replace NEXT_PUBLIC_GA_ID in layout.tsx with your real Google Analytics ID to activate gtag tracking

import { useCallback, useRef, useState } from "react";
import { HiOutlineDownload } from "react-icons/hi";
import { FaSpinner } from "react-icons/fa6";

declare global {
  interface Window {
    gtag?: (command: string, action: string, params?: Record<string, unknown>) => void;
  }
}

export interface DownloadButtonProps {
  href: string;
  filename: string;
  label?: string;
  variant?: "gold" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  trackingLabel?: string;
  /** Shown as a small badge after the label (e.g. "27 KB"). */
  fileSize?: string;
  /** Icon + optional screen-reader label only (e.g. compact navbar). */
  iconOnly?: boolean;
  className?: string;
  fullWidth?: boolean;
}

const sizeClasses = {
  sm: "gap-1.5 px-3 py-2 text-sm h-9",
  md: "gap-2 px-6 py-3 text-base h-12",
  lg: "gap-2.5 px-8 py-3.5 text-base h-14",
} as const;

const iconOnlySizeClasses = {
  sm: "min-h-9 min-w-9 gap-0 p-0 px-0 py-0",
  md: "min-h-10 min-w-10 gap-0 p-0",
  lg: "min-h-12 min-w-12 gap-0 p-0",
} as const;

const variantClasses = {
  gold:
    "bg-[#F59E0B] text-[#0D1B2A] shadow-lg shadow-amber-500/20 hover:brightness-105 focus-visible:outline-[#F59E0B]",
  outline:
    "border-2 border-[#F59E0B] bg-white text-zinc-900 hover:border-[#D97706] hover:text-[#B45309] focus-visible:outline-[#2563EB] dark:border-[#FBBF24]/80 dark:bg-transparent dark:text-white dark:hover:border-[#FBBF24] dark:hover:text-[#FBBF24]",
  ghost:
    "border border-transparent bg-transparent text-[#B45309] hover:bg-amber-500/10 hover:underline focus-visible:outline-[#F59E0B] dark:text-[#FBBF24] dark:hover:bg-amber-500/15",
} as const;

const RESET_MS = 2000;

function trackDownload(filename: string): void {
  try {
    window.gtag?.("event", "syllabus_download", { page_location: window.location.href });
  } catch {
    /* ignore - tracking must never block */
  }

  try {
    void fetch("/api/track-download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename,
        page: typeof window !== "undefined" ? window.location.href : "",
      }),
    }).catch(() => {});
  } catch {
    /* ignore - tracking must never block */
  }
}

export function DownloadButton({
  href,
  filename,
  label = "Download",
  variant = "outline",
  size = "md",
  trackingLabel,
  fileSize,
  iconOnly = false,
  className = "",
  fullWidth = false,
}: DownloadButtonProps) {
  const [busy, setBusy] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accessibleName = trackingLabel ?? (iconOnly ? `Download ${filename}` : `${label} ${filename}`.trim());

  const handleClick = useCallback(() => {
    if (busy) return;
    trackDownload(filename);
    setBusy(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setBusy(false);
      timeoutRef.current = null;
    }, RESET_MS);
  }, [busy, filename]);

  const base =
    "inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

  const sizeClass = iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size];
  const widthClass = iconOnly ? "shrink-0" : fullWidth ? "w-full sm:w-auto" : "shrink-0";
  const iconClass =
    iconOnly
      ? size === "sm"
        ? "h-4 w-4"
        : size === "lg"
          ? "h-6 w-6"
          : "h-5 w-5"
      : size === "sm"
        ? "h-4 w-4"
        : size === "lg"
          ? "h-6 w-6"
          : "h-5 w-5";

  return (
    <a
      href={href}
      download={filename}
      role="button"
      aria-label={accessibleName}
      aria-busy={busy}
      data-tracking-label={trackingLabel ?? undefined}
      className={`${base} ${sizeClass} ${widthClass} ${variantClasses[variant]} ${className}`.trim()}
      onClick={handleClick}
    >
      <span className="inline-flex shrink-0 items-center justify-center" aria-hidden>
        {busy ? (
          <FaSpinner className={`${iconClass} animate-spin`} />
        ) : (
          <HiOutlineDownload className={iconClass} />
        )}
      </span>
      {iconOnly ? (
        <span className="sr-only">{busy ? "Downloading…" : label}</span>
      ) : (
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span>{busy ? "Downloading…" : label}</span>
          {!busy && fileSize ? (
            <span className="rounded-md bg-black/5 px-1.5 py-0.5 text-[0.65em] font-medium uppercase tracking-wide text-zinc-600 dark:bg-white/10 dark:text-slate-400">
              {fileSize}
            </span>
          ) : null}
        </span>
      )}
    </a>
  );
}
