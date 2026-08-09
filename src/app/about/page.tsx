"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FaArrowDown,
  FaArrowRight,
  FaArrowRotateRight,
  FaChartLine,
  FaCompass,
  FaHammer,
  FaRocket,
  FaShieldHalved,
} from "react-icons/fa6";
import { FoundersSection } from "@/components/sections/FoundersSection";
import { InfiniteTestimonialMarquee } from "@/components/ui/InfiniteTestimonialMarquee";
import { LiquidGlassContainer } from "@/components/ui/LiquidGlassContainer";
import { course } from "@/data/course";

const MISSION_PARAGRAPHS = [
  "Most courses chase every new model drop. We step back and ask which tool fits the task, the audience, and the risk profile - then move fast with clarity.",
  "GenValue is built for working professionals: weekly builds, real assignments, and feedback that sounds like a colleague, not a brochure.",
  "Our north star is simple: when the landscape shifts again, you should already know how to choose - not how to panic-scroll release notes.",
] as const;

const APPROACH_STEPS = [
  {
    title: "Learn the Landscape",
    body: "Map categories, trade-offs, and when general assistants beat niche tools - before you touch a single login.",
    Icon: FaCompass,
  },
  {
    title: "Master the Tools",
    body: "Practice 40+ tools in-context with prompts, workflows, and quality bars you can reuse on Monday morning.",
    Icon: FaHammer,
  },
  {
    title: "Build Real Projects",
    body: "Ship hands-on work every week and finish with a capstone employers can inspect - not a slideshow of hype.",
    Icon: FaRocket,
  },
] as const;

const NUMBER_STATS = [
  { label: "Structured weeks", target: 12, suffix: "", prefix: "" },
  { label: "Tools in curriculum", target: 40, suffix: "+", prefix: "" },
  { label: "Categories covered", target: 11, suffix: "", prefix: "" },
  { label: "Portfolio capstones", target: 1, suffix: "", prefix: "" },
] as const;

const VALUES = [
  {
    title: "Practical",
    description:
      "Every lesson ties to a deliverable you could hand to a manager or client - templates, rubrics, and examples included.",
    Icon: FaHammer,
  },
  {
    title: "Honest",
    description:
      "We name limits, failure modes, and when not to use AI - especially for high-stakes or regulated work.",
    Icon: FaShieldHalved,
  },
  {
    title: "Outcomes-Driven",
    description:
      "Progress is measured in shipped work and sound tool choices - not vanity quiz scores or completion badges alone.",
    Icon: FaChartLine,
  },
  {
    title: "Continuously Updated",
    description:
      "The curriculum evolves as tools change; you learn frameworks that survive the next release cycle.",
    Icon: FaArrowRotateRight,
  },
] as const;

const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number];

function useInViewOnce(threshold = 0.2) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, visible]);

  return { ref, visible };
}

function useCountUp(target: number, active: boolean, durationMs = 1600) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / durationMs, 1);
      const eased = 1 - (1 - p) ** 3;
      setValue(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, durationMs]);

  return value;
}

function StatCard({
  label,
  target,
  prefix,
  suffix,
  active,
}: {
  label: string;
  target: number;
  prefix: string;
  suffix: string;
  active: boolean;
}) {
  const n = useCountUp(target, active);
  return (
    <article className="rounded-2xl border border-black/10 bg-[#F6F1E4] p-6 text-center shadow-xl dark:border-white/10 dark:bg-[#0D1B2A]">
      <p className="font-display-custom text-3xl font-extrabold tabular-nums text-[#2A2A28] sm:text-4xl md:text-5xl dark:text-white">
        <span className="text-[#E8622E]">{prefix}</span>
        {n}
        <span className="text-[#E8622E]">{suffix}</span>
      </p>
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-300">
        {label}
      </p>
    </article>
  );
}

