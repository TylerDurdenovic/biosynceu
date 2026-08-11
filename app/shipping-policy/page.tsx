import type { Metadata } from "next";
import ShippingContent from "components/pages/shipping-content";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "BioSyncLabs shipping information for RUO research compounds — timelines, carriers, and international orders.",
  alternates: { canonical: "/shipping-policy" },
};

export default function ShippingPolicyPage() {
  return <ShippingContent />;
}
