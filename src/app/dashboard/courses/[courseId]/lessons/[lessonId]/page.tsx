"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCircleCheck,
  FaDownload,
  FaFilePdf,
  FaMessage,
  FaPaperPlane,
  FaPlay,
} from "react-icons/fa6";
import { lmsStore } from "@/lib/lms-store";

export default function LessonViewerPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const resolvedParams = use(params);
  const lessonId = resolvedParams.lessonId || "les-w1-1";
  const result = lmsStore.getLessonById(lessonId) || lmsStore.getLessonById("les-w1-1")!;
  const { lesson, module } = result;

  const [activeTab, setActiveTab] = useState<"resources" | "discussions" | "notes">("resources");
  const [completed, setCompleted] = useState(false);
  const [discussions, setDiscussions] = useState([
    { id: "d-1", author: "Priya Sharma", text: "What is the optimal context window setting for Claude 3.5 Sonnet?", time: "2 hours ago" },
    { id: "d-2", author: "Sathvik Putta (Instructor)", text: "For Sonnet, maintain prompt context under 100k tokens for optimal speed & reasoning accuracy.", time: "1 hour ago" },
  ]);
  const [newComment, setNewComment] = useState("");

  const handleMarkComplete = () => {
    lmsStore.markLessonComplete("u-student", lesson.id);
    setCompleted(true);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setDiscussions([
      ...discussions,
      { id: `d-${Date.now()}`, author: "Rahul Verma (You)", text: newComment, time: "Just now" },
    ]);
    setNewComment("");
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/dashboard/courses" className="inline-flex items-center gap-2 text-xs font-bold text-[#1E3FE0] hover:underline dark:text-[#60A5FA]">
          <FaArrowLeft className="h-3 w-3" /> Back to My Learning
        </Link>

        <button
          type="button"
          onClick={handleMarkComplete}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition sm:w-auto ${
            completed
              ? "bg-[#10B981] text-white"
              : "bg-[#1E3FE0] text-white hover:bg-[#1630aa] dark:bg-[#60A5FA] dark:text-[#070B19]"
          }`}
        >
          <FaCircleCheck className="h-4 w-4" />
          <span>{completed ? "Lesson Completed!" : "Mark Lesson Complete"}</span>
        </button>
      </div>

      {/* Video Player Container */}
      <div className="overflow-hidden rounded-3xl border border-black/15 bg-[#0D1B2A] shadow-2xl dark:border-white/15">
        <div className="flex flex-col gap-2 border-b border-white/10 bg-[#12266E] px-4 py-3 text-xs font-bold text-white sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="min-w-0 truncate">{module.title}</span>
          <span className="w-fit shrink-0 rounded-full bg-white/10 px-3 py-1">{lesson.duration}</span>
        </div>

        <div className="relative aspect-[16/9] w-full bg-[#070B19]">
          <video
            src={lesson.videoUrl || "/videos/genvalue-academy-promo.mp4"}
            controls
            autoPlay
            poster="/images/poster/genvalue-poster.png"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Lesson Details & Interactive Tabs */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Lesson Info & Resources */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-black/10 bg-[#F6F1E4] p-6 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A]">
            <h1 className="font-display-custom text-2xl font-extrabold text-[#2A2A28] dark:text-white">
              {lesson.title}
            </h1>
            <p className="mt-2 text-xs font-medium leading-relaxed text-[#6B6558] dark:text-slate-300">
              {lesson.description}
            </p>

            {/* Tab Controls */}
            <div className="mt-6 flex border-b border-black/10 text-xs font-bold dark:border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("resources")}
                className={`border-b-2 px-4 py-2.5 transition ${
                  activeTab === "resources"
                    ? "border-[#1E3FE0] text-[#1E3FE0] dark:border-[#60A5FA] dark:text-[#60A5FA]"
                    : "border-transparent text-[#6B6558] dark:text-slate-400"
                }`}
              >
                Download Resources ({lesson.resources?.length || 1})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("discussions")}
                className={`border-b-2 px-4 py-2.5 transition ${
                  activeTab === "discussions"
                    ? "border-[#1E3FE0] text-[#1E3FE0] dark:border-[#60A5FA] dark:text-[#60A5FA]"
                    : "border-transparent text-[#6B6558] dark:text-slate-400"
                }`}
              >
                Lesson Discussion ({discussions.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="mt-6">
              {activeTab === "resources" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                      <FaFilePdf className="h-6 w-6 text-[#E8622E]" />
                      <div>
                        <p className="text-xs font-bold text-[#2A2A28] dark:text-white">
                          Official Week 1-12 Cheatsheet PDF
                        </p>
                        <p className="text-[10px] text-[#6B6558] dark:text-slate-400">PDF Format · 9 Pages</p>
                      </div>
                    </div>
                    <a
                      href="/downloads/genvalue-syllabus.pdf"
                      download
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E3FE0] px-4 py-2 text-xs font-bold text-white shadow-md dark:bg-[#60A5FA] dark:text-[#070B19]"
                    >
                      <FaDownload className="h-3 w-3" /> Download
                    </a>
                  </div>
                </div>
              )}

              {activeTab === "discussions" && (
                <div className="space-y-4">
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Ask a question or share a key insight..."
                      className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs outline-none dark:border-white/10 dark:bg-white/5"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8622E] px-4 py-2.5 text-xs font-bold text-white shadow-md"
                    >
                      <FaPaperPlane className="h-3 w-3" /> Post
                    </button>
                  </form>

                  <div className="space-y-3">
                    {discussions.map((d) => (
                      <div key={d.id} className="rounded-xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[#1E3FE0] dark:text-[#60A5FA]">{d.author}</span>
                          <span className="text-[10px] text-[#6B6558] dark:text-slate-400">{d.time}</span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-[#2A2A28] dark:text-slate-200">{d.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Module Lessons Playlist */}
        <div className="rounded-3xl border border-black/10 bg-[#F6F1E4] p-6 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A]">
          <h3 className="font-display-custom text-base font-extrabold text-[#2A2A28] dark:text-white">
            Module Playlist
          </h3>
          <p className="mt-1 text-xs font-medium text-[#6B6558] dark:text-slate-400">
            {module.lessons.length} Lessons in {module.title}
          </p>

          <div className="mt-4 space-y-2">
            {module.lessons.map((les, i) => (
              <Link
                key={les.id}
                href={`/dashboard/courses/ai-tools-mastery/lessons/${les.id}`}
                className={`flex items-center gap-3 rounded-2xl p-3 text-xs font-bold transition ${
                  les.id === lesson.id
                    ? "bg-[#1E3FE0] text-white shadow-md dark:bg-[#60A5FA] dark:text-[#070B19]"
                    : "bg-white/70 text-[#2A2A28] hover:bg-white dark:bg-white/5 dark:text-slate-200"
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-[10px]">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{les.title}</p>
                  <p className="opacity-70 text-[10px]">{les.duration}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
