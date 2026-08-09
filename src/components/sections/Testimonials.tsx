"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { FaStar } from "react-icons/fa6";

export type TestimonialItem = {
  readonly quote: string;
  readonly studentName: string;
  readonly role: string;
  readonly outcome: string;
};

const PLACEHOLDER_TESTIMONIALS: readonly TestimonialItem[] = [
  {
    quote:
      "I finally stopped guessing which tool to open for each task. The workflow mindset alone changed how I work every single day.",
    studentName: "Jordan Lee",
    role: "Product Manager",
    outcome: "Promoted to Senior PM",
  },
  {
    quote:
      "Capstone aside, the weekly builds forced me to ship real outputs - not slides. My portfolio finally matches what I claim on LinkedIn.",
    studentName: "Priya Malhotra",
    role: "Marketing Lead",
    outcome: "10x Output Efficiency",
  },
  {
    quote:
      "Clear judgment beats chasing every new launch. This program teaches exactly that - fast picks, clean documentation, confident delivery.",
    studentName: "Marcus Chen",
    role: "Operations Consultant",
    outcome: "Built AI Ops Stack",
  },
  {
    quote:
      "Learning Cursor and Claude together for software prototypes saved me months of dev back-and-forth. Absolute game changer.",
    studentName: "Sarah Jenkins",
    role: "UX Researcher",
    outcome: "Shipped 3 AI Prototypes",
  },
  {
    quote:
      "The AI tool matrix gave our agency the confidence to pitch custom AI automation workflows to enterprise clients.",
    studentName: "Alex Rivera",
    role: "Agency Founder",
    outcome: "$50k New Revenue",
  },
];

function StarRating({ id }: { id: string }) {
  return (
    <div className="flex gap-1 text-[#E8622E]" aria-label="Rated 5 out of 5 stars">
      {Array.from({ length: 5 }, (_, index) => (
        <FaStar key={`${id}-star-${index}`} className="h-4 w-4 shrink-0" aria-hidden="true" />
      ))}
    </div>
  );
}

export function Testimonials() {
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
      className="relative w-full overflow-hidden py-20"
      aria-labelledby="testimonials-heading"
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
            <span className="font-annotation inline-block -rotate-2 text-sm font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
              ★ STUDENT OUTCOMES
            </span>
            <h2
              id="testimonials-heading"
              className="font-display-custom mt-2 text-3xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-5xl"
            >
              What Our Graduates Say
            </h2>
          </div>

          {/* Carousel Arrow Controls */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={scrollLeft}
              aria-label="Previous testimonial"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-[#F6F1E4] text-xl font-bold text-[#2A2A28] shadow-md transition hover:bg-[#1E3FE0] hover:text-white dark:border-white/10 dark:bg-[#0D1B2A] dark:text-white"
            >
              ←
            </button>
            <button
              type="button"
              onClick={scrollRight}
              aria-label="Next testimonial"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-[#F6F1E4] text-xl font-bold text-[#2A2A28] shadow-md transition hover:bg-[#1E3FE0] hover:text-white dark:border-white/10 dark:bg-[#0D1B2A] dark:text-white"
            >
              →
            </button>
          </div>
        </motion.div>

        {/* Wide Full-Breadth Snap Carousel */}
        <div
          ref={carouselRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pb-8 cursor-grab active:cursor-grabbing"
        >
          {PLACEHOLDER_TESTIMONIALS.map((item, index) => (
            <motion.article
              key={item.studentName}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex w-[min(100%,320px)] flex-[0_0_min(100%,320px)] snap-start flex-col justify-between rounded-[22px] border border-black/10 bg-[#F6F1E4] p-5 shadow-xl transition-all duration-300 hover:scale-[1.02] dark:border-white/10 dark:bg-[#0D1B2A] sm:w-auto sm:flex-[0_0_380px] sm:p-8 md:flex-[0_0_400px]"
            >
              <blockquote className="flex flex-1 flex-col justify-between">
                <p className="text-base italic leading-relaxed text-[#2A2A28] dark:text-slate-200 sm:text-lg">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div className="mt-8 border-t border-black/10 pt-6 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <StarRating id={`t-${index}`} />
                    <span className="rounded-full bg-[#1E3FE0]/10 px-3.5 py-1 font-annotation text-xs font-bold text-[#1E3FE0] dark:bg-white/10 dark:text-[#60A5FA]">
                      {item.outcome}
                    </span>
                  </div>
                  <p className="font-display-custom mt-3 text-xl font-bold text-[#2A2A28] dark:text-white">
                    {item.studentName}
                  </p>
                  <p className="text-sm font-semibold text-[#6B6558] dark:text-slate-400">
                    {item.role}
                  </p>
                </div>
              </blockquote>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
