import LabResultsContent from "components/pages/lab-results-content";
import { getCoaList } from "lib/coa-files";
import { baseUrl } from "lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lab Results — Certificates of Analysis (HPLC ≥99% Purity)",
  description:
    "Independent HPLC and LC-MS Certificates of Analysis for every BioSyncLabs research compound. Verify purity, lot numbers and structural identity directly.",
  alternates: {
    canonical: "/lab-results",
  },
  openGraph: {
    type: "website",
    url: `${baseUrl}/lab-results`,
    siteName: "BioSyncLabs",
    title: "Lab Results — Certificates of Analysis | BioSyncLabs",
    description:
      "Independent HPLC / LC-MS Certificates of Analysis for every batch. ≥99% purity, third-party verified.",
  },
};

export default function LabResultsPage() {
  // Exactly one entry per PDF actually present in /public/COAS.
  const coaList = getCoaList();

  // ItemList JSON-LD — turns the CoA library into a Google-eligible list of
  // documents so it can earn a richer SERP treatment.
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Certificates of Analysis",
    itemListElement: coaList.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${c.product} — Certificate of Analysis`,
      url: `${baseUrl}${c.file.split("?")[0]}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <LabResultsContent items={coaList} />
    </>
  );
}
