"use client";

import type { Degree, Founder } from "@/data/founders";
import { founders } from "@/data/founders";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { FaEnvelope, FaGithub, FaLinkedin } from "react-icons/fa6";
import { GiGraduateCap } from "react-icons/gi";

const cardEase = [0.22, 1, 0.36, 1] as [number, number, number, number];

function countryFlag(country: string): string {
  const map: Record<string, string> = {
    "United States": "🇺🇸",
    USA: "🇺🇸",
    India: "🇮🇳",
  };
  return map[country] ?? "🌍";
}

function abbreviateLevel(level: string): string {
  const l = level.toLowerCase();
  if (l === "mba" || l.startsWith("mba ")) return "MBA";
  if (l.includes("master's degree")) return "Master's";
  if (l.includes("master of science")) return "MS";
  if (l.includes("bachelor of engineering")) return "BE";
  if (l.includes("bachelor of technology")) return "BTech";
  if (l.includes("bachelor's degree")) return "Bachelor's";
  if (l.includes("master")) return "MS";
  if (l.includes("bachelor")) return "BSc";
  return level.split(" ").slice(0, 2).join(" ");
}

function founderInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function founderBadgeLabel(founder: Founder): string {
  const role = founder.role.toLowerCase();
  if (role.includes("co-founder")) return "Co-Founder";
  if (role.includes("chief technology") || /(^|[^a-z])cto([^a-z]|$)/.test(role)) return "CTO";
  if (role.includes("chief product") || /(^|[^a-z])cpo([^a-z]|$)/.test(role)) return "CPO";
  if (role.includes("founder")) return "Founder";
  if (role.includes("employee")) return "Employee";
  return founder.role.split("&")[0]?.trim() || "Team";
}

function FounderPhoto({ founder }: { founder: Founder }) {
  const [failed, setFailed] = useState(false);
  const showFallback = failed;
  const onError = useCallback(() => setFailed(true), []);

  return (
    <div
      className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-[#1E3FE0] p-1 shadow-md sm:mx-0 sm:h-32 sm:w-32"
    >
      {showFallback ? (
        <div
          className="flex h-full w-full items-center justify-center rounded-full bg-[#12266E] text-lg font-bold text-white"
          aria-hidden="true"
        >
          {founderInitials(founder.name)}
        </div>
      ) : (
        <Image
          src={founder.photo}
          alt={`Portrait of ${founder.name}`}
          fill
          className="rounded-full object-cover"
          style={founder.photoPosition ? { objectPosition: founder.photoPosition } : undefined}
          sizes="(max-width: 639px) 112px, 128px"
          onError={onError}
        />
      )}
    </div>
  );
}

function DegreeRow({ degree }: { degree: Degree }) {
  const abbr = abbreviateLevel(degree.level);
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-black/5 bg-white/70 px-3.5 py-2.5 dark:border-white/5 dark:bg-white/5">
      <GiGraduateCap className="mt-0.5 h-5 w-5 shrink-0 text-[#1E3FE0] dark:text-[#60A5FA]" aria-hidden="true" />
      <p className="min-w-0 break-words text-xs font-semibold leading-snug text-[#2A2A28] dark:text-slate-200 sm:text-sm">
        <span className="font-extrabold text-[#1E3FE0] dark:text-[#60A5FA]">{abbr}</span>
        <span className="opacity-40"> · </span>
        <span>{degree.field}</span>
        <span className="opacity-40"> · </span>
        <span className="inline sm:inline">{degree.institution}</span>
        <span className="opacity-40"> · </span>
        <span aria-hidden="true">{countryFlag(degree.country)}</span>
      </p>
    </div>
  );
}

