"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowLeft, FaCircleCheck, FaClock, FaStar, FaXmark } from "react-icons/fa6";
import { lmsStore } from "@/lib/lms-store";

export default function QuizPlayerPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.quizId || "quiz-w1";

  // Find quiz
  let foundQuiz = null;
  for (const mod of lmsStore.getModules()) {
    if (mod.quiz?.id === quizId) {
      foundQuiz = mod.quiz;
      break;
    }
  }
  const quiz = foundQuiz || lmsStore.getModules()[0].quiz!;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const currentQ = quiz.questions[currentIdx] || quiz.questions[0];

  const handleSelectOption = (questionId: string, option: string) => {
    if (submitted) return;
    setSelectedAnswers({ ...selectedAnswers, [questionId]: option });
  };

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    quiz.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount += 1;
      }
    });
    const finalScore = Math.round((correctCount / quiz.questions.length) * 100);
    setScore(finalScore);
    setSubmitted(true);
    lmsStore.submitQuizAttempt("u-student", quiz.id, finalScore);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/dashboard/quizzes" className="inline-flex items-center gap-2 text-xs font-bold text-[#1E3FE0] hover:underline dark:text-[#60A5FA]">
        <FaArrowLeft className="h-3 w-3" /> Back to Quizzes
      </Link>

      <div className="rounded-2xl border border-black/10 bg-[#F6F1E4] p-4 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A] sm:rounded-3xl sm:p-8">
        <div className="flex flex-col gap-3 border-b border-black/10 pb-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="font-annotation text-xs font-bold text-[#E8622E]">★ TIMED ASSESSMENT</span>
            <h1 className="font-display-custom mt-1 text-lg font-extrabold text-[#2A2A28] dark:text-white sm:text-2xl">
              {quiz.title}
            </h1>
          </div>

          <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-bold text-[#1E3FE0] dark:border-white/10 dark:bg-white/5 dark:text-[#60A5FA] sm:px-4">
            <FaClock className="h-3.5 w-3.5" />
            <span>Question {currentIdx + 1} of {quiz.questions.length}</span>
          </div>
        </div>

        {submitted ? (
          /* Results Breakdown */
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#10B981]/20 text-3xl font-extrabold text-[#10B981]">
              {score}%
            </div>

            <h2 className="font-display-custom mt-4 text-2xl font-extrabold text-[#2A2A28] dark:text-white">
              {score >= quiz.passScore ? "Congratulations! You Passed! 🎉" : "Assessment Completed"}
            </h2>
            <p className="mt-2 text-xs font-medium text-[#6B6558] dark:text-slate-300">
              You scored {score}% (Pass Requirement: {quiz.passScore}%). Your attempt has been logged.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setSelectedAnswers({});
                  setCurrentIdx(0);
                }}
                className="rounded-full border border-black/10 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#2A2A28] shadow-md dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                Retake Quiz
              </button>
              <Link
                href="/dashboard/quizzes"
                className="rounded-full bg-[#1E3FE0] px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-white shadow-md dark:bg-[#60A5FA] dark:text-[#070B19]"
              >
                Return to Quizzes
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Question Form */
          <div className="mt-6 space-y-6">
            <div>
              <p className="text-sm font-extrabold text-[#2A2A28] dark:text-white sm:text-base">
                Q{currentIdx + 1}: {currentQ.question}
              </p>

              <div className="mt-4 space-y-3">
                {currentQ.options.map((opt, i) => {
                  const isSelected = selectedAnswers[currentQ.id] === opt;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-xs font-semibold transition ${
                        isSelected
                          ? "border-[#1E3FE0] bg-[#1E3FE0]/10 text-[#1E3FE0] dark:border-[#60A5FA] dark:bg-[#60A5FA]/20 dark:text-[#60A5FA]"
                          : "border-black/10 bg-white text-[#2A2A28] hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                      }`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                        isSelected ? "border-[#1E3FE0] bg-[#1E3FE0] text-white" : "border-black/20"
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between border-t border-black/10 pt-6 dark:border-white/10">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-bold disabled:opacity-30 dark:border-white/10 dark:bg-white/5"
              >
                Previous
              </button>

              {currentIdx < quiz.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
                  className="rounded-xl bg-[#1E3FE0] px-5 py-2.5 text-xs font-bold text-white shadow-md dark:bg-[#60A5FA] dark:text-[#070B19]"
                >
                  Next Question
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="rounded-xl bg-[#E8622E] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg"
                >
                  Submit Assessment
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
