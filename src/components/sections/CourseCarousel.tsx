"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { course } from "@/data/course";

export function CourseCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -380, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 380, behavior: "smooth" });
    }
  };

  return (
    <section
      id="syllabus"
      className="relative w-full py-20"
      aria-labelledby="courses-carousel-heading"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"
        >
          <div>
            <span className="font-annotation inline-block -rotate-2 text-sm font-bold uppercase tracking-wider text-[#E8622E]">
              ★ OFFICIAL 12-WEEK SYLLABUS
            </span>
            <h2
              id="courses-carousel-heading"
              className="font-display-custom mt-2 text-3xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-5xl"
            >
              12-Week Curriculum Roadmap
            </h2>
            <p className="mt-2 text-base text-[#6B6558] dark:text-slate-300">
              Explore the week-by-week breakdown from foundational prompt engineering to multi-tool AI agent automation.
            </p>
          </div>

          {/* Carousel Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={scrollLeft}
              aria-label="Previous syllabus week"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-[#F6F1E4] text-xl font-bold text-[#2A2A28] shadow-md transition hover:bg-[#1E3FE0] hover:text-white dark:border-white/10 dark:bg-[#0D1B2A] dark:text-white"
            >
              ←
            </button>
            <button
              type="button"
              onClick={scrollRight}
              aria-label="Next syllabus week"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-[#F6F1E4] text-xl font-bold text-[#2A2A28] shadow-md transition hover:bg-[#1E3FE0] hover:text-white dark:border-white/10 dark:bg-[#0D1B2A] dark:text-white"
            >
              →
            </button>
          </div>
        </motion.div>

        {/* Snap Drag Carousel displaying the 12-Week Syllabus */}
        <div
          ref={carouselRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pb-8 cursor-grab active:cursor-grabbing"
        >
          {course.syllabus.map((item, index) => (
            <motion.article
              key={`week-${item.week}`}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="flex w-[min(100%,300px)] flex-[0_0_min(100%,300px)] snap-start flex-col justify-between rounded-[22px] border border-black/10 bg-[#F6F1E4] p-5 shadow-xl transition-all duration-300 hover:scale-[1.02] dark:border-white/10 dark:bg-[#0D1B2A] sm:w-auto sm:flex-[0_0_360px] sm:p-7 md:flex-[0_0_380px]"
            >
              <div>
                {/* Header Graphic */}
                <div className="relative mb-6 flex h-32 flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-[#1E3FE0] to-[#12266E] p-5 text-white shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#E8622E]">
                      {item.theme}
                    </span>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold backdrop-blur-md">
                      WEEK {item.week}
                    </span>
                  </div>
                  <h3 className="font-display-custom text-lg font-extrabold leading-snug text-white">
                    {item.topic}
                  </h3>
                </div>

                <div className="space-y-4 text-xs font-medium leading-relaxed text-[#6B6558] dark:text-slate-300">
                  <div>
                    <span className="font-annotation text-xs font-bold uppercase text-[#2A2A28] dark:text-white">
                      CONCEPTS & SKILLS:
                    </span>
                    <p className="mt-1 text-sm text-[#2A2A28] dark:text-slate-200">
                      {item.concepts}
                    </p>
                  </div>

                  <div>
                    <span className="font-annotation text-xs font-bold uppercase text-[#2A2A28] dark:text-white">
                      TOOLS COVERED:
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {item.toolsUsed.map((tool) => (
                        <span
                          key={`${item.week}-${tool}`}
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
                    <p className="mt-1 text-xs font-semibold italic text-[#2A2A28] dark:text-slate-300">
                      &ldquo;{item.assignment}&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-black/10 pt-4 dark:border-white/10">
                <Link
                  href="/syllabus"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#1E3FE0] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#12266E]"
                >
                  View Full Syllabus Details →
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
