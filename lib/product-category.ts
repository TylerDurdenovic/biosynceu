import { Product } from "lib/woocommerce/types";
import { isAnabolic } from "lib/departments";

/**
 * Lightweight, Shopify-config-free product categorisation used to:
 *  - decide what the storefront lists at all (see `isVialPeptide` below), and
 *  - group the default "All" listing so like items sit together instead of
 *    arriving in Shopify's raw (effectively random / alphabetical) order.
 *
 * Detection is keyword-based on the handle + title. It's intentionally simple
 * and predictable; if the catalogue grows a product these miss, just extend
 * the keyword lists.
 */

type Named = { handle: string; title: string };

const hay = (p: Named) => `${p.handle} ${p.title}`.toLowerCase();

/** Pre-filled injector pens (ship ready to use). `\bpen\b` avoids matching
 *  "open"/"happen"; dash-separated handles like "retatrutide-pen-30mg" hit it. */
export function isPen(p: Named): boolean {
  return /\bpen\b/.test(hay(p));
}

/** HGH / somatropin (191-AA). Held OFF the storefront Google sees — HGH is one
 *  of the most heavily policed substances on Google Ads, so it must not appear
 *  on the site we advertise (it lives on a separate domain instead). */
export function isHgh(p: Named): boolean {
  return /\bhgh\b|somatropin|191[\s-]?aa|hg-research/.test(hay(p));
}

/** Reconstitution / lab consumables that aren't a peptide vial. */
export function isAccessory(p: Named): boolean {
  const h = hay(p);
  return (
    h.includes("water") ||
    h.includes("bacteriostatic") ||
    h.includes("syringe") ||
    h.includes("needle") ||
    h.includes("insulin")
  );
}

/**
 * Explicit merchandising order for the default "All" view, requested by the
 * shop owner so the best-sellers sit up top and related items (MT-1 / MT-2)
 * sit together instead of being scattered alphabetically.
 *
 * The storefront lists vials only (see `isVialPeptide`), so pens, HGH and
 * anabolics never reach this list.
 *
 * Intended grid (4 per row):
 *   RETA        GHK-Cu       BPC-157      TB-500
 *   BPC ORAL    MT-1         MT-2         MK-677
 *   …then the remaining peptides, alphabetical.
 *
 * Each entry is a predicate against the lowercased "handle title" haystack.
 * The FIRST matching predicate fixes the product's rank, so more-specific
 * predicates (oral) must come before the bare-compound ones.
 */
const PRIORITY: ((h: string) => boolean)[] = [
  // Row 1 — flagship vials (exclude the oral variant here)
  (h) => /\bretatrutide\b/.test(h),
  (h) => /\bghk/.test(h),
  (h) => /\bbpc/.test(h) && !h.includes("oral"),
  (h) => /\btb[-\s]?500\b/.test(h),
  // Row 2 — oral, MT-1, MT-2, MK-677
  (h) => h.includes("bpc") && h.includes("oral"),
  (h) =>
    h.includes("melanotan-1") ||
    h.includes("melanotan-i") ||
    /\bmt[-\s]?1\b/.test(h),
  (h) =>
    h.includes("melanotan-2") ||
    h.includes("melanotan-ii") ||
    /\bmt[-\s]?2\b/.test(h),
  (h) => h.includes("mk-677") || h.includes("mk677") || h.includes("ibutamoren"),
];

function priorityRank(p: Product): number {
  const h = hay(p);
  const idx = PRIORITY.findIndex((pred) => pred(h));
  if (idx !== -1) return idx;
  // Unlisted peptides sit after the priority list, alphabetically among
  // themselves.
  return 1_000;
}

export function groupedAllOrder(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const r = priorityRank(a) - priorityRank(b);
    return r !== 0 ? r : a.title.localeCompare(b.title);
  });
}

/**
 * The storefront lists lyophilized peptide VIALS only.
 *
 * Pens, HGH, anabolics (steroids / PCT / AI) and lab accessories are filtered
 * out of EVERY product listing on the site — shop, nav mega-menu, search,
 * homepage rows, recommendations and sitemap.xml. They stay published in
 * WooCommerce and /product/<handle> still resolves for anyone holding a direct
 * link; they are simply never listed or linked from the storefront.
 *
 * Applied centrally in lib/woocommerce (getProducts / getCollectionProducts /
 * getProductRecommendations) so no listing surface can forget it.
 */
export function isVialPeptide(p: Named & { tags?: string[] }): boolean {
  return !isPen(p) && !isHgh(p) && !isAccessory(p) && !isAnabolic(p);
}
