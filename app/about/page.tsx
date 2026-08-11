import type { Metadata } from "next";
import AboutContent from "components/pages/about-content";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about BioSyncLabs — our mission, European quality standards, and unwavering commitment to research integrity.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
