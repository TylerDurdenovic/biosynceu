import Footer from "components/layout/footer";
import { WishlistPageContent } from "components/wishlist-page-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Wishlist | BioSyncLabs",
  description: "Your saved research compounds",
  // User-specific page — has no SEO value and should never be indexed.
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return (
    <>
      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
        <WishlistPageContent />
      </div>
      <Footer />
    </>
  );
}
