"use client";

import type { Founder } from "@/data/founders";
import { founders } from "@/data/founders";
import { authorInitials } from "@/lib/blog";
import Image from "next/image";
import { useCallback, useId, useState } from "react";
import { FaCircleCheck, FaGithub, FaLinkedin } from "react-icons/fa6";

const CONTACT_EMAIL = "genvalue.academy@gmail.com" as const;

/** Instructors shown on /instructors — lead first, then CPOs below. */
const INSTRUCTOR_IDS = ["sathvik-putta", "srilakshmi-k", "sandhya-l"] as const;

type InstructorMeta = {
  eyebrow: string;
  headlineRole: string;
  tagline: string;
};

const INSTRUCTOR_META: Record<(typeof INSTRUCTOR_IDS)[number], InstructorMeta> = {
  "sathvik-putta": {
    eyebrow: "★ CO-FOUNDER & INSTRUCTOR",
    headlineRole: "Co-Founder & Instructor, GenValue",
    tagline: "AI/ML Engineer · Generative AI & Data Science",
  },
  "srilakshmi-k": {
    eyebrow: "★ CPO & INSTRUCTOR",
    headlineRole: "Chief Product Officer & Instructor, GenValue",
    tagline: "AI/ML Engineer. Building production AI that ships.",
  },
  "sandhya-l": {
    eyebrow: "★ CPO & INSTRUCTOR",
    headlineRole: "Chief Product Officer & Instructor, GenValue",
    tagline: "Business meets data. Scalable solutions that stick.",
  },
};

function getInstructors(): Founder[] {
  return INSTRUCTOR_IDS.map((id) => founders.find((f) => f.id === id)).filter(
    (f): f is Founder => Boolean(f),
  );
}

function InstructorCard({
  founder,
  meta,
  isLead,
}: {
  founder: Founder;
  meta: InstructorMeta;
  isLead: boolean;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const onPhotoError = useCallback(() => setPhotoFailed(true), []);
  const headingId = useId();
  const email = founder.email ?? CONTACT_EMAIL;

  return (
    <article
      className="rounded-[24px] border border-black/10 bg-[#F6F1E4] p-5 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A] sm:p-8 lg:p-12"
      aria-labelledby={headingId}
    >
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
        <div className="flex shrink-0 flex-col items-center lg:items-start">
          <div className="relative">
            <div
              className={`relative overflow-hidden rounded-full border-4 border-[#1E3FE0] p-1 shadow-xl ${
                isLead ? "h-40 w-40" : "h-36 w-36"
              }`}
            >
              {photoFailed ? (
                <div
                  className="flex h-full w-full items-center justify-center rounded-full bg-[#12266E] text-2xl font-bold text-white"
                  aria-hidden="true"
                >
                  {authorInitials(founder.name)}
                </div>
              ) : (
                <Image
                  src={founder.photo}
                  alt={`${founder.name} - ${founder.role}`}
                  width={isLead ? 160 : 144}
                  height={isLead ? 160 : 144}
                  className="h-full w-full rounded-full object-cover"
                  style={
                    founder.photoPosition ? { objectPosition: founder.photoPosition } : undefined
                  }
                  sizes={isLead ? "160px" : "144px"}
                  priority={isLead}
                  onError={onPhotoError}
                />
              )}
            </div>
            <span className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#10B981] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md sm:-bottom-2 sm:left-auto sm:right-0 sm:translate-x-0 sm:px-3 sm:text-[11px]">
              <FaCircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Verified
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <span className="font-annotation text-xs font-bold uppercase tracking-wider text-[#E8622E]">
            {meta.eyebrow}
          </span>
          <h2
            id={headingId}
            className={`font-display-custom mt-1 font-extrabold tracking-tight text-[#2A2A28] dark:text-white ${
              isLead ? "text-2xl sm:text-4xl md:text-5xl" : "text-xl sm:text-3xl md:text-4xl"
            }`}
          >
            {founder.name}
          </h2>
          <p className="mt-1 text-lg font-semibold text-[#1E3FE0] dark:text-[#60A5FA]">
            {meta.headlineRole}
          </p>
          <p className="mt-2 text-base font-bold italic text-[#6B6558] dark:text-slate-300">
            {meta.tagline}
          </p>

          <div className="mt-6 space-y-4 text-base leading-relaxed text-[#6B6558] dark:text-slate-300">
            {founder.bio.map((paragraph, index) => (
              <p key={`${founder.id}-bio-${index}`}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {founder.expertise.map((tag) => (
              <span
                key={`${founder.id}-${tag}`}
                className="rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-[#2A2A28] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-black/10 pt-6 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-annotation text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
                DIRECT CONTACT
              </p>
              <a
                href={`mailto:${email}`}
                className="mt-1 inline-block text-sm font-bold text-[#1E3FE0] underline underline-offset-4 hover:text-[#12266E] dark:text-[#60A5FA]"
                aria-label={`Email ${founder.name}`}
              >
                {email}
              </a>
            </div>

            <div className="flex gap-3">
              {founder.linkedin ? (
                <a
                  href={founder.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${founder.name} on LinkedIn`}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E3FE0] text-white transition hover:bg-[#12266E]"
                >
                  <FaLinkedin className="h-5 w-5" aria-hidden="true" />
                </a>
              ) : null}
              {founder.github ? (
                <a
                  href={founder.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${founder.name} on GitHub`}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2A2A28] text-white transition hover:bg-black"
                >
                  <FaGithub className="h-5 w-5" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function InstructorProfile() {
  const instructors = getInstructors();

  return (
    <section className="mx-auto max-w-[1100px]" aria-label="Instructor profiles">
      <div className="flex flex-col gap-8">
        {instructors.map((founder, index) => {
          const meta = INSTRUCTOR_META[founder.id as (typeof INSTRUCTOR_IDS)[number]];
          if (!meta) return null;
          return (
            <InstructorCard
              key={founder.id}
              founder={founder}
              meta={meta}
              isLead={index === 0}
            />
          );
        })}
      </div>
    </section>
  );
}
