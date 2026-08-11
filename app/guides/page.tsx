import Footer from "components/layout/footer";
import { GuidesPageContent } from "components/guides-page-content";
import { GUIDES } from "lib/guides-data";
import { baseUrl } from "lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Peptide Research Guides",
  description:
    "In-depth research guides on BPC-157, Retatrutide, GHK-Cu, TB-500 and more — plus a plain-language pen guide. Written for researchers and informed consumers in the EU.",
  alternates: {
    canonical: "/guides",
  },
  openGraph: {
    type: "website",
    url: `${baseUrl}/guides`,
    siteName: "BioSyncLabs",
    title: "Peptide Research Guides | BioSyncLabs",
    description:
      "Research guides on BPC-157, Retatrutide, GHK-Cu, TB-500, plus how-to guides for our injectable pens.",
  },
};

export default function GuidesPage() {
  // ItemList JSON-LD turns the guides index into a Google-eligible list of
  // articles, which can earn a multi-link sitelinks treatment in SERPs.
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: GUIDES.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${baseUrl}/guides/${g.slug}`,
      name: g.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <GuidesPageContent />
      <Footer />
    </>
  );
}
