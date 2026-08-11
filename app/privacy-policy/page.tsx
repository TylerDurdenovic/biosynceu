import type { Metadata } from "next";
import PrivacyContent from "components/pages/privacy-content";

export const metadata: Metadata = {
  title: "Privacy Policy & Disclaimer",
  description:
    "BioSyncLabs Privacy Policy and RUO Disclaimer — how we handle your data and important legal notices.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return <PrivacyContent />;
}
