/**
 * Thematic product groups for the desktop "Shop" mega-menu.
 *
 * The menu shows each group as a column with the ACTUAL products linked
 * underneath (handle → /product/<handle>). Products come live from Shopify
 * (passed in from the Navbar) and are bucketed here by handle/title keyword,
 * so the menu auto-updates as the catalogue changes — anything unmatched
 * falls into the last "essentials" column rather than disappearing.
 */

export type ShopGroupKey =
  | "healing"
  | "growth"
  | "weight"
  | "focusLongevity"
  | "aesthetics"
  | "anabolics";

/** Display order of the columns, left → right. Anabolics sit last, in their
 *  own column, separated from the research peptides. */
export const SHOP_GROUP_ORDER: ShopGroupKey[] = [
  "healing",
  "growth",
  "weight",
  "focusLongevity",
  "aesthetics",
  "anabolics",
];

export type ShopMenuProduct = {
  handle: string;
  title: string;
  available: boolean;
  /** True for anabolic-tagged products (steroids/PCT/AI) — routes them into
   *  their own "Anabolics & PCT" column instead of a peptide theme. */
  anabolic?: boolean;
};

/** Lower number = higher up within its column (popular items first). */
const WITHIN_GROUP_PRIORITY: { test: RegExp; rank: number }[] = [
  { test: /retatrutide/, rank: 0 },
  { test: /ghk/, rank: 1 },
  { test: /\bbpc/, rank: 2 },
  { test: /tb[-\s]?500/, rank: 3 },
  { test: /hgh|somatropin/, rank: 4 },
  { test: /mk[-\s]?677|ibutamoren/, rank: 5 },
];

function withinRank(h: string): number {
  const found = WITHIN_GROUP_PRIORITY.find((r) => r.test.test(h));
  return found ? found.rank : 50;
}

/**
 * Map a product to a thematic group by keyword. Order of checks matters —
 * more specific buckets first. Anything unmatched → "aesthetics" (the
 * catch-all "& more" column) so new products always show somewhere.
 */
export function classifyProduct(p: { handle: string; title: string }): ShopGroupKey {
  const h = `${p.handle} ${p.title}`.toLowerCase();

  // Accessories / essentials
  if (/water|bacteriostatic|syringe|needle|insulin|swab/.test(h)) {
    return "aesthetics";
  }
  // Weight & metabolism
  if (/retatrutide|tirzepatide|semaglutide|aod|tesamorelin|glp|mounjaro|wegovy/.test(h)) {
    return "weight";
  }
  // Aesthetics (tanning / libido / cosmetic)
  if (/melanotan|\bmt[-\s]?[12]\b|pt[-\s]?141|bremelanotide|glow|ghk|ahk/.test(h)) {
    // GHK-Cu is skin/cosmetic AND healing — keep it in healing (handled below),
    // so only route the tanning/libido ones here.
    if (/melanotan|\bmt[-\s]?[12]\b|pt[-\s]?141|bremelanotide|glow/.test(h)) {
      return "aesthetics";
    }
  }
  // Healing & regeneration
  if (/\bbpc|tb[-\s]?500|thymosin|kpv|ghk|ahk|copper/.test(h)) {
    return "healing";
  }
  // Focus, sleep & longevity
  if (/semax|selank|dsip|nad|epithalon|epitalon|mots|ss[-\s]?31|elamipretide|vip\b|pinealon/.test(h)) {
    return "focusLongevity";
  }
  // Growth & recovery (GH axis)
  if (/hgh|somatropin|mk[-\s]?677|ibutamoren|ipamorelin|ghrp|cjc|sermorelin|hexarelin|growth/.test(h)) {
    return "growth";
  }
  // Default
  return "aesthetics";
}

/** Group + sort a flat product list into the menu structure. */
export function groupShopProducts(
  products: ShopMenuProduct[],
): Record<ShopGroupKey, ShopMenuProduct[]> {
  const out: Record<ShopGroupKey, ShopMenuProduct[]> = {
    healing: [],
    growth: [],
    weight: [],
    focusLongevity: [],
    aesthetics: [],
    anabolics: [],
  };
  for (const p of products) {
    // Anabolics always go to their own column, regardless of name keywords.
    out[p.anabolic ? "anabolics" : classifyProduct(p)].push(p);
  }
  for (const key of SHOP_GROUP_ORDER) {
    out[key].sort((a, b) => {
      const r =
        withinRank(`${a.handle} ${a.title}`.toLowerCase()) -
        withinRank(`${b.handle} ${b.title}`.toLowerCase());
      return r !== 0 ? r : a.title.localeCompare(b.title);
    });
  }
  return out;
}
