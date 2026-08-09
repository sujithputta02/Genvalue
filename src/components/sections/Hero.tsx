"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaPause, FaPlay, FaVolumeHigh, FaVolumeXmark } from "react-icons/fa6";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { EnrollNowLink } from "@/components/ui/EnrollNowLink";
import { SITE } from "@/lib/constants";

const HERO_VIDEO_SRC = "/videos/Genvalue%20Intro.mp4" as const;

const STATS: readonly string[] = [
  "12 Weeks Immersion",
  "40+ AI Tools",
  "11 Categories",
  "1 Capstone Project",
] as const;

function TornPaperDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-full overflow-hidden leading-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        className="relative block h-7 w-full fill-[#F6F1E4] text-[#F6F1E4] drop-shadow-[0_4px_6px_rgba(0,0,0,0.12)] dark:fill-[#0D1B2A] dark:text-[#0D1B2A] sm:h-10 md:h-12"
      >
        <path d="M0,0 C150,45 350,-15 500,30 C650,75 800,10 950,45 C1100,80 1150,15 1200,35 L1200,60 L0,60 Z" />
      </svg>
    </div>
  );
}

const heroContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
} as const;

const paperTearReveal = {
  hidden: { clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)", opacity: 0, y: 40 },
  visible: {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
} as const;

const badgeLeftVariants = {
  hidden: { opacity: 0, x: -40, rotate: -20, scale: 0.8 },
  visible: {
    opacity: 1,
    x: 0,
    rotate: -6,
    scale: 1,
    transition: { duration: 0.75, type: "spring", stiffness: 140, damping: 10 },
  },
} as const;

const badgeRightVariants = {
  hidden: { opacity: 0, x: 40, rotate: 20, scale: 0.8 },
  visible: {
    opacity: 1,
    x: 0,
    rotate: 3,
    scale: 1,
    transition: { duration: 0.75, type: "spring", stiffness: 140, damping: 10 },
  },
} as const;

const headlineVariants = {
  hidden: { opacity: 0, y: 35, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: [0.215, 0.61, 0.355, 1] },
  },
} as const;

