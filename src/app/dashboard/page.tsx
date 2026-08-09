"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaArrowRight,
  FaAward,
  FaBookOpen,
  FaCircleCheck,
  FaClock,
  FaFileLines,
  FaGraduationCap,
  FaListCheck,
  FaPlay,
  FaStar,
} from "react-icons/fa6";
import { LmsDashboardSkeleton } from "@/components/skeletons";
import { StudentActivityPlannerSection } from "@/components/dashboard/StudentActivityPlannerSection";
import { API_URL } from "@/lib/api";

interface DashboardAnnouncement {
  id: string;
  title: string;
  message: string;
  description?: string | null;
  type: string;
  priority: string;
  publishedAt?: string;
}

function formatAnnouncementLabel(type: string): string {
  const labels: Record<string, string> = {
    GENERAL: "Announcement",
    IMPORTANT: "Important",
    SYSTEM: "System",
    DEADLINE: "Deadline",
    EVENT: "Event",
    MENTORSHIP: "Announcement",
  };
  return labels[type] ?? "Announcement";
}

// Mock modules data (will be replaced with API call when Course model is implemented)
const MOCK_MODULES = [
  {
    id: "mod-w1",
    week: 1,
    title: "Week 1: AI Tools Landscape & Selection",
    description: "How foundation models work · Tool categories & accuracy · When general vs specialized tools win · Quick comparison frameworks",
  },
  {
    id: "mod-w2",
    week: 2,
    title: "Week 2: Prompting Fundamentals",
    description: "Prompt anatomy · System instructions vs Chain-of-thought · Few-shot examples · Iteration loops · Evaluating output quality",
  },
  {
    id: "mod-w3",
    week: 3,
    title: "Week 3: Research & Synthesis",
    description: "AI-native search · Citations & hallucination checks · Long-document synthesis · Literature review workflows",
  },
  {
    id: "mod-w4",
    week: 4,
    title: "Week 4: Writing & Communications",
    description: "Tone & voice control · Long-form structure · Email & deck copy · Light SEO alignment · Editing passes",
  },
];

