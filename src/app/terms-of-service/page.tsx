import type { Metadata } from "next";
import { LegalMailLink, LegalPageShell } from "@/components/legal/LegalPageShell";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/terms-of-service",
    title: "Terms of Service | GenValue",
    description: "Terms that govern use of the GenValue website and programs.",
    ogTitle: "Terms of Service | GenValue",
  });
}

export default function TermsOfServicePage() {
  return (
    <LegalPageShell
      eyebrow="★ Legal · Fair Use"
      title="Terms of Service"
      updatedLabel="Last updated: May 2026. Replace with counsel-reviewed terms before formal reliance."
    >
      <p>
        By accessing this website or enrolling in GenValue programs, you agree to use our services lawfully and to
        provide accurate information when you contact us or register.
      </p>
      <p>
        Course content, schedules, and pricing may change; we will communicate material updates through reasonable
        channels. Intellectual property in materials remains with GenValue and licensors unless stated otherwise.
      </p>
      <p>
        For questions about these terms, email{" "}
        <LegalMailLink href="mailto:genvalue.academy@gmail.com">genvalue.academy@gmail.com</LegalMailLink>.
      </p>
    </LegalPageShell>
  );
}
