"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

// SVG Vector Icons for Floating Cubes
const GradCapSvg = (
  <svg viewBox="0 0 48 48" fill="none" className="h-9 w-9">
    <path d="M24 6 L44 16 L24 26 L4 16 Z" stroke="#12266E" strokeWidth="3" strokeLinejoin="round" fill="#1E3FE0" />
    <path d="M12 21 V32 C12 37 36 37 36 32 V21" stroke="#12266E" strokeWidth="3" fill="none" />
    <path d="M40 18 V33" stroke="#E8622E" strokeWidth="3" strokeLinecap="round" />
    <circle cx="40" cy="35" r="3" fill="#E8622E" />
  </svg>
);

const LaptopCodeSvg = (
  <svg viewBox="0 0 48 48" fill="none" className="h-9 w-9">
    <rect x="8" y="10" width="32" height="22" rx="3" fill="#1E3FE0" stroke="#12266E" strokeWidth="2.5" />
    <path d="M4 36 H44 L40 32 H8 Z" fill="#12266E" />
    <path d="M16 18 L21 21 L16 24" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="23" y1="24" x2="30" y2="24" stroke="#E8622E" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const NetworkCommunitySvg = (
  <svg viewBox="0 0 48 48" fill="none" className="h-9 w-9">
    <circle cx="24" cy="14" r="6" fill="#E8622E" stroke="#12266E" strokeWidth="2" />
    <circle cx="12" cy="34" r="5" fill="#1E3FE0" stroke="#12266E" strokeWidth="2" />
    <circle cx="36" cy="34" r="5" fill="#1E3FE0" stroke="#12266E" strokeWidth="2" />
    <path d="M16 30 L21 19 M32 30 L27 19 M17 34 H31" stroke="#12266E" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const CalendarMilestonesSvg = (
  <svg viewBox="0 0 48 48" fill="none" className="h-9 w-9">
    <rect x="8" y="10" width="32" height="30" rx="4" fill="#FFFFFF" stroke="#12266E" strokeWidth="2.5" />
    <path d="M8 18 H40" stroke="#12266E" strokeWidth="2.5" />
    <rect x="8" y="10" width="32" height="8" fill="#E8622E" />
    <line x1="16" y1="6" x2="16" y2="12" stroke="#12266E" strokeWidth="3" strokeLinecap="round" />
    <line x1="32" y1="6" x2="32" y2="12" stroke="#12266E" strokeWidth="3" strokeLinecap="round" />
    <circle cx="18" cy="26" r="2.5" fill="#1E3FE0" />
    <circle cx="28" cy="26" r="2.5" fill="#12266E" />
    <circle cx="18" cy="34" r="2.5" fill="#12266E" />
    <path d="M26 34 L31 34" stroke="#E8622E" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export function StatFloatingSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });
  const [toolsCount, setToolsCount] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0.5);

  // Smooth scroll progress measurement without framer-motion useScroll target warnings
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const progress = Math.min(
        Math.max((windowHeight - rect.top) / (windowHeight + rect.height), 0),
        1
      );
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Displacement calculations for surrounding SVG cubes
  const c1X = (scrollProgress - 0.5) * -220;
  const c1Y = (scrollProgress - 0.5) * -160;

  const c2X = (scrollProgress - 0.5) * 220;
  const c2Y = (scrollProgress - 0.5) * -160;

  const c3X = (scrollProgress - 0.5) * -220;
  const c3Y = (scrollProgress - 0.5) * 160;

  const c4X = (scrollProgress - 0.5) * 220;
  const c4Y = (scrollProgress - 0.5) * 160;

  useEffect(() => {
    if (!isInView) return;
    let current = 0;
    const target = 40;
    const interval = setInterval(() => {
      current += 1;
      setToolsCount(current);
      if (current >= target) {
        clearInterval(interval);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <div ref={containerRef} className="relative w-full">
      <section
        className="relative flex min-h-[56vh] w-full flex-col items-center justify-center overflow-hidden bg-[#12266E] px-4 py-16 text-center text-white sm:min-h-[70vh] sm:py-24 md:py-28"
        aria-labelledby="stat-heading"
      >
        {/* Blueprint Grid Lines Overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:28px_28px]"
          aria-hidden="true"
        />

        {/* Dynamic Scroll Displace 3D SVG Cubes */}
        <motion.div
          animate={{ x: c1X, y: c1Y }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="absolute left-[4%] top-[12%] hidden h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#EDE6D3] to-[#C9C2AB] shadow-xl sm:flex sm:h-16 sm:w-16 md:left-[12%] md:top-[18%] md:h-20 md:w-20 md:rounded-2xl"
          aria-hidden="true"
        >
          {GradCapSvg}
        </motion.div>

        <motion.div
          animate={{ x: c2X, y: c2Y }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="absolute right-[4%] top-[12%] hidden h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#EDE6D3] to-[#C9C2AB] shadow-xl sm:flex sm:h-16 sm:w-16 md:right-[12%] md:top-[18%] md:h-20 md:w-20 md:rounded-2xl"
          aria-hidden="true"
        >
          {LaptopCodeSvg}
        </motion.div>

        <motion.div
          animate={{ x: c3X, y: c3Y }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="absolute bottom-[12%] left-[4%] hidden h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#EDE6D3] to-[#C9C2AB] shadow-xl sm:flex sm:h-16 sm:w-16 md:bottom-[18%] md:left-[12%] md:h-20 md:w-20 md:rounded-2xl"
          aria-hidden="true"
        >
          {NetworkCommunitySvg}
        </motion.div>

        <motion.div
          animate={{ x: c4X, y: c4Y }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="absolute bottom-[12%] right-[4%] hidden h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#EDE6D3] to-[#C9C2AB] shadow-xl sm:flex sm:h-16 sm:w-16 md:bottom-[18%] md:right-[12%] md:h-20 md:w-20 md:rounded-2xl"
          aria-hidden="true"
        >
          {CalendarMilestonesSvg}
        </motion.div>

        {/* Centered Stat Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 mx-auto flex max-w-2xl flex-col items-center justify-center px-6 text-center"
        >
          <span className="font-annotation inline-block -rotate-2 text-sm font-bold tracking-wider text-[#E8622E]">
            ★ PRACTICAL IMPACT
          </span>
          <h2
            id="stat-heading"
            className="font-display-custom mt-3 text-center text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-7xl lg:text-8xl"
          >
            {toolsCount}+ AI Tools
          </h2>
          <p className="mt-5 text-center text-base leading-relaxed text-[#CFD6F5] sm:text-lg md:text-xl">
            Mastered across 11 categories in 12 intensive weeks. Built for professionals who demand clear judgment over hype.
          </p>
        </motion.div>
      </section>
    </div>
  );
}
