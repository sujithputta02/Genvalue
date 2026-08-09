"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FaShieldHalved } from "react-icons/fa6";

type SecurityScanAnimationProps = {
  /** Shorter loop while the page is refreshing checks */
  active?: boolean;
  label?: string;
  className?: string;
};

/**
 * Brand-matched security scan visual for the admin Security page.
 * Uses GenValue paper / brand-blue / emerald tokens; respects reduced motion.
 */
export function SecurityScanAnimation({
  active = true,
  label = "Scanning portal controls…",
  className = "",
}: SecurityScanAnimationProps) {
  const reduceMotion = useReducedMotion();
  const animate = active && !reduceMotion;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-[#1E3FE0]/20 bg-[#F6F1E4] p-6 shadow-xl dark:border-[#60A5FA]/30 dark:bg-[#0D1B2A] sm:p-8 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,63,224,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(30,63,224,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />

      <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
        <div className="relative flex h-36 w-36 shrink-0 items-center justify-center sm:h-40 sm:w-40">
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border border-[#1E3FE0]/25 dark:border-[#60A5FA]/30"
            animate={animate ? { rotate: 360 } : undefined}
            transition={animate ? { duration: 12, repeat: Infinity, ease: "linear" } : undefined}
            aria-hidden
          >
            <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1E3FE0] dark:bg-[#60A5FA]" />
            <span className="absolute bottom-2 left-3 h-1.5 w-1.5 rounded-full bg-[#10B981]" />
          </motion.div>

          {/* Mid ring */}
          <motion.div
            className="absolute inset-4 rounded-full border border-dashed border-[#10B981]/40"
            animate={animate ? { rotate: -360 } : undefined}
            transition={animate ? { duration: 9, repeat: Infinity, ease: "linear" } : undefined}
            aria-hidden
          />

          {/* Sweep */}
          <motion.div
            className="absolute inset-2 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, rgba(30,63,224,0.35) 50deg, transparent 90deg)",
            }}
            animate={animate ? { rotate: 360 } : undefined}
            transition={animate ? { duration: 2.4, repeat: Infinity, ease: "linear" } : undefined}
            aria-hidden
          />

          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E3FE0]/10 text-[#1E3FE0] shadow-inner dark:bg-[#60A5FA]/15 dark:text-[#60A5FA]">
            <FaShieldHalved className="h-7 w-7" aria-hidden />
          </div>
        </div>

        <div className="relative min-w-0 flex-1 text-center sm:text-left">
          <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#1E3FE0] dark:text-[#60A5FA]">
            ★ Live scan
          </span>
          <h2 className="font-display-custom mt-1 text-xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-2xl">
            {label}
          </h2>
          <p className="mt-2 max-w-md text-xs font-medium text-[#6B6558] dark:text-slate-400 sm:text-sm">
            Evaluating LMS, Admin, Platform, and Deployment controls against GenValue security
            policy.
          </p>

          <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <motion.div
              className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-[#1E3FE0] via-[#60A5FA] to-[#10B981]"
              animate={
                animate
                  ? { x: ["-10%", "280%"] }
                  : { x: "100%", width: "100%" }
              }
              transition={
                animate
                  ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                  : undefined
              }
              aria-hidden
            />
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            {["Auth", "Sessions", "Secrets", "Deploy"].map((tag, index) => (
              <motion.span
                key={tag}
                className="rounded-full border border-[#1E3FE0]/15 bg-white/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1E3FE0] dark:border-[#60A5FA]/25 dark:bg-white/5 dark:text-[#60A5FA]"
                animate={
                  animate
                    ? { opacity: [0.45, 1, 0.45] }
                    : { opacity: 1 }
                }
                transition={
                  animate
                    ? { duration: 1.8, repeat: Infinity, delay: index * 0.2 }
                    : undefined
                }
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