function FounderCard({
  founder,
  index,
  spacious = false,
}: {
  founder: Founder;
  index: number;
  spacious?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const fullBio = founder.bio.join(" ");

  return (
    <motion.article
      className={`group/card flex h-full flex-col justify-between rounded-[20px] border border-black/10 bg-[#F6F1E4] shadow-lg transition-transform duration-300 hover:scale-[1.01] dark:border-white/10 dark:bg-[#0D1B2A] ${
        spacious ? "p-5 sm:p-7 lg:p-10" : "p-5 sm:p-6 lg:p-8"
      }`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.15, ease: cardEase }}
    >
      <div>
        <div className="flex flex-col items-center sm:flex-row sm:gap-6">
          <FounderPhoto founder={founder} />
          <div className="mt-4 text-center sm:mt-0 sm:text-left">
            <span className="rounded-full bg-[#1E3FE0]/10 px-3 py-1 font-annotation text-xs font-bold text-[#1E3FE0] dark:bg-white/10 dark:text-[#60A5FA]">
              {founderBadgeLabel(founder)}
            </span>
            <h3 className="font-display-custom mt-2 text-2xl font-extrabold text-[#2A2A28] dark:text-white">
              {founder.name}
            </h3>
            <p className="text-sm font-semibold text-[#6B6558] dark:text-slate-300">{founder.role}</p>
            <p className="text-xs text-[#6B6558]/80 dark:text-slate-400">{founder.title}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="font-annotation text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
            DEGREES & EDUCATION
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {founder.degrees.map((d) => (
              <DegreeRow key={`${founder.id}-${d.level}-${d.institution}`} degree={d} />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className={`text-sm leading-relaxed text-[#6B6558] dark:text-slate-300 ${expanded ? "" : "line-clamp-3"}`}>
            {fullBio}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-2 text-xs font-bold uppercase tracking-wider text-[#1E3FE0] underline-offset-4 hover:underline dark:text-[#60A5FA]"
            aria-expanded={expanded}
          >
            {expanded ? "Show Less" : "Read Full Bio"}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {founder.expertise.map((tag) => (
            <span
              key={`${founder.id}-${tag}`}
              className="rounded-full border border-black/5 bg-white/80 px-3 py-1 text-xs font-bold text-[#2A2A28] dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {(founder.linkedin || founder.github || founder.email) && (
        <div className="mt-8 flex items-center justify-center gap-4 border-t border-black/10 pt-6 dark:border-white/10 sm:justify-start">
          {founder.linkedin ? (
            <Link
              href={founder.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E3FE0] text-white transition hover:bg-[#12266E]"
              aria-label={`${founder.name} on LinkedIn`}
            >
              <FaLinkedin className="h-5 w-5" aria-hidden="true" />
            </Link>
          ) : null}
          {founder.github ? (
            <Link
              href={founder.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2A2A28] text-white transition hover:bg-black"
              aria-label={`${founder.name} on GitHub`}
            >
              <FaGithub className="h-5 w-5" aria-hidden="true" />
            </Link>
          ) : null}
          {founder.email ? (
            <a
              href={`mailto:${founder.email}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8622E] text-white transition hover:bg-[#d55321]"
              aria-label={`Email ${founder.name}`}
            >
              <FaEnvelope className="h-5 w-5" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      )}
    </motion.article>
  );
}

type FoundersSectionProps = {
  id?: string;
  /** Wider, roomier 2-column layout — use only on About. Team keeps the default pyramid. */
  variant?: "default" | "about";
};

export function FoundersSection({ id, variant = "default" }: FoundersSectionProps = {}) {
  const isAbout = variant === "about";
  /** About shows Founder + Co-founder only; Team shows the full leadership grid. */
  const people = isAbout
    ? founders.filter((f) => f.id === "onarjae-bonhometre" || f.id === "sathvik-putta")
    : founders;
  const topRow = people.slice(0, 2);
  const midRow = people.slice(2, 5);
  const lowerRow = people.slice(5);

  return (
    <section
      id={id}
      className={`mx-auto px-4 py-14 sm:px-6 sm:py-20 lg:px-8 ${
        isAbout ? "max-w-[1500px]" : "max-w-[1400px]"
      }`}
      aria-labelledby="founders-heading"
    >
      <header className="mb-10 text-center sm:mb-14">
        <span className="font-annotation inline-block -rotate-2 text-sm font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
          ★ LEADERSHIP & INSTRUCTION
        </span>
        <h2
          id="founders-heading"
          className="font-display-custom mt-2 text-balance text-2xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-4xl md:text-5xl"
        >
          Built by practitioners, not theorists.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-[#6B6558] dark:text-slate-300 sm:text-lg">
          Every course decision is made by people who build with these tools daily.
        </p>
      </header>

      {isAbout ? (
        /* About: Founder + Co-founder only, equal-width 2-column */
        <div className="mx-auto grid max-w-[1300px] grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 xl:gap-12">
          {people.map((founder, index) => (
            <FounderCard key={founder.id} founder={founder} index={index} spacious />
          ))}
        </div>
      ) : (
        /* Team (default): pyramid — founders, then CPO/CTO row, then employees */
        <div className="flex flex-col gap-8">
          <div className="mx-auto grid w-full grid-cols-1 gap-8 sm:max-w-xl md:max-w-none md:grid-cols-2 lg:w-[calc(((100%-4rem)*2/3)+2rem)] lg:max-w-none lg:gap-8">
            {topRow.map((founder, index) => (
              <FounderCard key={founder.id} founder={founder} index={index} />
            ))}
          </div>

          {midRow.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:mx-auto sm:max-w-xl md:mx-0 md:max-w-none md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {midRow.map((founder, index) => (
                <FounderCard key={founder.id} founder={founder} index={topRow.length + index} />
              ))}
            </div>
          ) : null}

          {lowerRow.length > 0 ? (
            <div
              className={`mx-auto grid w-full grid-cols-1 gap-8 ${
                lowerRow.length === 1
                  ? "sm:max-w-xl md:max-w-xl"
                  : lowerRow.length === 2
                    ? "sm:max-w-xl md:max-w-none md:grid-cols-2 lg:w-[calc(((100%-4rem)*2/3)+2rem)]"
                    : "sm:max-w-xl md:max-w-none md:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {lowerRow.map((founder, index) => (
                <FounderCard
                  key={founder.id}
                  founder={founder}
                  index={topRow.length + midRow.length + index}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
