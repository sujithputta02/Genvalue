"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCircleCheck,
  FaPlus,
  FaTrash,
  FaXmark,
} from "react-icons/fa6";
import {
  createPlannerEvent,
  deletePlannerEvent,
  fetchPlannerEvents,
  fetchPlannerInsights,
  updatePlannerEvent,
} from "@/services/studentPlannerService";
import type { PlannerCategory, PlannerEvent, PlannerInsights } from "@/types/studentPlanner";
import {
  PLANNER_CATEGORY_COLORS,
  PLANNER_CATEGORY_LABELS,
} from "@/types/studentPlanner";

const CATEGORIES = Object.keys(PLANNER_CATEGORY_LABELS) as PlannerCategory[];
const WEEK_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function buildCalendarCells(month: Date) {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

interface StudentPlannerPanelProps {
  onDataChange?: () => void;
}

export function StudentPlannerPanel({ onDataChange }: StudentPlannerPanelProps) {
  const reduceMotion = useReducedMotion();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [insights, setInsights] = useState<PlannerInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PlannerCategory>("STUDY");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rangeStart = startOfMonth(month);
      const rangeEnd = endOfMonth(month);
      const [eventList, insightData] = await Promise.all([
        fetchPlannerEvents(rangeStart.toISOString(), rangeEnd.toISOString()),
        fetchPlannerInsights(),
      ]);
      setEvents(eventList);
      setInsights(insightData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load planner");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const cells = useMemo(() => buildCalendarCells(month), [month]);
  const selectedKey = toDateKey(selectedDate);
  const todayKey = toDateKey(new Date());

  const eventsByDate = useMemo(() => {
    const map = new Map<string, PlannerEvent[]>();
    for (const event of events) {
      const key = toDateKey(new Date(event.scheduledAt));
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const selectedEvents = eventsByDate.get(selectedKey) ?? [];

  const openCreateModal = () => {
    setTitle("");
    setDescription("");
    setCategory("STUDY");
    setStartTime("09:00");
    setEndTime("10:00");
    setModalOpen(true);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const start = new Date(selectedDate);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(eh, em, 0, 0);

      await createPlannerEvent({
        title,
        description: description || undefined,
        category,
        scheduledAt: start.toISOString(),
        endAt: end.toISOString(),
      });

      setModalOpen(false);
      await loadData();
      onDataChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save plan");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleComplete = async (event: PlannerEvent) => {
    try {
      await updatePlannerEvent(event.id, { completed: !event.completed });
      await loadData();
      onDataChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update plan");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlannerEvent(id);
      await loadData();
      onDataChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete plan");
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-base font-medium text-[#2A2A28] outline-none focus:border-[#1E3FE0] dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#60A5FA] sm:text-sm";

  const eventSummary =
    selectedEvents.length === 0
      ? "No plans today"
      : `${selectedEvents.length} plan${selectedEvents.length === 1 ? "" : "s"} scheduled`;

  return (
    <>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        {/* Compact calendar widget */}
        <div
          className="mx-auto w-full max-w-md shrink-0 overflow-hidden rounded-[1.75rem] border border-black/10 bg-[#0D1B2A] shadow-xl dark:border-white/10 sm:max-w-[340px] xl:mx-0"
          aria-label="Study planner calendar widget"
        >
          <div className="flex min-h-0 flex-col sm:min-h-[200px] sm:flex-row">
            {/* Selected day hero — horizontal on phone, side column on wider */}
            <div className="flex w-full flex-row items-end justify-between gap-3 border-b border-white/10 p-4 sm:w-[38%] sm:flex-col sm:items-stretch sm:justify-between sm:border-b-0 sm:border-r">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8622E]">
                  {selectedDate.toLocaleDateString(undefined, { weekday: "long" })}
                </p>
                <p className="font-display-custom mt-1 text-4xl font-light leading-none text-white sm:text-5xl">
                  {selectedDate.getDate()}
                </p>
              </div>
              <p className="max-w-[45%] text-right text-[11px] font-medium text-white/45 sm:max-w-none sm:text-left">
                {eventSummary}
              </p>
            </div>

            {/* Mini month grid */}
            <div className="flex flex-1 flex-col p-3 sm:p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E8622E]">
                  {month.toLocaleString(undefined, { month: "long" })}
                </p>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
                    }
                    aria-label="Previous month"
                    className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white sm:p-1"
                  >
                    <FaChevronLeft className="h-2.5 w-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
                    }
                    aria-label="Next month"
                    className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white sm:p-1"
                  >
                    <FaChevronRight className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-0.5 text-center sm:gap-0.5">
                {WEEK_HEADERS.map((label, index) => (
                  <span
                    key={`${label}-${index}`}
                    className="text-[9px] font-semibold text-white/35"
                    aria-hidden="true"
                  >
                    {label}
                  </span>
                ))}
                {cells.map((cell, index) => {
                  if (!cell) {
                    return <span key={`e-${index}`} className="h-7 sm:h-6" aria-hidden="true" />;
                  }

                  const key = toDateKey(cell);
                  const hasEvents = (eventsByDate.get(key)?.length ?? 0) > 0;
                  const isSelected = key === selectedKey;
                  const isToday = key === todayKey;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDate(cell)}
                      aria-label={`${cell.toLocaleDateString()}${hasEvents ? ", has plans" : ""}`}
                      aria-pressed={isSelected}
                      className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium transition sm:h-6 sm:w-6 ${
                        isSelected
                          ? "bg-[#E8622E] text-white"
                          : isToday
                            ? "text-white ring-1 ring-[#E8622E]/60"
                            : "text-white/55 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {cell.getDate()}
                      {hasEvents && !isSelected ? (
                        <span
                          className="absolute bottom-0.5 h-0.5 w-0.5 rounded-full bg-[#10B981]"
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Day plans + insights */}
        <div className="min-w-0 flex-1 space-y-4">
          {insights ? (
            <div className="flex flex-wrap gap-2">
              <InsightChip label="Week done" value={`${insights.weekCompleted}/${insights.weekPlanned}`} />
              <InsightChip label="Week rate" value={`${insights.weekCompletionRate}%`} />
              <InsightChip label="Streak" value={`${insights.currentStreak}d`} />
              <InsightChip
                label="Focus"
                value={
                  insights.topCategory ? PLANNER_CATEGORY_LABELS[insights.topCategory] : "—"
                }
              />
            </div>
          ) : null}

          <div className="rounded-2xl border border-black/10 bg-[#F6F1E4] p-4 shadow-lg dark:border-white/10 dark:bg-[#0D1B2A]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#2A2A28] dark:text-white">
                {selectedDate.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </h3>
              <button
                type="button"
                onClick={openCreateModal}
                aria-label="Add plan for selected day"
                className="inline-flex h-8 items-center gap-1 rounded-full bg-[#1E3FE0] px-3 text-[10px] font-bold uppercase tracking-wider text-white dark:bg-[#60A5FA] dark:text-[#070B19]"
              >
                <FaPlus className="h-3 w-3" aria-hidden />
                Add
              </button>
            </div>

            {loading ? (
              <p className="mt-3 text-xs text-[#6B6558] dark:text-slate-400">Loading…</p>
            ) : selectedEvents.length === 0 ? (
              <p className="mt-3 text-xs font-medium text-[#6B6558] dark:text-slate-400">
                No plans yet — tap Add to schedule study time.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {selectedEvents.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center gap-2 rounded-xl border border-black/8 bg-white/60 px-3 py-2 dark:border-white/10 dark:bg-white/5"
                  >
                    <button
                      type="button"
                      onClick={() => void toggleComplete(event)}
                      aria-label={event.completed ? "Mark incomplete" : "Mark complete"}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        event.completed
                          ? "border-[#10B981] bg-[#10B981] text-white"
                          : "border-black/15 dark:border-white/20"
                      }`}
                    >
                      {event.completed ? <FaCircleCheck className="h-2.5 w-2.5" /> : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs font-bold ${event.completed ? "text-[#6B6558] line-through" : "text-[#2A2A28] dark:text-white"}`}
                      >
                        {event.title}
                      </p>
                      <p className="text-[10px] text-[#6B6558] dark:text-slate-400">
                        {new Date(event.scheduledAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" · "}
                        {PLANNER_CATEGORY_LABELS[event.category]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDelete(event.id)}
                      aria-label={`Delete ${event.title}`}
                      className="shrink-0 rounded-full p-1 text-red-500 hover:bg-red-500/10"
                    >
                      <FaTrash className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <div
          className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <AnimatePresence>
        {modalOpen ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => !submitting && setModalOpen(false)}
            role="presentation"
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-black/10 bg-[#F6F1E4] p-5 shadow-2xl dark:border-white/10 dark:bg-[#0D1B2A] sm:rounded-3xl sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="planner-modal-title"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-annotation text-[10px] font-bold uppercase tracking-widest text-[#1E3FE0] dark:text-[#60A5FA]">
                    New plan
                  </span>
                  <h2
                    id="planner-modal-title"
                    className="font-display-custom text-lg font-extrabold text-[#2A2A28] dark:text-white"
                  >
                    {selectedDate.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  aria-label="Close planner form"
                  className="rounded-full p-2 text-[#6B6558] hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <FaXmark className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={(e) => void handleCreate(e)} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="plan-title"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B6558]"
                  >
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="plan-title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Week 2 — Prompting practice"
                    className={inputClass}
                    aria-label="Plan title"
                  />
                </div>

                <div>
                  <label
                    htmlFor="plan-category"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B6558]"
                  >
                    Category
                  </label>
                  <select
                    id="plan-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PlannerCategory)}
                    className={inputClass}
                    aria-label="Plan category"
                  >
                    {CATEGORIES.map((key) => (
                      <option key={key} value={key}>
                        {PLANNER_CATEGORY_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="plan-start"
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B6558]"
                    >
                      Start
                    </label>
                    <input
                      id="plan-start"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={inputClass}
                      aria-label="Start time"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="plan-end"
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B6558]"
                    >
                      End
                    </label>
                    <input
                      id="plan-end"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={inputClass}
                      aria-label="End time"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="plan-desc"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#6B6558]"
                  >
                    Notes (optional)
                  </label>
                  <textarea
                    id="plan-desc"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What will you cover?"
                    className={`${inputClass} resize-y`}
                    aria-label="Plan notes"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  aria-label="Save plan"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#1E3FE0] text-sm font-bold text-white disabled:opacity-50 dark:bg-[#60A5FA] dark:text-[#070B19]"
                >
                  {submitting ? "Saving…" : "Save to calendar"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function InsightChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">
      <span className="text-[9px] font-bold uppercase tracking-wider text-[#6B6558] dark:text-slate-400">
        {label}
      </span>
      <span className="ml-2 text-xs font-extrabold text-[#2A2A28] dark:text-white">{value}</span>
    </div>
  );
}
