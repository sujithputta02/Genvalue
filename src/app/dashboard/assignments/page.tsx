"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaClock, FaFileLines, FaPaperclip, FaPaperPlane } from "react-icons/fa6";
import { StudentChoiceInput } from "@/components/quiz/StudentChoiceInput";
import { isChoiceQuestion } from "@/lib/quizQuestions";
import { getAuthTokenWithRefresh } from "@/services/authService";
import { AssignmentsListSkeleton } from "@/components/skeletons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface Assignment {
  id: string;
  week: number;
  title: string;
  description: string;
  instructions?: string;
  type: "PDF" | "MCQ" | "MIXED";
  isRequired: boolean;
  questions?: any[];
  passingScore?: number;
  dueDate: string;
  createdAt: string;
}

interface Submission {
  id: string;
  assignmentId: string;
  userId: string;
  submissionType: string;
  pdfUrl?: string;
  answers?: any;
  grade?: number;
  feedback?: string;
  status: string;
  submittedAt?: string;
  gradedAt?: string;
  assignment: {
    id: string;
    week: number;
    title: string;
    type: string;
    dueDate: string;
  };
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [answers, setAnswers] = useState<{ [key: number]: any }>({});
  const [submittedMessage, setSubmittedMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authToken = await getAuthTokenWithRefresh();
        if (!authToken) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        // Fetch assignments for all weeks
        let allAssignments: Assignment[] = [];
        for (let week = 1; week <= 12; week++) {
          try {
            const response = await fetch(`${API_URL}/assignments/week/${week}`, {
              headers: {
                "Authorization": `Bearer ${authToken}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              allAssignments = [...allAssignments, ...(data.data || [])];
            }
          } catch (err) {
            // Week has no assignments, continue
          }
        }

        setAssignments(allAssignments);
        if (allAssignments.length > 0) {
          setActiveAssignmentId(allAssignments[0].id);
        }

        // Fetch user submissions
        const submissionsResponse = await fetch(`${API_URL}/user/submissions`, {
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        });

        if (submissionsResponse.ok) {
          const data = await submissionsResponse.json();
          setSubmissions(data.data || []);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load assignments");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmitAssignment = async (e: React.FormEvent, assignmentId: string) => {
    e.preventDefault();
    
    try {
      const authToken = await getAuthTokenWithRefresh();
      if (!authToken) {
        setError("Session expired. Please log in again.");
        return;
      }

      const assignment = assignments.find((a) => a.id === assignmentId);
      if (!assignment) return;

      const submitType = assignment.type;
      const payload: any = { assignmentId, type: submitType };

      if (submitType === "PDF" || submitType === "MIXED") {
        payload.pdfUrl = fileUrl;
      }
      if (submitType === "MCQ" || submitType === "MIXED") {
        payload.answers = answers;
      }

      const response = await fetch(`${API_URL}/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setSubmittedMessage("Assignment submitted successfully!");
        setFileUrl("");
        setAnswers({});

        // Refresh submissions
        const submissionsResponse = await fetch(`${API_URL}/user/submissions`, {
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        });

        if (submissionsResponse.ok) {
          const subData = await submissionsResponse.json();
          setSubmissions(subData.data || []);
        }

        setTimeout(() => setSubmittedMessage(""), 3000);
      } else {
        setError("Failed to submit assignment");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to submit assignment");
    }
  };

  if (loading) {
    return <AssignmentsListSkeleton />;
  }

  if (assignments.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#E8622E]">
            ★ PRACTICAL PROJECT SUBMISSIONS
          </span>
          <h1 className="font-display-custom text-2xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-3xl">
            Assignments & Capstone Work
          </h1>
          <p className="text-xs font-medium text-[#6B6558] dark:text-slate-400">
            Submit weekly hands-on deliverables and track instructor evaluation feedback.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-dashed border-black/20 bg-[#F6F1E4]/50 p-12 text-center dark:border-white/20 dark:bg-[#0D1B2A]/50">
          <FaFileLines className="h-16 w-16 text-[#1E3FE0]/30 dark:text-[#60A5FA]/30" />
          <div>
            <h2 className="font-display-custom text-2xl font-bold text-[#2A2A28] dark:text-white">
              No Assignments Available Yet
            </h2>
            <p className="mt-2 text-sm text-[#6B6558] dark:text-slate-400">
              Assignments will appear as you enroll in weeks. Start by enrolling in Week 1!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedAssignment = assignments.find((a) => a.id === activeAssignmentId);
  const selectedSubmission = selectedAssignment ? submissions.find((s) => s.assignmentId === selectedAssignment.id) : null;

  return (
    <div className="space-y-6">
      <div>
        <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#E8622E]">
          ★ PRACTICAL PROJECT SUBMISSIONS
        </span>
        <h1 className="font-display-custom text-2xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-3xl">
          Assignments & Capstone Work
        </h1>
        <p className="text-xs font-medium text-[#6B6558] dark:text-slate-400">
          Submit weekly hands-on deliverables and track instructor evaluation feedback.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {submittedMessage && (
        <div className="rounded-2xl border border-[#10B981]/20 bg-[#10B981]/10 p-4 text-xs font-bold text-[#10B981]">
          ✓ {submittedMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Col: Assignment List */}
        <div className="space-y-3 lg:col-span-1">
          {assignments.map((assignment) => {
            const submission = submissions.find((s) => s.assignmentId === assignment.id);
            const isSelected = activeAssignmentId === assignment.id;

            return (
              <button
                key={assignment.id}
                type="button"
                onClick={() => {
                  setActiveAssignmentId(assignment.id);
                  setSubmittedMessage("");
                  setError(null);
                }}
                className={`flex w-full flex-col gap-1 rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-[#1E3FE0] bg-[#1E3FE0]/10 dark:border-[#60A5FA] dark:bg-[#60A5FA]/20"
                    : "border-black/10 bg-[#F6F1E4] hover:bg-black/5 dark:border-white/10 dark:bg-[#0D1B2A]"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase">
                  <span className="text-[#E8622E]">Week {assignment.week}</span>
                  {submission ? (
                    <span className={`${submission.status === "GRADED" ? "text-[#10B981]" : "text-[#E8622E]"}`}>
                      {submission.status} {submission.grade ? `(${submission.grade}%)` : ""}
                    </span>
                  ) : (
                    <span className="text-[#6B6558] dark:text-slate-400">NOT SUBMITTED</span>
                  )}
                </div>
                <p className="font-display-custom text-sm font-bold text-[#2A2A28] dark:text-white">{assignment.title}</p>
              </button>
            );
          })}
        </div>

        {/* Right 2 Cols: Submission Detail & Workspace */}
        <div className="lg:col-span-2">
          {selectedAssignment ? (
            <div className="rounded-2xl border border-black/10 bg-[#F6F1E4] p-4 shadow-xl dark:border-white/10 dark:bg-[#0D1B2A] sm:rounded-3xl sm:p-8">
              <span className="font-annotation text-xs font-bold text-[#E8622E]">★ WEEK {selectedAssignment.week} DELIVERABLE</span>
              <h2 className="font-display-custom mt-1 text-lg font-extrabold text-[#2A2A28] dark:text-white sm:text-2xl">
                {selectedAssignment.title}
              </h2>
              <p className="mt-2 text-xs font-medium leading-relaxed text-[#6B6558] dark:text-slate-300">
                {selectedAssignment.description}
              </p>

              {selectedAssignment.instructions && (
                <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/10">
                  <p className="text-xs font-bold text-[#2A2A28] dark:text-white">Instructions:</p>
                  <p className="mt-1 text-xs text-[#6B6558] dark:text-slate-300">{selectedAssignment.instructions}</p>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2 text-xs font-bold text-[#6B6558] dark:text-slate-400 sm:flex-row sm:items-center sm:gap-4">
                <span className="flex items-center gap-1">
                  <FaClock className="h-3.5 w-3.5 shrink-0 text-[#E8622E]" /> 
                  Deadline: {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                </span>
                {selectedAssignment.type === "MCQ" && selectedAssignment.passingScore && (
                  <span>Pass Score: {selectedAssignment.passingScore}%</span>
                )}
              </div>

              {selectedSubmission ? (
                <div className="mt-6 space-y-4 border-t border-black/10 pt-6 dark:border-white/10">
                  <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className={selectedSubmission.status === "GRADED" ? "text-[#10B981]" : "text-[#E8622E]"}>
                        Status: {selectedSubmission.status}
                      </span>
                      {selectedSubmission.grade && (
                        <span className="text-xs text-[#10B981]">Grade: {selectedSubmission.grade}%</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-medium text-[#2A2A28] dark:text-slate-200">
                      Submitted: {selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleDateString() : "N/A"}
                    </p>
                    {selectedSubmission.feedback && (
                      <div className="mt-3 rounded-xl border border-black/10 bg-[#EDE6D3] p-3 text-xs dark:bg-[#070B19]">
                        <p className="font-bold text-[#E8622E]">Instructor Feedback:</p>
                        <p className="mt-1 text-[#6B6558] dark:text-slate-300">{selectedSubmission.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => handleSubmitAssignment(e, selectedAssignment.id)} className="mt-6 space-y-4 border-t border-black/10 pt-6 dark:border-white/10">
                  {(selectedAssignment.type === "PDF" || selectedAssignment.type === "MIXED") && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-300">
                        PDF File URL / Project Link
                      </label>
                      <div className="relative mt-1.5">
                        <FaPaperclip className="absolute left-4 top-3.5 h-4 w-4 text-[#6B6558] dark:text-slate-400" />
                        <input
                          type="text"
                          required={selectedAssignment.type === "PDF"}
                          value={fileUrl}
                          onChange={(e) => setFileUrl(e.target.value)}
                          placeholder="https://drive.google.com/... or /uploads/project.pdf"
                          className="w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 py-3 text-xs font-medium outline-none transition focus:border-[#1E3FE0] dark:border-white/10 dark:bg-white/5 dark:focus:border-[#60A5FA]"
                        />
                      </div>
                    </div>
                  )}

                  {(selectedAssignment.type === "MCQ" || selectedAssignment.type === "MIXED") && selectedAssignment.questions && (
                    <div className="space-y-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-300">
                        Quiz Questions
                      </label>
                      {(() => {
                        try {
                          const questions = typeof selectedAssignment.questions === "string" 
                            ? JSON.parse(selectedAssignment.questions) 
                            : selectedAssignment.questions;
                          return questions.map((question: Record<string, unknown>, idx: number) => (
                        <div key={idx} className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                          <p className="text-xs font-bold text-[#2A2A28] dark:text-white">{idx + 1}. {String(question.question ?? "")}</p>
                          {(isChoiceQuestion(String(question.type ?? "")) ||
                            question.type === "TRUE_FALSE" ||
                            question.type === "SHORT_ANSWER") && (
                            <div className="mt-3">
                              <StudentChoiceInput
                                questionIndex={idx}
                                question={{
                                  id: String(question.id ?? idx),
                                  type: String(question.type ?? "SINGLE_CHOICE"),
                                  options: Array.isArray(question.options) ? (question.options as string[]) : [],
                                }}
                                value={answers[idx]}
                                onChange={(next) => setAnswers({ ...answers, [idx]: next })}
                              />
                            </div>
                          )}
                        </div>
                      ));
                        } catch (error) {
                          console.error("Error parsing questions:", error);
                          return <div className="text-red-600">Error loading questions</div>;
                        }
                      })()}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-[#E8622E] px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#d55321]"
                  >
                    <FaPaperPlane className="h-3.5 w-3.5" /> Submit Assignment
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-black/10 bg-[#F6F1E4] text-xs font-bold text-[#6B6558] dark:border-white/10 dark:bg-[#0D1B2A]">
              Select an assignment from the sidebar to view details and submit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
