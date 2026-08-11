import type { Metadata } from "next";
import ContactContent from "components/pages/contact-content";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with BioSyncLabs — Germany-based EU research peptide supplier. Email and contact form for orders, lab certificates, shipping and bulk inquiries.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
