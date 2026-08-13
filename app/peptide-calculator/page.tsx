import Footer from "components/layout/footer";
import PeptideCalculatorContent from "components/pages/peptide-calculator-content";
import { baseUrl } from "lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Peptide Reconstitution Calculator",
  description:
    "Free peptide reconstitution calculator — enter your syringe size, vial mg, bacteriostatic water volume and target dose to get the exact insulin-syringe units to draw. For laboratory research use only.",
  alternates: { canonical: "/peptide-calculator" },
  openGraph: {
    title: "Peptide Reconstitution Calculator | BioSyncLabs",
    description:
      "Enter syringe size, vial mg, BAC water and dose — get the exact units to draw.",
    url: `${baseUrl}/peptide-calculator`,
  },
};

export default function PeptideCalculatorPage() {
  return (
    <>
      <PeptideCalculatorContent />
      <Footer />
    </>
  );
}
