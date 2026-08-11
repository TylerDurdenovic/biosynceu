import Footer from "components/layout/footer";
import { TrackForm } from "components/track-form";
import { TrackPageShell } from "components/track-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track your order | BioSyncLabs",
  description: "Look up your BioSyncLabs orders with your email address.",
  // Personal-data utility — not search-relevant, keep out of the index.
  robots: { index: false, follow: false },
};

export default function TrackPage() {
  return (
    <>
      <div className="min-h-[70vh] bg-slate-50 px-4 py-14 lg:px-8">
        <div className="mx-auto max-w-lg">
          <TrackPageShell>
            <TrackForm />
          </TrackPageShell>
        </div>
      </div>
      <Footer />
    </>
  );
}