export default function AboutPage() {
  const { ref: statsRef, visible: statsVisible } = useInViewOnce(0.25);

  return (
    <div className="relative bg-[#EDE6D3] pb-24 text-[#2A2A28] dark:bg-[#070B19] dark:text-slate-200">
      {/* Blueprint Grid Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.07] dark:[background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)]"
        aria-hidden="true"
      />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-[1200px] px-4 pt-16 pb-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 items-center gap-8 rounded-3xl border border-black/10 bg-[#F6F1E4] p-5 shadow-2xl dark:border-white/10 dark:bg-[#0D1B2A] sm:gap-10 sm:p-8 lg:grid-cols-2 lg:gap-12 lg:p-12"
        >
          <div>
            <span className="font-annotation inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
              ★ {course.instructor.academy}
            </span>
            <h1 className="font-display-custom mt-2 text-balance text-3xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-5xl md:text-6xl">
              About GenValue
            </h1>
            <p className="mt-4 text-base font-medium leading-relaxed text-[#6B6558] dark:text-slate-300 sm:text-lg">
              {course.subtitle}
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md overflow-hidden lg:mx-0 lg:max-w-none">
            <div className="-rotate-2 overflow-hidden rounded-2xl border border-black/10 shadow-2xl ring-4 ring-[#1E3FE0]/20 dark:border-white/10 dark:ring-white/10">
              <Image
                src="/images/poster/genvalue-poster.png"
                alt="GenValue AI Tools Mastery Program Poster"
                width={640}
                height={900}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Mission Section */}
      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="about-mission">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-black/10 bg-[#F6F1E4] p-5 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A] sm:p-8 lg:p-12"
        >
          <span className="font-annotation inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
            ★ OUR CORE PHILOSOPHY
          </span>
          <h2 id="about-mission" className="font-display-custom mt-2 text-2xl font-extrabold text-[#2A2A28] dark:text-white sm:text-3xl md:text-4xl">
            Our Mission
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <blockquote className="border-l-4 border-[#1E3FE0] pl-4 text-xl font-extrabold leading-snug text-[#2A2A28] dark:text-white sm:pl-6 sm:text-2xl md:text-3xl">
              We don&apos;t teach tools.{" "}
              <span className="text-[#1E3FE0] dark:text-[#60A5FA]">We teach judgment.</span>
            </blockquote>
            <div className="flex flex-col gap-4 text-sm font-medium leading-relaxed text-[#6B6558] dark:text-slate-300">
              {MISSION_PARAGRAPHS.map((p, i) => (
                <p key={`mission-${i}`}>{p}</p>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Autolooping Student Reviews Marquee - Full Bleed Edge-to-Edge */}
      <section className="w-full max-w-none overflow-hidden px-0 py-8">
        <div className="text-center px-4">
          <span className="font-annotation inline-block text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
            ★ VERIFIED ALUMNI & WORKING PROFESSIONALS
          </span>
        </div>
        <InfiniteTestimonialMarquee />
      </section>

      {/* Founders Section — wider layout only on About */}
      <section className="relative z-10 w-full py-6">
        <FoundersSection id="founders" variant="about" />
      </section>

      {/* Our Approach */}
      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="about-approach">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center">
            <span className="font-annotation inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
              ★ STEP-BY-STEP METHODOLOGY
            </span>
            <h2 id="about-approach" className="font-display-custom mt-2 text-3xl font-extrabold text-[#2A2A28] dark:text-white sm:text-4xl">
              Our Approach
            </h2>
            <p className="mt-2 text-sm text-[#6B6558] dark:text-slate-300">
              A single thread from orientation to capstone - framework first, tools second, proof last.
            </p>
          </div>

          <div className="mt-10 flex flex-col items-stretch gap-4 md:flex-row md:items-stretch md:justify-center md:gap-3">
            {APPROACH_STEPS.flatMap((step, index) => {
              const card = (
                <motion.div
                  key={step.title}
                  className="flex flex-1 flex-col justify-between rounded-2xl border border-black/10 bg-[#F6F1E4] p-6 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A]"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.12, ease: easeOut }}
                >
                  <div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1E3FE0] text-white shadow-md">
                      <step.Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="font-display-custom mt-4 text-lg font-bold text-[#2A2A28] dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-xs font-medium leading-relaxed text-[#6B6558] dark:text-slate-300">
                      {step.body}
                    </p>
                  </div>
                </motion.div>
              );
              if (index >= APPROACH_STEPS.length - 1) {
                return [card];
              }
              const arrow = (
                <div
                  key={`approach-arrow-${index}`}
                  className="flex shrink-0 justify-center py-2 md:items-center md:self-center md:py-0"
                  aria-hidden
                >
                  <FaArrowDown className="h-5 w-5 text-[#1E3FE0] md:hidden" />
                  <FaArrowRight className="hidden h-5 w-5 text-[#1E3FE0] md:block" />
                </div>
              );
              return [card, arrow];
            })}
          </div>
        </motion.div>
      </section>

      {/* By the Numbers */}
      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="about-numbers">
        <div ref={statsRef}>
          <div className="text-center">
            <span className="font-annotation inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
              ★ MEASURABLE OUTCOMES
            </span>
            <h2 id="about-numbers" className="font-display-custom mt-2 text-3xl font-extrabold text-[#2A2A28] dark:text-white sm:text-4xl">
              By the Numbers
            </h2>
            <p className="mt-2 text-sm text-[#6B6558] dark:text-slate-300">
              Proof lives in the syllabus - not in adjectives.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {NUMBER_STATS.map((s) => (
              <StatCard
                key={s.label}
                label={s.label}
                target={s.target}
                prefix={s.prefix}
                suffix={s.suffix}
                active={statsVisible}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="about-values">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center">
            <span className="font-annotation inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
              ★ PRINCIPLES WE LIVE BY
            </span>
            <h2 id="about-values" className="font-display-custom mt-2 text-3xl font-extrabold text-[#2A2A28] dark:text-white sm:text-4xl">
              Our Core Values
            </h2>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, index) => (
              <motion.article
                key={v.title}
                className="flex flex-col justify-between rounded-2xl border border-black/10 bg-[#F6F1E4] p-6 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08, ease: easeOut }}
              >
                <div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8622E] text-white shadow-md">
                    <v.Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="font-display-custom mt-4 text-lg font-bold text-[#2A2A28] dark:text-white">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-[#6B6558] dark:text-slate-300">
                    {v.description}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
