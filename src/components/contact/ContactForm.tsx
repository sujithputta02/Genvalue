"use client";

import { contactFormSchema, COURSE_INTEREST_OPTIONS, type ContactFormValues } from "@/lib/contact-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-white motion-reduce:animate-none"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function fieldErrorClass(hasError: boolean) {
  return hasError
    ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
    : "border-black/10 focus:border-[#1E3FE0] focus:ring-[#1E3FE0]/20 dark:border-white/10 dark:focus:border-[#60A5FA]";
}

export function ContactForm() {
  const [toastOpen, setToastOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitHint, setSubmitHint] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      courseInterest: "AI Tools Mastery",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setSubmitError(null);
    setSubmitHint(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        hint?: string;
      };
      if (!res.ok) {
        setSubmitError(
          typeof payload.error === "string" && payload.error.length > 0
            ? payload.error
            : "Something went wrong. Please try again.",
        );
        setSubmitHint(typeof payload.hint === "string" ? payload.hint : null);
        return;
      }
      reset();
      setToastOpen(true);
      window.setTimeout(() => setToastOpen(false), 5000);
    } catch {
      setSubmitError("Network error. Check your connection and try again.");
    }
  };

  return (
    <>
      <div
        id="contact-form"
        className="scroll-mt-24 rounded-3xl border border-black/10 bg-[#F6F1E4] p-5 shadow-2xl dark:border-white/10 dark:bg-[#0D1B2A] sm:p-8 lg:p-10"
        aria-labelledby="contact-form-heading"
      >
        <span className="font-annotation text-xs font-bold uppercase tracking-widest text-[#E8622E]">
          ★ DIRECT MESSAGE
        </span>
        <h2 id="contact-form-heading" className="font-display-custom mt-1 text-2xl font-extrabold text-[#2A2A28] dark:text-white sm:text-3xl">
          Send a Message
        </h2>
        <p className="mt-1 text-xs font-medium text-[#6B6558] dark:text-slate-400">
          Fields marked <span className="font-bold text-[#E8622E]">*</span> are required.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider text-[#2A2A28] dark:text-slate-300">
              Full Name <span className="text-[#E8622E]">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-sm font-medium text-[#2A2A28] placeholder:text-[#6B6558]/50 focus:outline-none focus:ring-2 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 ${fieldErrorClass(!!errors.fullName)}`}
              placeholder="Jane Doe"
              {...register("fullName")}
            />
            {errors.fullName ? (
              <p className="mt-1 text-xs font-bold text-red-500" role="alert">
                {errors.fullName.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#2A2A28] dark:text-slate-300">
              Work Email <span className="text-[#E8622E]">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-sm font-medium text-[#2A2A28] placeholder:text-[#6B6558]/50 focus:outline-none focus:ring-2 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 ${fieldErrorClass(!!errors.email)}`}
              placeholder="you@company.com"
              {...register("email")}
            />
            {errors.email ? (
              <p className="mt-1 text-xs font-bold text-red-500" role="alert">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-[#2A2A28] dark:text-slate-300">
              Phone <span className="text-[#6B6558] dark:text-slate-500">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-sm font-medium text-[#2A2A28] placeholder:text-[#6B6558]/50 focus:outline-none focus:ring-2 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 ${fieldErrorClass(!!errors.phone)}`}
              placeholder="+1 (555) 000-0000"
              {...register("phone")}
            />
            {errors.phone ? (
              <p className="mt-1 text-xs font-bold text-red-500" role="alert">
                {errors.phone.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="courseInterest" className="block text-xs font-bold uppercase tracking-wider text-[#2A2A28] dark:text-slate-300">
              Course Interest <span className="text-[#E8622E]">*</span>
            </label>
            <select
              id="courseInterest"
              className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-sm font-bold text-[#2A2A28] focus:outline-none focus:ring-2 dark:bg-[#070B19] dark:text-white ${fieldErrorClass(!!errors.courseInterest)}`}
              {...register("courseInterest")}
            >
              {COURSE_INTEREST_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.courseInterest ? (
              <p className="mt-1 text-xs font-bold text-red-500" role="alert">
                {errors.courseInterest.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-[#2A2A28] dark:text-slate-300">
              Message <span className="text-[#E8622E]">*</span>
            </label>
            <textarea
              id="message"
              rows={4}
              className={`mt-1.5 w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm font-medium text-[#2A2A28] placeholder:text-[#6B6558]/50 focus:outline-none focus:ring-2 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 ${fieldErrorClass(!!errors.message)}`}
              placeholder="Tell us about your goals, timeline, or team requirements."
              {...register("message")}
            />
            {errors.message ? (
              <p className="mt-1 text-xs font-bold text-red-500" role="alert">
                {errors.message.message}
              </p>
            ) : null}
          </div>

          {submitError ? (
            <div
              className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-bold text-red-600 dark:text-red-400"
              role="alert"
            >
              <p>{submitError}</p>
              {submitHint ? <p className="mt-1 text-[11px] opacity-90">{submitHint}</p> : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            aria-label={isSubmitting ? "Submitting message" : "Submit message"}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#E8622E] px-6 text-sm font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#d55321] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Spinner />
                Sending Message…
              </>
            ) : (
              "Submit Message"
            )}
          </button>
        </form>
      </div>

      {toastOpen ? (
        <div
          className="fixed bottom-6 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-full border border-[#10B981] bg-[#12266E] px-6 py-3 text-center text-xs font-bold text-white shadow-2xl sm:bottom-8"
          role="status"
          aria-live="polite"
        >
          ✓ Thanks! We&apos;ll reply within 24 hours.
        </div>
      ) : null}
    </>
  );
}