export function Hero() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => setIsPlaying(false));
  }, []);

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  return (
    <section
      style={{ position: "relative" }}
      className="relative mx-auto w-full max-w-[1300px] px-4 pt-20 pb-12 sm:px-6 sm:pt-28 sm:pb-16 lg:px-8 lg:pt-36 lg:pb-20"
      aria-labelledby="hero-heading"
    >
      <motion.div
        variants={heroContainerVariants}
        initial="hidden"
        animate="visible"
        className="relative mx-auto max-w-5xl text-center"
      >
        {/* Annotations: stacked on phones, corners from sm+ */}
        <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:mb-0 sm:contents">
          <motion.span
            variants={badgeLeftVariants}
            whileHover={{ scale: 1.12, rotate: -2 }}
            className="font-annotation text-[11px] font-bold tracking-wider text-[#6B6558] underline decoration-[#E8622E]/50 underline-offset-4 dark:text-slate-400 min-[400px]:text-xs sm:absolute sm:-top-12 sm:left-6 sm:text-sm md:left-12 md:text-base lg:text-lg cursor-pointer"
            aria-hidden="true"
          >
            PRACTITIONER-FIRST
          </motion.span>

          <motion.span
            variants={badgeRightVariants}
            whileHover={{ scale: 1.12, rotate: 0 }}
            className="font-annotation text-[11px] font-bold tracking-wider text-[#1E3FE0] dark:text-[#60A5FA] min-[400px]:text-xs sm:absolute sm:-top-12 sm:right-6 sm:text-sm md:right-12 md:text-base lg:text-lg cursor-pointer"
            aria-hidden="true"
          >
            → NOT LECTURES
          </motion.span>
        </div>

        <motion.h1
          variants={headlineVariants}
          id="hero-heading"
          className="font-display-custom mt-1 text-balance text-[1.75rem] font-extrabold leading-[1.08] tracking-tight text-[#2A2A28] dark:text-white min-[400px]:text-3xl sm:mt-2 sm:text-5xl md:text-7xl lg:text-[5.5rem] xl:text-[96px]"
        >
          Learning at the <br className="hidden sm:inline" />
          <span className="relative inline-block text-[#1E3FE0] dark:text-white">
            speed of curiosity
          </span>
        </motion.h1>

        <motion.p
          variants={headlineVariants}
          className="mx-auto mt-4 max-w-2xl text-pretty px-1 text-sm font-medium leading-relaxed text-[#6B6558] dark:text-slate-300 sm:mt-6 sm:px-0 sm:text-lg md:text-xl"
        >
          A practical 12-week program covering 40+ AI tools across 11 categories - engineered for
          working professionals who demand clear judgment over hype.
        </motion.p>

        <motion.div
          variants={headlineVariants}
          className="mt-6 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-4"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
            <EnrollNowLink
              aria-label="Enroll in AI Tools Mastery program"
              className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full bg-[#E8622E] px-6 text-sm font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#d55321] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8622E] sm:px-10 sm:text-base"
            >
              Enroll Now
            </EnrollNowLink>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
            <Link
              href="/syllabus"
              aria-label="View the 12-week course syllabus"
              className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full border-2 border-[#2A2A28] bg-transparent px-6 text-sm font-bold text-[#2A2A28] transition hover:bg-[#2A2A28]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A2A28] dark:border-white dark:text-white dark:hover:bg-white/10 sm:px-8 sm:text-base"
            >
              View Syllabus
            </Link>
          </motion.div>
        </motion.div>

        <motion.div variants={headlineVariants} className="mt-3 flex items-center justify-center sm:mt-4">
          <DownloadButton
            href={SITE.syllabusPdfUrl}
            filename={SITE.syllabusDownloadFilename}
            label="Download Full Syllabus PDF →"
            variant="ghost"
            size="sm"
            trackingLabel="Download GenValue syllabus PDF"
          />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        className="mt-8 w-full origin-center sm:mt-12"
      >
        <TornPaperDivider />
      </motion.div>

      <motion.div
        variants={paperTearReveal}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden rounded-2xl border border-black/15 bg-[#0D1B2A] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] ring-1 ring-black/10 dark:border-white/15 dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.7)] sm:rounded-3xl"
      >
        {/* Browser chrome — wraps cleanly on small screens */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#12266E] px-3 py-2.5 backdrop-blur-md sm:gap-3 sm:px-5 sm:py-3.5">
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444] shadow-sm sm:h-3 sm:w-3" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B] shadow-sm sm:h-3 sm:w-3" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#10B981] shadow-sm sm:h-3 sm:w-3" />
          </div>

          <div className="order-last flex min-w-0 flex-[1_1_100%] items-center gap-2 truncate rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold text-white/80 sm:order-none sm:flex-[1_1_auto] sm:justify-center sm:px-5 sm:text-xs md:max-w-md md:mx-auto">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#10B981] animate-pulse" />
            <span className="truncate sm:hidden">genvalue.academy</span>
            <span className="hidden truncate sm:inline">genvalue.academy / ai-tools-mastery</span>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={toggleVideo}
              aria-label={isPlaying ? "Pause promo video" : "Play promo video"}
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-white/20 sm:px-3"
            >
              {isPlaying ? (
                <>
                  <FaPause className="h-3 w-3 text-[#E8622E]" aria-hidden="true" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <FaPlay className="h-3 w-3 text-[#10B981]" aria-hidden="true" />
                  <span className="hidden sm:inline">Play</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute promo video" : "Mute promo video"}
              aria-pressed={!isMuted}
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-white/20 sm:px-3"
            >
              {isMuted ? (
                <>
                  <FaVolumeXmark className="h-3.5 w-3.5 text-white/80" aria-hidden="true" />
                  <span className="hidden sm:inline">Unmute</span>
                </>
              ) : (
                <>
                  <FaVolumeHigh className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
                  <span className="hidden sm:inline">Mute</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#070B19]">
          <div className="relative h-full w-full">
            <video
              ref={videoRef}
              src={HERO_VIDEO_SRC}
              poster="/images/poster/genvalue-poster.png"
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="absolute bottom-3 left-3 right-3 rounded-full bg-black/65 px-3 py-1.5 text-center font-annotation text-[10px] font-bold text-white backdrop-blur-md sm:bottom-5 sm:left-auto sm:right-6 sm:max-w-none sm:px-5 sm:py-2 sm:text-left sm:text-xs md:text-sm">
            GenValue thinks with you, not at you.
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="mt-8 border-t border-black/10 pt-5 dark:border-white/10 sm:mt-10 sm:pt-6"
      >
        <ul className="grid grid-cols-2 gap-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400 min-[480px]:gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-6 sm:text-xs md:gap-8 md:text-sm">
          {STATS.map((label) => (
            <li key={label} className="min-w-0">
              <span className="text-[#2A2A28] dark:text-white">{label}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
