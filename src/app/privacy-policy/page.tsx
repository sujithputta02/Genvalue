import type { Metadata } from "next";
import { LegalHeading, LegalMailLink, LegalPageShell } from "@/components/legal/LegalPageShell";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/privacy-policy",
    title: "Privacy Policy | GenValue",
    description: "How GenValue handles personal information when you use our site and programs.",
    ogTitle: "Privacy Policy | GenValue",
  });
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="★ Legal · Transparency"
      title="Privacy Policy"
      updatedLabel="Last updated: May 2026. This summary is provided for transparency; replace with counsel-reviewed copy before formal legal reliance."
    >
      <p>
        GenValue respects your privacy. When you use our contact form or enroll in programs, we collect only the
        information you provide (such as name, email, phone, and message) to respond to inquiries and operate our
        services.
      </p>

      <LegalHeading>Cookies, cache &amp; local storage</LegalHeading>
      <p>
        Like any website, your browser may keep <strong className="font-bold text-[#2A2A28] dark:text-white">temporary cache files</strong>{" "}
        (e.g. images, scripts) to load pages faster. We do not use that cache to identify you — it is normal browser
        behavior, not a paid tracking product.
      </p>
      <p>
        We also store a <strong className="font-bold text-[#2A2A28] dark:text-white">single site preference</strong> in
        your browser (e.g. local storage) so the &quot;Cookies &amp; privacy&quot; notice can stay dismissed after you
        accept or dismiss it. We are not using a commercial cookie-consent or analytics platform; the notice is provided
        as a simple formality and record of what we do today.
      </p>
      <p>
        We use trusted providers (such as email delivery services) to send correspondence; those providers process data
        according to their terms and applicable law. We do not sell your personal information.
      </p>
      <p>
        For questions or requests regarding your data, contact us at{" "}
        <LegalMailLink href="mailto:genvalue.academy@gmail.com">genvalue.academy@gmail.com</LegalMailLink>.
      </p>
    </LegalPageShell>
  );
}
