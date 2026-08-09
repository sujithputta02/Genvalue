"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FaCircleCheck } from "react-icons/fa6";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { EnrollNowLink } from "@/components/ui/EnrollNowLink";
import { LiquidGlassContainer } from "@/components/ui/LiquidGlassContainer";
import { SITE } from "@/lib/constants";

const HIGHLIGHTS: readonly string[] = [
  "Hands-on practice with ChatGPT, Claude, Midjourney & 37+ tools",
  "Real-world prompt engineering, workflow automation & agent systems",
  "Live cohort sessions, project feedback & peer collaboration",
  "Capstone project showcasing end-to-end AI tool integration",
] as const;

const POSTER = "/images/poster/genvalue-poster.png" as const;

const floatTransition = {
  duration: 6,
  repeat: Infinity,
  repeatType: "reverse" as const,
  ease: "easeInOut" as const,
};

export function ProgramSpotlight() {
  return (
    <section
      className="relative mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="program-spotlight-heading"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6 }}
      >
        <LiquidGlassContainer className="grid grid-cols-1 items-center gap-8 rounded-3xl p-5 sm:gap-10 sm:p-8 lg:grid-cols-2 lg:gap-12 lg:p-12">
          <motion.div
            className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none"
            initial={false}
            animate={{ y: [0, -10, 0] }}
            transition={floatTransition}
          >
            <div className="-rotate-2 overflow-hidden rounded-2xl border border-black/10 shadow-2xl ring-4 ring-[#1E3FE0]/20 dark:border-white/10 dark:ring-white/10">
              <Image
                src={POSTER}
                alt="GenValue AI Tools Mastery Program Poster"
                width={640}
                height={900}
                className="h-auto w-full object-cover"
                sizes="(max-width: 1024px) 90vw, 480px"
                priority
              />
            </div>
          </motion.div>

          <div className="text-center lg:text-left">
            <span className="font-annotation inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
              ★ ENROLLING NOW FOR 2026
            </span>
            <h2
              id="program-spotlight-heading"
              className="font-display-custom mt-2 text-balance text-3xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-4xl md:text-5xl"
            >
              Master Every AI Tool That Matters
            </h2>
            <p className="mt-4 text-pretty text-base font-medium leading-relaxed text-[#6B6558] dark:text-slate-300 sm:text-lg">
              Our flagship 12-week program is designed to take you from foundational understanding to expert-level application across text, image, code, audio, video, and autonomous AI agents.
            </p>

            <ul className="mt-6 space-y-3 text-left text-sm font-semibold text-[#2A2A28] dark:text-slate-200">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <FaCircleCheck className="h-5 w-5 shrink-0 text-[#1E3FE0] dark:text-[#60A5FA]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-start">
              <EnrollNowLink
                aria-label="Enroll in AI Tools Mastery program"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#E8622E] px-8 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-[#d55321] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8622E] sm:w-auto"
              >
                Enroll Now
              </EnrollNowLink>
              <DownloadButton
                href={SITE.syllabusPdfUrl}
                filename={SITE.syllabusDownloadFilename}
                label="Download Syllabus"
                variant="outline"
                size="md"
                trackingLabel="Download GenValue syllabus PDF"
              />
            </div>
          </div>
        </LiquidGlassContainer>
      </motion.div>
    </section>
  );
}
