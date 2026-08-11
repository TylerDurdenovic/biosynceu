import { Product } from "lib/woocommerce/types";

/**
 * Lightweight, Shopify-config-free product categorisation used to:
 *  - power the synthetic "Pens" filter on the shop page + nav, and
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
 * shop owner so the best-sellers sit up top and related items (MT-1 / MT-2,
 * the pens) sit together instead of being scattered alphabetically.
 *
 * Intended grid (4 per row):
 *   RETA        GHK-Cu       BPC-157      TB-500
 *   RETA PEN    GHK-Cu PEN   BPC ORAL     BPC/TB PEN
 *   HGH         MT-1         MT-2         MK-677
 *   …then the remaining peptides (alphabetical), BAC water + syringes last.
 *
 * Each entry is a predicate against the lowercased "handle title" haystack.
 * The FIRST matching predicate fixes the product's rank, so more-specific
 * predicates (pens, oral) must come before the bare-compound ones.
 */
const PRIORITY: ((h: string) => boolean)[] = [
  // Row 1 — flagship vials (exclude their pen/oral variants here)
  (h) => /\bretatrutide\b/.test(h) && !h.includes("pen"),
  (h) => /\bghk/.test(h) && !h.includes("pen"),
  (h) => /\bbpc/.test(h) && !h.includes("pen") && !h.includes("oral"),
  (h) => /\btb[-\s]?500\b/.test(h) && !h.includes("pen"),
  // Row 2 — pens + oral
  (h) => h.includes("retatrutide") && h.includes("pen"),
  (h) => h.includes("ghk") && h.includes("pen"),
  (h) => h.includes("bpc") && h.includes("oral"),
  (h) => (h.includes("bpc") || h.includes("tb")) && h.includes("pen"),
  // Row 3 — HGH, MT-1, MT-2, MK-677
  (h) => h.includes("hgh") || h.includes("somatropin"),
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
  // Accessories always last, regardless of any keyword coincidence.
  if (isAccessory(p)) return 10_000;
  const idx = PRIORITY.findIndex((pred) => pred(h));
  if (idx !== -1) return idx;
  // Unlisted peptides sit in the middle band (after the priority list,
  // before accessories), alphabetically among themselves.
  return 1_000;
}

export function groupedAllOrder(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const r = priorityRank(a) - priorityRank(b);
    return r !== 0 ? r : a.title.localeCompare(b.title);
  });
}
