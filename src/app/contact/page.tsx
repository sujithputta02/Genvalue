"use client";

import { motion } from "framer-motion";
import { FaGithub, FaLinkedin, FaLocationDot, FaXTwitter } from "react-icons/fa6";
import { ContactForm } from "@/components/contact/ContactForm";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { LiquidGlassContainer } from "@/components/ui/LiquidGlassContainer";
import { SITE } from "@/lib/constants";

const EMAIL = "genvalue.academy@gmail.com" as const;

export default function ContactPage() {
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
            ★ ADMISSIONS & ENQUIRIES
          </span>
          <h1 className="font-display-custom mt-2 text-balance text-3xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-5xl md:text-6xl">
            Get in Touch
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm font-medium leading-relaxed text-[#6B6558] sm:text-base md:text-lg dark:text-slate-300">
            Questions about the 12-week program, cohorts, or corporate team training - send a note and we&apos;ll reply within 24 hours.
          </p>
        </motion.div>
      </section>

      {/* Main Grid: Info + Form */}
      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left Column - Contact Cards & Map (5 cols) */}
          <aside className="flex flex-col gap-8 lg:col-span-5">
            {/* Contact Details Card */}
            <div className="rounded-3xl border border-black/10 bg-[#F6F1E4] p-5 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A] sm:p-6">
              <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#E8622E]">
                ★ ADMISSIONS & ENQUIRIES
              </span>
              <h2 className="font-display-custom mt-1 text-2xl font-extrabold text-[#2A2A28] dark:text-white">
                Contact Information
              </h2>

              <dl className="mt-6 space-y-5 text-sm font-medium">
                <div>
                  <dt className="font-annotation text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
                    EMAIL ADMISSIONS
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${EMAIL}`}
                      className="font-bold text-[#1E3FE0] underline underline-offset-4 hover:text-[#12266E] dark:text-[#60A5FA]"
                    >
                      {EMAIL}
                    </a>
                  </dd>
                </div>

                <div>
                  <dt className="font-annotation text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
                    CO-FOUNDER & INSTRUCTOR
                  </dt>
                  <dd className="mt-1 font-bold text-[#2A2A28] dark:text-white">
                    Sathvik Putta
                  </dd>
                </div>

                <div>
                  <dt className="font-annotation text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
                    RESPONSE GUARANTEE
                  </dt>
                  <dd className="mt-1 text-xs font-bold text-[#10B981]">
                    ✓ Replied within 24 hours
                  </dd>
                </div>
              </dl>

              <div className="mt-8 border-t border-black/10 pt-6 dark:border-white/10">
                <span className="font-annotation text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
                  CONNECT ON SOCIAL
                </span>
                <div className="mt-3 flex gap-3">
                  <a
                    href={SITE.socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E3FE0] text-white transition hover:bg-[#12266E]"
                  >
                    <FaLinkedin className="h-5 w-5" />
                  </a>
                  <a
                    href="https://github.com/PuttaSathvik16"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2A2A28] text-white transition hover:bg-black"
                  >
                    <FaGithub className="h-5 w-5" />
                  </a>
                  <a
                    href="https://x.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X Twitter"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8622E] text-white transition hover:bg-[#d55321]"
                  >
                    <FaXTwitter className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Interactive Location Map */}
            <div className="overflow-hidden rounded-3xl border border-black/10 bg-[#F6F1E4] p-6 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1E3FE0] text-white shadow-md">
                  <FaLocationDot className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display-custom text-base font-bold text-[#2A2A28] dark:text-white">
                    Headquarters
                  </p>
                  <p className="text-xs font-semibold text-[#6B6558] dark:text-slate-300">
                    New Haven, Connecticut, USA
                  </p>
                </div>
              </div>

              <div className="mt-5 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-black/10 shadow-inner dark:border-white/10">
                <iframe
                  title="Map showing New Haven, Connecticut, USA"
                  className="h-full min-h-[220px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  src="https://www.google.com/maps?q=New+Haven%2C+Connecticut%2C+USA&hl=en&z=13&output=embed"
                />
              </div>
            </div>
          </aside>

          {/* Right Column - Contact Form (7 cols) */}
          <section className="lg:col-span-7">
            <ContactForm />
          </section>
        </div>

        {/* Syllabus Download Callout Box */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 rounded-3xl border border-black/10 bg-[#12266E] p-5 text-center text-white shadow-2xl sm:mt-16 sm:p-8 lg:p-12"
        >
          <span className="font-annotation inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
            ★ EXPLORE THE CURRICULUM FIRST
          </span>
          <h2 className="font-display-custom mt-2 text-2xl font-extrabold text-white sm:text-3xl">
            Not Ready to Enroll Yet?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs font-medium text-[#DFE3F7] sm:text-sm">
            Download our free 9-page curriculum guide breakdown before making your decision.
          </p>
          <div className="mt-6 flex justify-center">
            <DownloadButton
              href={SITE.syllabusPdfUrl}
              filename={SITE.syllabusDownloadFilename}
              label="Download Syllabus PDF"
              variant="gold"
              size="md"
              fullWidth
              trackingLabel="Download GenValue syllabus PDF from contact page"
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
