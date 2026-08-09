"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaBookOpen, FaCircleCheck, FaPlay, FaStar, FaArrowRight } from "react-icons/fa6";
import { CardGridSkeleton, PortalTitleSkeleton } from "@/components/skeletons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function StudentCoursesPage() {
  const [loading, setLoading] = useState(true);
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        
        if (!authToken) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        // Fetch dashboard data which includes enrollment and progress
        const response = await fetch(`${API_URL}/dashboard/overview`, {
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setEnrollmentData(data.data);
        } else {
          setError("Failed to load enrollment data");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PortalTitleSkeleton />
        <CardGridSkeleton count={2} cols={2} />
      </div>
    );
  }

  if (!enrollmentData) {
    return (
      <div className="space-y-6">
        <div>
          <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#E8622E]">
            ★ PROGRAMS
          </span>
          <h1 className="font-display-custom text-2xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-3xl">
            My Learning Catalog
          </h1>
          <p className="text-xs font-medium text-[#6B6558] dark:text-slate-400">
            No courses available at the moment.
          </p>
        </div>
      </div>
    );
  }

  const { enrollment, progress } = enrollmentData;

  // If not enrolled, show enrollment prompt
  if (!enrollment) {
    return (
      <div className="space-y-6">
        <div>
          <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#E8622E]">
            ★ PROGRAMS
          </span>
          <h1 className="font-display-custom text-2xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-3xl">
            My Learning Catalog
          </h1>
          <p className="text-xs font-medium text-[#6B6558] dark:text-slate-400">
            Access your enrolled flagship programs, modules, and hands-on video labs.
          </p>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-dashed border-black/20 bg-[#F6F1E4]/50 p-12 text-center dark:border-white/20 dark:bg-[#0D1B2A]/50">
          <FaBookOpen className="h-16 w-16 text-[#1E3FE0]/30 dark:text-[#60A5FA]/30" />
          <div>
            <h2 className="font-display-custom text-2xl font-bold text-[#2A2A28] dark:text-white">
              You Haven't Enrolled Yet
            </h2>
            <p className="mt-2 text-sm text-[#6B6558] dark:text-slate-400">
              Enroll in a course to start your learning journey with GenValue
            </p>
          </div>
          <Link
            href="/dashboard/browse-courses"
            className="inline-flex items-center gap-2 rounded-full bg-[#1E3FE0] px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#12266E]"
          >
            <FaArrowRight className="h-4 w-4" />
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  // Enrolled - show course card with progress
  return (
    <div className="space-y-6">
      <div>
        <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#E8622E]">
          ★ ENROLLED PROGRAMS
        </span>
        <h1 className="font-display-custom text-2xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-3xl">
          My Learning Catalog
        </h1>
        <p className="text-xs font-medium text-[#6B6558] dark:text-slate-400">
          Access your enrolled flagship programs, modules, and hands-on video labs.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between rounded-2xl border border-black/10 bg-[#F6F1E4] p-4 shadow-2xl dark:border-white/10 dark:bg-[#0D1B2A] sm:rounded-3xl sm:p-8"
        >
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-[#1E3FE0]/10 px-3 py-1 text-[10px] font-extrabold uppercase text-[#1E3FE0] dark:bg-[#60A5FA]/20 dark:text-[#60A5FA]">
                {enrollment.duration}
              </span>
              <span className="text-[10px] font-bold text-[#10B981] sm:text-xs">ACTIVE ENROLLMENT</span>
            </div>

            <h2 className="font-display-custom mt-4 text-xl font-extrabold text-[#2A2A28] dark:text-white sm:text-2xl">
              {enrollment.courseName}
            </h2>
            <p className="mt-2 text-xs font-medium leading-relaxed text-[#6B6558] dark:text-slate-300">
              Choosing the Right AI Tool for Every Professional Task
            </p>

            <div className="mt-6">
              <div className="flex justify-between text-xs font-bold text-[#2A2A28] dark:text-white">
                <span>Progress Bar</span>
                <span>{progress.overallProgress}%</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div className="h-full bg-[#1E3FE0] dark:bg-[#60A5FA]" style={{ width: `${progress.overallProgress}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5 text-center sm:gap-2">
                <div className="rounded-lg bg-white/40 p-1.5 dark:bg-white/5 sm:p-2">
                  <p className="text-[9px] font-bold text-[#6B6558] dark:text-slate-400 sm:text-[10px]">Lessons</p>
                  <p className="text-xs font-extrabold text-[#2A2A28] dark:text-white sm:text-sm">{progress.completedLessons}/{progress.totalLessons}</p>
                </div>
                <div className="rounded-lg bg-white/40 p-1.5 dark:bg-white/5 sm:p-2">
                  <p className="text-[9px] font-bold text-[#6B6558] dark:text-slate-400 sm:text-[10px]">Modules</p>
                  <p className="text-xs font-extrabold text-[#2A2A28] dark:text-white sm:text-sm">{progress.completedModules}/{progress.totalModules}</p>
                </div>
                <div className="rounded-lg bg-white/40 p-1.5 dark:bg-white/5 sm:p-2">
                  <p className="text-[9px] font-bold text-[#6B6558] dark:text-slate-400 sm:text-[10px]">Status</p>
                  <p className="text-xs font-extrabold text-[#2A2A28] dark:text-white sm:text-sm">{progress.overallProgress}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-black/10 pt-4 dark:border-white/10">
            <Link
              href="/dashboard/courses/ai-tools-mastery/lessons/les-w1-1"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1E3FE0] py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#1630aa] dark:bg-[#60A5FA] dark:text-[#070B19]"
            >
              <FaPlay className="h-3 w-3" />
              <span>Resume Learning</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
