"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { IconType } from "react-icons";
import {
  FaBolt,
  FaBookOpenReader,
  FaBriefcase,
  FaChevronDown,
  FaCircleCheck,
  FaClipboardList,
  FaCode,
  FaComments,
  FaFlagCheckered,
  FaPenNib,
  FaPenToSquare,
  FaSliders,
} from "react-icons/fa6";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { EnrollNowLink } from "@/components/ui/EnrollNowLink";
import { InfiniteToolMarquee } from "@/components/ui/InfiniteToolMarquee";
import { LiquidGlassContainer } from "@/components/ui/LiquidGlassContainer";
import { course } from "@/data/course";
import { SITE } from "@/lib/constants";

const OBJECTIVE_ICONS = [
  FaSliders,
  FaComments,
  FaBolt,
  FaPenNib,
  FaBookOpenReader,
  FaCode,
  FaBriefcase,
] as const satisfies readonly IconType[];

const EVAL_ICONS = [FaClipboardList, FaPenToSquare, FaFlagCheckered] as const;

type ToolEntry = {
  readonly name: string;
  readonly category: string;
  readonly accent: string;
};

function flattenTools(): ToolEntry[] {
  return course.toolCategories.flatMap((cat) =>
    cat.tools.map((name) => ({
      name,
      category: cat.category,
      accent: cat.accent,
    })),
  );
}

const accordionEase = [0.4, 0, 0.2, 1] as [number, number, number, number];

const accordionPanelVariants = {
  open: { height: "auto", opacity: 1 },
  closed: { height: 0, opacity: 0 },
} as const;

