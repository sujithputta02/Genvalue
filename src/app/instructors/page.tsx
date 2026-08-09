"use client";

import { motion } from "framer-motion";
import { EnrollCTA } from "@/components/sections/EnrollCTA";
import { InstructorProfile } from "@/components/sections/InstructorProfile";
import { InfiniteToolMarquee } from "@/components/ui/InfiniteToolMarquee";
import { FaCompass, FaHammer, FaShieldHalved } from "react-icons/fa6";

const TEACHING_PILLARS = [
  {
    title: "Practitioner-First Instruction",
    body: "Every framework comes from building and shipping with AI tools daily - not reading tech news headlines.",
    Icon: FaHammer,
  },
  {
    title: "Frameworks Over Features",
    body: "Features change weekly; decision frameworks last for years. Learn how to evaluate any model or software.",
    Icon: FaCompass,
  },
  {
    title: "Honest Failure Modes",
    body: "We test hallucinations, prompt limits, and privacy risks head-on so you never ship unvetted AI outputs.",
    Icon: FaShieldHalved,
  },
] as const;

export default function InstructorsPage() {
  return (
    <div className="relative bg-[#EDE6D3] pb-24 text-[#2A2A28] dark:bg-[#070B19] dark:text-slate-200">
      {/* Blueprint Grid Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.07] dark:[background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)]"
        aria-hidden="true"
      />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-[1200px] px-4 pt-16 pb-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="font-annotation inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
            ★ EXPERT FACULTY
          </span>
          <h1 className="font-display-custom mt-2 text-balance text-3xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-5xl md:text-6xl">
            Instructors & Mentors
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base font-medium leading-relaxed text-[#6B6558] sm:text-lg dark:text-slate-300">
            Learn directly from practitioners who ship with AI every week - not slides-first theorists.
          </p>
        </motion.div>
      </section>

      {/* Main Profile Showcase */}
      <section className="relative z-10 mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        <InstructorProfile />
      </section>

      {/* Autolooping AI Tools Marquee - Full Bleed Edge-to-Edge */}
      <section className="w-full max-w-none overflow-hidden px-0 py-8">
        <div className="text-center px-4">
          <span className="font-annotation inline-block text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
            ★ PRACTICAL TOOLS COVERED BY FACULTY
          </span>
        </div>
        <InfiniteToolMarquee />
      </section>

      {/* Teaching Pillars */}
      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="teaching-pillars-heading">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center">
            <span className="font-annotation inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
              ★ TEACHING PHILOSOPHY
            </span>
            <h2
              id="teaching-pillars-heading"
              className="font-display-custom mt-2 text-3xl font-extrabold text-[#2A2A28] dark:text-white sm:text-4xl"
            >
              How Our Faculty Teaches
            </h2>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEACHING_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="flex flex-col justify-between rounded-2xl border border-black/10 bg-[#F6F1E4] p-5 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A] sm:p-6"
              >
                <div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3FE0] text-white shadow-md">
                    <pillar.Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="font-display-custom mt-4 text-lg font-bold text-[#2A2A28] dark:text-white">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-[#6B6558] dark:text-slate-300">
                    {pillar.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Bottom CTA */}
      <div className="relative z-10">
        <EnrollCTA />
      </div>
    </div>
  );
}
