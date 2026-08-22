import Footer from "components/layout/footer";
import PenCalculatorContent from "components/pages/pen-calculator-content";
import { baseUrl } from "lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pen Click Calculator",
  description:
    "Free peptide pen click calculator — turn a target dose into the exact number of pen clicks, or convert a vial reconstitution into syringe units. For laboratory research use only.",
  alternates: { canonical: "/pen-calculator" },
  openGraph: {
    title: "Pen Click Calculator | BioSyncLabs",
    description: "Turn a target dose into the exact number of pen clicks.",
    url: `${baseUrl}/pen-calculator`,
  },
};

export default function PenCalculatorPage() {
  return (
    <>
      <PenCalculatorContent />
      <Footer />
    </>
  );
}
