import type { Metadata } from "next";
import TermsContent from "components/pages/terms-content";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "BioSyncLabs Terms of Service — RUO Products Only.",
  alternates: { canonical: "/terms-of-service" },
};

export default function TermsOfServicePage() {
  return <TermsContent />;
}
