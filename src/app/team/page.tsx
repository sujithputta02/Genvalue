"use client";

import { motion } from "framer-motion";
import { EnrollCTA } from "@/components/sections/EnrollCTA";
import { FoundersSection } from "@/components/sections/FoundersSection";
import { LiquidGlassContainer } from "@/components/ui/LiquidGlassContainer";

export default function TeamPage() {
  return (
    <div className="relative bg-[#EDE6D3] pb-24 text-[#2A2A28] dark:bg-[#070B19] dark:text-slate-200">
      {/* Blueprint Grid Lines Overlay */}
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
            ★ PEOPLE & INSTRUCTORS
          </span>
          <h1 className="font-display-custom mt-2 text-balance text-3xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-5xl md:text-6xl">
            Meet the Team
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base font-medium leading-relaxed text-[#6B6558] sm:text-lg dark:text-slate-300">
            Instruction, operations, and the values behind GenValue - practitioners first, always.
          </p>
        </motion.div>
      </section>

      {/* Leadership & Founders */}
      <section className="relative z-10">
        <FoundersSection />
      </section>

      {/* Story Behind the Name */}
      <section
        className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6 lg:px-8"
        aria-labelledby="team-genvalue-story"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-black/10 bg-[#12266E] p-5 text-white shadow-2xl sm:p-8 lg:p-12"
        >
          <span className="font-annotation inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
            ★ FOUNDING PRINCIPLES
          </span>
          <h2 id="team-genvalue-story" className="font-display-custom mt-2 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
            The Story Behind the Name
          </h2>
          <div className="mt-5 space-y-4 text-sm font-medium leading-relaxed text-[#DFE3F7] sm:text-base">
            <p>
              <strong className="font-bold text-white">GenValue</strong>
              {" reflects how "}
              <strong className="font-bold text-white">Sathvik Putta</strong>
              {
                " approaches education — curiosity without hype, discipline without ego, and showing up for learners the way you'd show up for family."
              }
            </p>
            <p>
              GenValue is a promise that judgment-first teaching and real opportunity grow from those roots.
              When you see GenValue, read it as values in practice — not a logo dreamed up overnight.
            </p>
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
