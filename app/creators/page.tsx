import { CreatorLinkGenerator } from "components/pages/creator-link-generator";
import { getProducts } from "lib/woocommerce";
import { baseUrl } from "lib/utils";
import type { Metadata } from "next";

// Internal merchant tool — keep it out of search results and the sitemap.
export const metadata: Metadata = {
  title: "Creator Referral Links",
  robots: { index: false, follow: false },
};

export default async function CreatorsPage() {
  const products = await getProducts({ sortKey: "TITLE" }).catch(() => []);
  const items = products.map((p) => ({ handle: p.handle, title: p.title }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <CreatorLinkGenerator products={items} baseUrl={baseUrl} />
    </main>
  );
}
