import type { Metadata } from "next";
import RefundsContent from "components/pages/refunds-content";

export const metadata: Metadata = {
  title: "Refund & Returns",
  description: "BioSyncLabs refund and returns policy for RUO research products.",
  alternates: { canonical: "/refund-returns" },
};

export default function RefundReturnsPage() {
  return <RefundsContent />;
}
