"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { EnrollNowLink } from "@/components/ui/EnrollNowLink";
import { applyLiquidGlass } from "@/lib/liquid-glass";

type ParticleConfig = {
  readonly leftPct: number;
  readonly topPct: number;
  readonly txPx: number;
  readonly tyPx: number;
  readonly delaySec: number;
  readonly durationSec: number;
  readonly sizeClass: string;
};

const PARTICLES: readonly ParticleConfig[] = [
  { leftPct: 6, topPct: 12, txPx: 28, tyPx: -22, delaySec: 0, durationSec: 11, sizeClass: "h-1 w-1" },
  { leftPct: 18, topPct: 78, txPx: -20, tyPx: -30, delaySec: 1.2, durationSec: 9, sizeClass: "h-1.5 w-1.5" },
  { leftPct: 88, topPct: 18, txPx: -26, tyPx: 18, delaySec: 0.4, durationSec: 10, sizeClass: "h-1 w-1" },
  { leftPct: 72, topPct: 65, txPx: 22, tyPx: -24, delaySec: 2.1, durationSec: 12, sizeClass: "h-1 w-1" },
  { leftPct: 42, topPct: 8, txPx: 14, tyPx: 16, delaySec: 0.8, durationSec: 8.5, sizeClass: "h-1.5 w-1.5" },
  { leftPct: 55, topPct: 88, txPx: -18, tyPx: -14, delaySec: 1.6, durationSec: 9.5, sizeClass: "h-1 w-1" },
  { leftPct: 12, topPct: 48, txPx: 32, tyPx: 12, delaySec: 0.2, durationSec: 10.5, sizeClass: "h-1 w-1" },
  { leftPct: 92, topPct: 52, txPx: -30, tyPx: -20, delaySec: 2.4, durationSec: 11, sizeClass: "h-1 w-1" },
  { leftPct: 30, topPct: 30, txPx: -12, tyPx: -28, delaySec: 1, durationSec: 8, sizeClass: "h-1.5 w-1.5" },
  { leftPct: 65, topPct: 28, txPx: 20, tyPx: 24, delaySec: 1.8, durationSec: 9, sizeClass: "h-1 w-1" },
  { leftPct: 48, topPct: 62, txPx: -24, tyPx: 20, delaySec: 0.6, durationSec: 12, sizeClass: "h-1 w-1" },
  { leftPct: 78, topPct: 12, txPx: 16, tyPx: -18, delaySec: 2.8, durationSec: 10, sizeClass: "h-1 w-1" },
];

const CONTACT_EMAIL = "genvalue.academy@gmail.com" as const;

export function EnrollCTA() {
  const ctaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const instance = applyLiquidGlass(el, { scale: -100, chroma: 5, mapBlur: 4, blur: 0, fallbackBlur: 0 });
    return () => {
      instance.destroy();
    };
  }, []);

  return (
    <motion.section
      ref={ctaRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6 }}
      className="relative mx-4 my-12 w-[calc(100%-2rem)] max-w-[1200px] overflow-hidden rounded-[28px] bg-[#12266E] px-5 py-14 text-center text-white shadow-2xl sm:mx-6 sm:my-16 sm:w-[calc(100%-3rem)] sm:px-8 sm:py-16 lg:mx-auto lg:my-20 lg:w-full lg:px-10 lg:py-20"
      aria-labelledby="enroll-cta-heading"
    >
      {/* Blueprint Grid Lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:28px_28px]"
        aria-hidden="true"
      />

      {/* Floating Ambient Particles */}
      <div
        className="pointer-events-none absolute inset-0 motion-reduce:hidden"
        aria-hidden="true"
      >
        {PARTICLES.map((p, index) => (
          <span
            key={`particle-${index}-${p.leftPct}-${p.topPct}`}
            className={`enroll-particle-dot absolute rounded-full bg-white/40 shadow-[0_0_12px_rgba(255,255,255,0.6)] ${p.sizeClass}`}
            style={{
              left: `${p.leftPct}%`,
              top: `${p.topPct}%`,
              ["--enroll-tx" as string]: `${p.txPx}px`,
              ["--enroll-ty" as string]: `${p.tyPx}px`,
              animation: `enroll-particle ${p.durationSec}s ease-in-out infinite`,
              animationDelay: `${p.delaySec}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-3xl">
        <span className="font-annotation inline-block -rotate-2 text-sm font-bold uppercase tracking-wider text-[#E8622E]">
          ★ START YOUR AI MASTERY JOURNEY
        </span>
        <h2
          id="enroll-cta-heading"
          className="font-display-custom mt-2 text-balance text-2xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
        >
          Ready to Work Smarter?
        </h2>
        <p className="mt-4 text-pretty text-base text-[#CFD6F5] sm:text-lg md:text-xl">
          Join 500+ professionals who chose clear tool judgment over hype.
        </p>

        <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-6">
          <EnrollNowLink className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-full bg-[#E8622E] px-8 text-sm font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#d55321] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8622E] sm:w-auto sm:min-w-[200px] sm:px-10 sm:text-base">
            Enroll Now
          </EnrollNowLink>
          <Link
            href="/contact"
            className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-full border-2 border-white/40 bg-transparent px-8 text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto sm:text-base"
          >
            Contact Us
          </Link>
        </div>

        <p className="mt-10">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-sm font-semibold text-[#CFD6F5] underline underline-offset-4 transition hover:text-white"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </motion.section>
  );
}