export default function StudentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        
        if (!authToken) {
          router.push("/auth/login");
          return;
        }

        const response = await fetch(`${API_URL}/dashboard/overview`, {
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDashboardData(data.data);
        } else {
          if (response.status === 401) {
            localStorage.removeItem("authToken");
            localStorage.removeItem("userRole");
            router.push("/auth/login");
          } else {
            setError("Failed to load dashboard data");
          }
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return <LmsDashboardSkeleton />;
  }

  if (error || !dashboardData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{error || "Failed to load dashboard"}</p>
        </div>
      </div>
    );
  }

  const { user, enrollment, progress, stats, announcements = [] } = dashboardData;
  const announcementItems = (announcements ?? []) as DashboardAnnouncement[];

  // Show dashboard with stats even without enrollment
  const firstName = user.name.split(" ")[0];
  const showEnrollmentCard = enrollment !== null;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-[#F6F1E4] p-4 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A] sm:rounded-3xl sm:p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8"
      >
        <div className="min-w-0">
          <span className="font-annotation inline-block -rotate-2 text-[10px] font-bold uppercase tracking-widest text-[#E8622E] sm:text-xs">
            ★ STUDENT LEARNING PORTAL
          </span>
          <h1 className="font-display-custom mt-1 text-xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-3xl lg:text-4xl">
            Welcome back, {firstName}! 👋
          </h1>
          {showEnrollmentCard ? (
            <p className="mt-2 text-xs font-medium text-[#6B6558] dark:text-slate-300 sm:text-sm">
              You are enrolled in <strong className="font-bold text-[#1E3FE0] dark:text-[#60A5FA]">{enrollment.courseName} ({enrollment.duration})</strong>.
            </p>
          ) : (
            <p className="mt-2 text-xs font-medium text-[#6B6558] dark:text-slate-300 sm:text-sm">
              Ready to start learning? <Link href="/dashboard/browse-courses" className="font-bold text-[#1E3FE0] hover:underline dark:text-[#60A5FA]">Browse courses</Link> to get started.
            </p>
          )}
        </div>

        {showEnrollmentCard && (
          <Link
            href="/dashboard/courses/ai-tools-mastery/lessons/les-w1-1"
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[#1E3FE0] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#1530b5] dark:bg-[#60A5FA] dark:text-[#070B19] sm:w-auto"
          >
            <FaPlay className="h-3 w-3" />
            <span>Start Learning</span>
          </Link>
        )}
      </motion.div>

      {/* Progress & Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        <div className="rounded-2xl border border-black/10 bg-[#F6F1E4] p-4 shadow-lg dark:border-white/10 dark:bg-[#0D1B2A] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">Course Progress</span>
            <FaBookOpen className="h-5 w-5 text-[#1E3FE0] dark:text-[#60A5FA]" />
          </div>
          <p className="font-display-custom mt-3 text-3xl font-extrabold text-[#2A2A28] dark:text-white">{progress.overallProgress}%</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div className="h-full bg-[#1E3FE0] dark:bg-[#60A5FA]" style={{ width: `${progress.overallProgress}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-[#F6F1E4] p-4 shadow-lg dark:border-white/10 dark:bg-[#0D1B2A] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">Lessons Done</span>
            <FaCircleCheck className="h-5 w-5 text-[#10B981]" />
          </div>
          <p className="font-display-custom mt-3 text-3xl font-extrabold text-[#2A2A28] dark:text-white">
            {progress.completedLessons} / {progress.totalLessons}
          </p>
          <p className="mt-2 text-[10px] font-bold text-[#6B6558] dark:text-slate-400">{progress.completedModules} / {progress.totalModules} Modules Finished</p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-[#F6F1E4] p-4 shadow-lg dark:border-white/10 dark:bg-[#0D1B2A] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">Quiz Average</span>
            <FaListCheck className="h-5 w-5 text-[#E8622E]" />
          </div>
          <p className="font-display-custom mt-3 text-3xl font-extrabold text-[#2A2A28] dark:text-white">
            {stats.quizzesTaken > 0 ? `${stats.quizAverage}%` : "-"}
          </p>
          <p className="mt-2 text-[10px] font-bold text-[#6B6558] dark:text-slate-400">
            {stats.quizzesTaken} / {stats.quizzesTotal} Quizzes Taken
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-[#F6F1E4] p-4 shadow-lg dark:border-white/10 dark:bg-[#0D1B2A] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">Certificates</span>
            <FaAward className="h-5 w-5 text-amber-500" />
          </div>
          <p className="font-display-custom mt-3 text-3xl font-extrabold text-[#2A2A28] dark:text-white">{stats.certificatesEarned}</p>
          <p className="mt-2 text-[10px] font-bold text-[#1E3FE0] dark:text-[#60A5FA]">
            {stats.certificatesEarned > 0 ? "Verifiable Credential Ready" : "Complete course to earn"}
          </p>
        </div>
      </div>

      <StudentActivityPlannerSection />

      {/* Main Learning Timeline & Upcoming Tasks */}
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Left 2 Cols: 12-Week Curriculum Status */}
        {showEnrollmentCard ? (
          <div className="space-y-4 lg:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display-custom text-lg font-extrabold text-[#2A2A28] dark:text-white sm:text-xl">
                12-Week Curriculum Status
              </h2>
              <Link href="/dashboard/courses" className="text-xs font-bold text-[#1E3FE0] hover:underline dark:text-[#60A5FA]">
                View All Modules →
              </Link>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {MOCK_MODULES.map((mod) => (
                <div
                  key={mod.id}
                  className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-[#F6F1E4] p-4 shadow-md dark:border-white/10 dark:bg-[#0D1B2A] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1E3FE0] text-xs font-bold text-white shadow-md dark:bg-[#60A5FA] dark:text-[#070B19]">
                      W{mod.week}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display-custom text-sm font-bold text-[#2A2A28] dark:text-white">{mod.title}</h3>
                      <p className="mt-1 text-xs text-[#6B6558] dark:text-slate-300">{mod.description}</p>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/courses/ai-tools-mastery/lessons/les-w${mod.week}-1`}
                    className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-bold text-[#2A2A28] transition hover:bg-black/5 dark:border-white/10 dark:bg-white/10 dark:text-white sm:w-auto"
                  >
                    <span>Start Week</span>
                    <FaArrowRight className="h-3 w-3 text-[#1E3FE0] dark:text-[#60A5FA]" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 lg:col-span-2">
            <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-black/20 bg-[#F6F1E4]/50 p-6 text-center dark:border-white/20 dark:bg-[#0D1B2A]/50 sm:rounded-3xl sm:p-12">
              <FaBookOpen className="h-12 w-12 text-[#1E3FE0]/30 dark:text-[#60A5FA]/30 sm:h-16 sm:w-16" />
              <div>
                <h2 className="font-display-custom text-lg font-bold text-[#2A2A28] dark:text-white sm:text-xl">
                  No Courses Enrolled Yet
                </h2>
                <p className="mt-2 text-sm text-[#6B6558] dark:text-slate-400">
                  Start your learning journey by enrolling in a course.
                </p>
              </div>
              <Link
                href="/dashboard/browse-courses"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1E3FE0] px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#12266E] sm:w-auto"
              >
                <FaArrowRight className="h-4 w-4" />
                Browse Courses
              </Link>
            </div>
          </div>
        )}

        {/* Right Col: Announcements */}
        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-2xl border border-black/10 bg-[#F6F1E4] p-4 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A] sm:p-6">
            <h3 className="font-display-custom text-base font-bold text-[#2A2A28] dark:text-white">
              Upcoming Deadlines
            </h3>
            <div className="mt-4">
              <p className="text-xs text-[#6B6558] dark:text-slate-400">
                No upcoming deadlines. Start learning to unlock assignments and quizzes!
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-[#F6F1E4] p-4 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A] sm:p-6">
            <h3 className="font-display-custom text-base font-bold text-[#2A2A28] dark:text-white">
              Announcements
            </h3>

            {announcementItems.length > 0 ? (
              <div className="mt-4 space-y-4">
                {announcementItems.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="rounded-2xl border border-black/10 bg-[#12266E] p-4 text-white shadow-lg dark:border-white/10 sm:p-5"
                  >
                    <span className="font-annotation text-xs font-bold text-[#E8622E]">
                      ★ {formatAnnouncementLabel(announcement.type)}
                    </span>
                    <h4 className="font-display-custom mt-1 text-sm font-bold text-white sm:text-base">
                      {announcement.title}
                    </h4>
                    <p className="mt-2 text-xs leading-relaxed text-[#DFE3F7]">
                      {announcement.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-xs text-[#6B6558] dark:text-slate-400">
                No announcements yet. Updates from GenValue will appear here when
                published.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
