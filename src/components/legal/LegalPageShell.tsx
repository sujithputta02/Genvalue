import Link from "next/link";
import type { ReactNode } from "react";

type LegalPageShellProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly updatedLabel: string;
  readonly children: ReactNode;
};

/**
 * Shared marketing-branded chrome for Privacy Policy and Terms of Service.
 * Tokens align with the hero: paper cream, ink, brand blue, orange annotation.
 */
export function LegalPageShell({
  eyebrow,
  title,
  updatedLabel,
  children,
}: LegalPageShellProps) {
  return (
    <div className="bg-paper-grid relative min-h-[70vh] text-[#2A2A28] dark:text-slate-200">
      <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="rounded-3xl border border-black/10 bg-[#F6F1E4] p-8 shadow-2xl dark:border-white/10 dark:bg-[#0D1B2A] sm:p-10 lg:p-12">
          <span className="font-annotation inline-block -rotate-1 text-xs font-bold uppercase tracking-widest text-[#E8622E]">
            {eyebrow}
          </span>
          <h1 className="font-display-custom mt-3 text-balance text-4xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-sm font-medium leading-relaxed text-[#6B6558] dark:text-slate-400">
            {updatedLabel}
          </p>

          <div className="mt-8 h-px w-full bg-gradient-to-r from-[#E8622E]/60 via-[#1E3FE0]/25 to-transparent" aria-hidden="true" />

          <div className="legal-prose mt-8 space-y-6 text-base font-medium leading-relaxed text-[#6B6558] dark:text-slate-300">
            {children}
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-black/10 pt-8 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold">
              <Link
                href="/privacy-policy"
                className="text-[#1E3FE0] transition hover:text-[#12266E] dark:text-[#60A5FA] dark:hover:text-white"
              >
                Privacy Policy
              </Link>
              <span className="text-[#6B6558]/50 dark:text-slate-600" aria-hidden>
                ·
              </span>
              <Link
                href="/terms-of-service"
                className="text-[#1E3FE0] transition hover:text-[#12266E] dark:text-[#60A5FA] dark:hover:text-white"
              >
                Terms of Service
              </Link>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border-2 border-[#2A2A28] bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#2A2A28] transition hover:bg-[#2A2A28]/5 dark:border-white dark:text-white dark:hover:bg-white/10"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

type LegalHeadingProps = {
  readonly children: ReactNode;
  readonly id?: string;
};

export function LegalHeading({ children, id }: LegalHeadingProps) {
  return (
    <h2
      id={id}
      className="font-display-custom pt-2 text-xl font-extrabold tracking-tight text-[#2A2A28] dark:text-white sm:text-2xl"
    >
      {children}
    </h2>
  );
}

type LegalLinkProps = {
  readonly href: string;
  readonly children: ReactNode;
};

export function LegalMailLink({ href, children }: LegalLinkProps) {
  return (
    <a
      href={href}
      className="font-bold text-[#1E3FE0] underline decoration-[#1E3FE0]/35 underline-offset-2 transition hover:decoration-[#1E3FE0] dark:text-[#60A5FA] dark:decoration-[#60A5FA]/40"
    >
      {children}
    </a>
  );
}
