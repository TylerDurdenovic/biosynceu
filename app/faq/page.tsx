import FaqContent from "components/pages/faq-content";
import { translations } from "lib/i18n/translations";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions",
  description:
    "Frequently asked questions about BioSyncLabs research peptides — ordering, shipping across the EU, payment, lab certificates and RUO compliance.",
  alternates: {
    canonical: "/faq",
  },
};

export default function FaqPage() {
  // FAQPage structured data — eligible for the FAQ rich result on Google,
  // which expands answers directly under the search listing. Reads the
  // canonical English copy because Google indexes the EN version.
  const faqItems = translations.en.faq.items;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FaqContent />
    </>
  );
}
