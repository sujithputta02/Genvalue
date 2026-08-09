"use client";

import { motion } from "framer-motion";
import { FaQuoteLeft, FaStar } from "react-icons/fa6";

export type Testimonial = {
  readonly quote: string;
  readonly author: string;
  readonly role: string;
  readonly company: string;
  readonly rating: number;
};

const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote: "GenValue taught me how to choose between Claude 3.5 Sonnet and ChatGPT for complex data analysis in seconds. Cut our team synthesis time by 60%.",
    author: "Arjun Mehta",
    role: "Senior Product Manager",
    company: "TechScale Systems",
    rating: 5,
  },
  {
    quote: "The 12-week hands-on builds were brutal in the best way possible. I built an end-to-end AI customer support agent for my capstone project.",
    author: "Priya Sharma",
    role: "Lead Automation Engineer",
    company: "FinEdge Labs",
    rating: 5,
  },
  {
    quote: "Sathvik teaches practitioner judgment, not slide decks. You leave knowing prompt engineering, vector databases, and model trade-offs cold.",
    author: "David Miller",
    role: "Strategy Consultant",
    company: "Apex Advisory",
    rating: 5,
  },
  {
    quote: "I used to panic-scroll Twitter for every new AI drop. Now I have a systematic decision matrix to evaluate any model that releases.",
    author: "Ananya Iyer",
    role: "Growth Marketer",
    company: "VenturePulse",
    rating: 5,
  },
  {
    quote: "The best investment I made for my career in 2026. The weekly project feedback felt like pair programming with a senior engineer.",
    author: "Rahul Verma",
    role: "Full-Stack Developer",
    company: "CloudNative Inc.",
    rating: 5,
  },
] as const;

export function InfiniteTestimonialMarquee() {
  return (
    <div className="relative my-12 w-full overflow-hidden py-4">
      {/* Gradient Vignette Fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#EDE6D3] to-transparent dark:from-[#070B19]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#EDE6D3] to-transparent dark:from-[#070B19]" />

      <div className="flex overflow-hidden">
        <motion.div
          className="flex shrink-0 gap-6"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        >
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, idx) => (
            <article
              key={`t-${t.author}-${idx}`}
              className="flex w-[min(100%,300px)] shrink-0 flex-col justify-between rounded-2xl border border-black/10 bg-[#F6F1E4] p-5 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A] sm:w-[380px] sm:p-6"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <FaStar key={i} className="h-4 w-4" />
                    ))}
                  </div>
                  <FaQuoteLeft className="h-6 w-6 text-[#1E3FE0]/30 dark:text-[#60A5FA]/30" />
                </div>
                <p className="mt-4 text-xs font-medium leading-relaxed text-[#2A2A28] dark:text-slate-200 sm:text-sm">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="mt-6 border-t border-black/10 pt-4 dark:border-white/10">
                <p className="font-display-custom text-sm font-bold text-[#2A2A28] dark:text-white">
                  {t.author}
                </p>
                <p className="text-xs text-[#6B6558] dark:text-slate-400">
                  {t.role} · <span className="font-semibold text-[#1E3FE0] dark:text-[#60A5FA]">{t.company}</span>
                </p>
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