export default function CoursesPage() {
  const allTools = useMemo(() => flattenTools(), []);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [openWeek, setOpenWeek] = useState<number | null>(1);
  const [showStickyEnroll, setShowStickyEnroll] = useState(false);

  const filteredTools = useMemo(() => {
    if (categoryFilter === "all") return allTools;
    return allTools.filter((t) => t.category === categoryFilter);
  }, [allTools, categoryFilter]);

  const capstoneWeek = course.syllabus.find((w) => w.week === 12);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setShowStickyEnroll(window.scrollY > 450);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const toggleWeek = (weekNum: number) => {
    setOpenWeek((prev) => (prev === weekNum ? null : weekNum));
  };

  return (
    <div className="relative bg-[#EDE6D3] pb-28 text-[#2A2A28] dark:bg-[#070B19] dark:text-slate-200">
      {/* Blueprint Grid Lines Overlay */}
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
              ★ FLAGSHIP PROGRAM
            </span>
            <h1 className="font-display-custom mt-2 text-balance text-3xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-5xl md:text-6xl">
              {course.title}
            </h1>
            <p className="mt-3 text-base font-medium leading-relaxed text-[#6B6558] dark:text-slate-300 sm:text-lg">
              {course.subtitle}
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {course.stats.map((stat) => (
                <span
                  key={stat.label}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-bold shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-white"
                >
                  <span className="text-[#6B6558] dark:text-slate-400">{stat.label}:</span>
                  <span className="text-[#1E3FE0] dark:text-[#60A5FA]">{stat.value}</span>
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <EnrollNowLink className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-full bg-[#E8622E] px-6 text-sm font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#d55321] sm:h-14 sm:w-auto sm:px-8 sm:text-base">
                Enroll Now
              </EnrollNowLink>
              <DownloadButton
                href={SITE.syllabusPdfUrl}
                filename={SITE.syllabusDownloadFilename}
                label="Download Syllabus PDF"
                variant="outline"
                size="lg"
                fullWidth
                trackingLabel="Download GenValue syllabus PDF from courses page"
              />
            </div>
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

      {/* Autolooping 40+ AI Tools Marquee - Full Bleed Edge-to-Edge */}
      <section className="w-full max-w-none overflow-hidden px-0 py-8">
        <div className="mb-2 text-center px-4">
          <span className="font-annotation inline-block text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
            40+ PRACTICAL AI TOOLS IN THE CURRICULUM
          </span>
        </div>
        <InfiniteToolMarquee />
      </section>

      {/* Learning Objectives Pillars */}
      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="learning-objectives-heading">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="font-annotation inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
            ★ WHAT YOU WILL MASTER
          </span>
          <h2
            id="learning-objectives-heading"
            className="font-display-custom mt-2 text-3xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-4xl"
          >
            Core Learning Objectives
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {course.learningObjectives.map((obj, index) => {
              const Icon = OBJECTIVE_ICONS[index] ?? FaCircleCheck;
              const [title, ...descParts] = obj.split(" - ");
              return (
                <div
                  key={`objective-${index}`}
                  className="flex flex-col justify-between rounded-2xl border border-black/10 bg-[#F6F1E4] p-6 shadow-lg transition hover:scale-[1.02] dark:border-white/10 dark:bg-[#0D1B2A]"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1E3FE0] text-white shadow-md">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h3 className="font-display-custom text-lg font-bold text-[#2A2A28] dark:text-white">
                        {title}
                      </h3>
                    </div>
                    <p className="mt-4 text-xs font-medium leading-relaxed text-[#6B6558] dark:text-slate-300">
                      {descParts.join(" - ")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* 11 Tool Categories Grid */}
      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="tools-covered-heading">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="font-annotation inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
            ★ 40+ HANDS-ON TOOLS
          </span>
          <h2
            id="tools-covered-heading"
            className="font-display-custom mt-2 text-3xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-4xl"
          >
            Tools Covered Across 11 Categories
          </h2>

          <div
            className="mt-6 flex flex-wrap gap-2"
            role="group"
            aria-label="Filter tools by category"
          >
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              aria-pressed={categoryFilter === "all"}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                categoryFilter === "all"
                  ? "bg-[#1E3FE0] text-white shadow-md"
                  : "border border-black/10 bg-white/70 text-[#2A2A28] hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
              }`}
            >
              All Categories
            </button>
            {course.toolCategories.map((cat) => (
              <button
                key={cat.category}
                type="button"
                onClick={() => setCategoryFilter(cat.category)}
                aria-pressed={categoryFilter === cat.category}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  categoryFilter === cat.category
                    ? "text-white shadow-md"
                    : "border border-black/10 bg-white/70 text-[#2A2A28] hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                }`}
                style={
                  categoryFilter === cat.category
                    ? { backgroundColor: cat.accent }
                    : undefined
                }
              >
                {cat.category}
              </button>
            ))}
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filteredTools.map((tool) => (
              <li key={`${tool.category}-${tool.name}`}>
                <span
                  className="flex min-h-[3rem] items-center rounded-xl border border-black/10 bg-[#F6F1E4] px-3.5 py-2 text-xs font-bold leading-snug text-[#2A2A28] shadow-md dark:border-white/10 dark:bg-[#0D1B2A] dark:text-white"
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: tool.accent,
                  }}
                >
                  {tool.name}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      </section>

      {/* Weekly Breakdown Accordion */}
      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="weekly-breakdown-heading">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="font-annotation inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
            ★ WEEK-BY-WEEK CURRICULUM
          </span>
          <h2
            id="weekly-breakdown-heading"
            className="font-display-custom mt-2 text-3xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-4xl"
          >
            12-Week Syllabus Breakdown
          </h2>

          <div className="mt-8 flex flex-col gap-4">
            {course.syllabus.map((w) => {
              const isOpen = openWeek === w.week;
              const weekNum = String(w.week).padStart(2, "0");
              const panelId = `syllabus-week-${w.week}-panel`;
              const triggerId = `syllabus-week-${w.week}-trigger`;
              return (
                <div
                  key={w.week}
                  className="relative overflow-hidden rounded-2xl border border-black/10 bg-[#F6F1E4] shadow-md dark:border-white/10 dark:bg-[#0D1B2A]"
                >
                  <span
                    className="pointer-events-none absolute -right-2 top-1/2 z-0 hidden -translate-y-1/2 select-none font-black tabular-nums leading-none text-black/[0.04] dark:text-white/[0.04] sm:block"
                    style={{ fontSize: "clamp(3.5rem, 12vw, 10rem)" }}
                    aria-hidden
                  >
                    {weekNum}
                  </span>

                  <button
                    id={triggerId}
                    type="button"
                    onClick={() => toggleWeek(w.week)}
                    className="relative z-10 flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-black/[0.02] dark:hover:bg-white/[0.02] sm:gap-4 sm:px-6 sm:py-5"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? panelId : undefined}
                  >
                    <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1E3FE0] text-xs font-extrabold text-white shadow-md">
                      {w.week}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-annotation block text-xs font-bold uppercase tracking-wider text-[#E8622E]">
                        {w.theme}
                      </span>
                      <span className="font-display-custom mt-0.5 block text-lg font-bold text-[#2A2A28] dark:text-white sm:text-xl">
                        {w.topic}
                      </span>
                    </span>
                    <FaChevronDown
                      className={`mt-2 h-5 w-5 shrink-0 text-[#6B6558] transition-transform duration-300 dark:text-slate-400 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        id={panelId}
                        key={`panel-${w.week}`}
                        role="region"
                        aria-labelledby={triggerId}
                        variants={accordionPanelVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        transition={{ duration: 0.35, ease: accordionEase }}
                        className="relative z-10 overflow-hidden border-t border-black/10 dark:border-white/10"
                      >
                        <div className="space-y-4 px-6 py-5 text-xs font-medium leading-relaxed text-[#6B6558] dark:text-slate-300">
                          <div>
                            <span className="font-annotation text-xs font-bold uppercase text-[#2A2A28] dark:text-white">
                              CONCEPTS:
                            </span>
                            <p className="mt-1 text-sm text-[#2A2A28] dark:text-slate-200">
                              {w.concepts}
                            </p>
                          </div>
                          <div>
                            <span className="font-annotation text-xs font-bold uppercase text-[#2A2A28] dark:text-white">
                              TOOLS USED:
                            </span>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {w.toolsUsed.map((tool) => (
                                <span
                                  key={tool}
                                  className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#1E3FE0] shadow-sm dark:bg-white/10 dark:text-[#60A5FA]"
                                >
                                  {tool}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="font-annotation text-xs font-bold uppercase text-[#E8622E]">
                              WEEKLY DELIVERABLE:
                            </span>
                            <p className="mt-1 text-xs font-semibold italic text-[#2A2A28] dark:text-slate-200">
                              &ldquo;{w.assignment}&rdquo;
                            </p>
                          </div>
                          <div>
                            <span className="font-annotation text-xs font-bold uppercase text-[#2A2A28] dark:text-white">
                              REAL-WORLD USE CASE:
                            </span>
                            <p className="mt-1 text-xs text-[#6B6558] dark:text-slate-300">
                              {w.useCase}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Evaluation Criteria & Capstone */}
      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="evaluation-heading">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="font-annotation inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
            ★ ASSESSMENT & PROOF
          </span>
          <h2
            id="evaluation-heading"
            className="font-display-custom mt-2 text-3xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-4xl"
          >
            Evaluation & Capstone Deliverables
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {course.evaluationCriteria.map((row, index) => {
              const Icon = EVAL_ICONS[index] ?? FaCircleCheck;
              return (
                <div
                  key={row.component}
                  className="flex flex-col justify-between rounded-2xl border border-black/10 bg-[#F6F1E4] p-6 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3FE0] text-white">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="font-display-custom text-3xl font-extrabold text-[#E8622E]">
                        {row.weight}
                      </span>
                    </div>
                    <h3 className="font-display-custom mt-4 text-lg font-bold text-[#2A2A28] dark:text-white">
                      {row.component}
                    </h3>
                    <p className="mt-2 text-xs font-medium leading-relaxed text-[#6B6558] dark:text-slate-300">
                      {row.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Capstone Highlight */}
          <div className="mt-8 rounded-3xl border border-[#1E3FE0]/30 bg-gradient-to-r from-[#12266E] to-[#1E3FE0] p-5 text-white shadow-2xl sm:p-8">
            <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#E8622E]">
              ★ WEEK 12 CAPSTONE PROJECT
            </span>
            <h3 className="font-display-custom mt-2 text-2xl font-extrabold text-white sm:text-3xl">
              {capstoneWeek?.topic ?? "Capstone - Final Project"}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#DFE3F7]">
              {capstoneWeek?.concepts}
            </p>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md">
                <span className="text-xs font-bold uppercase text-[#E8622E]">CAPSTONE DELIVERABLE:</span>
                <p className="mt-1 text-xs italic text-white">&ldquo;{capstoneWeek?.assignment}&rdquo;</p>
              </div>
              <EnrollNowLink className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-full bg-[#E8622E] px-8 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-[#d55321] sm:w-auto">
                Enroll Now
              </EnrollNowLink>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Sticky Bottom Enroll Button */}
      <motion.div
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-end sm:p-6"
        initial={false}
        animate={{
          opacity: showStickyEnroll ? 1 : 0,
          y: showStickyEnroll ? 0 : 24,
        }}
        transition={{ duration: 0.28, ease: accordionEase }}
        style={{ pointerEvents: showStickyEnroll ? "auto" : "none" }}
      >
        <EnrollNowLink
          aria-label="Enroll in AI Tools Mastery program"
          className="pointer-events-auto inline-flex h-12 w-full max-w-sm items-center justify-center whitespace-nowrap rounded-full bg-[#E8622E] px-8 text-sm font-bold uppercase tracking-wider text-white shadow-2xl transition hover:bg-[#d55321] sm:w-auto sm:max-w-none"
        >
          Enroll Now
        </EnrollNowLink>
      </motion.div>
    </div>
  );
}
