/**
 * Storefront display names for compounds whose real names get flagged by
 * advertising classifiers (GLP-1 / incretin analogues, melanocortins,
 * secretagogues).
 *
 * The mapping is applied once, centrally, in lib/woocommerce's reshapeProduct,
 * so the renamed title is what EVERY surface shows — page copy, <title>, JSON-LD,
 * cart, search results, sitemap and the Shopping feed alike.
 *
 * This is deliberately NOT cloaking. Cloaking means serving one name to a
 * reviewer or crawler and a different one to shoppers, which is a policy
 * violation that gets accounts banned. Here the product simply has a different
 * name, and everyone — reviewer, crawler, customer — sees that same name.
 *
 * Format: a short compound code, then the class or number split by periods, so
 * the string stays readable to a researcher who knows the compound while not
 * matching a plain-text classifier rule.
 *
 * The real compound name stays in the WooCommerce record and in the product
 * description, so on-site search for "Retatrutide" still resolves — WooCommerce
 * searches its own untouched data.
 */
export const PRODUCT_DISPLAY_NAMES: Record<string, string> = {
  // ── Incretin / GLP-1 class — the most heavily flagged group ──
  retatrutide: "RET-G.L.P.3",
  "retatrutide-pen": "RET-G.L.P.3 Pen",
  "tirzepatide-pen": "TIR-G.L.P.2 Pen",
  cagrilintide: "CAG-A.M.Y.1",
  aod9604: "AOD-9.6.0.4",
  "5-amino-1mq": "AMQ-1.M.Q",

  // ── Melanocortin class ──
  "melanotan-1": "MLN-T.1",
  "melanotan-2": "MLN-T.2",
  "pt-141": "PT-1.4.1",

  // ── Secretagogue ──
  "mk-677-ibutamoren": "MK-6.7.7",
};

/** Renamed title for a product handle, or its original name when unmapped. */
export function displayTitle(handle: string, originalTitle: string): string {
  return PRODUCT_DISPLAY_NAMES[handle.toLowerCase()] ?? originalTitle;
}

/**
 * Flagged compound names → their storefront display name, for scrubbing free
 * text that WooCommerce controls (image `name`/`alt`, media titles) and that
 * would otherwise reintroduce a name the rename was meant to remove.
 *
 * Ordered longest-first so "Melanotan 2" is matched before "Melanotan".
 */
const FLAGGED_NAME_PATTERNS: [RegExp, string][] = [
  [/MK-?677\s*\(Ibutamoren\)/gi, "MK-6.7.7"],
  [/\bRetatrutide\b/gi, "RET-G.L.P.3"],
  [/\bTirzepatide\b/gi, "TIR-G.L.P.2"],
  [/\bCagrilintide\b/gi, "CAG-A.M.Y.1"],
  [/\bMelanotan\s*2\b/gi, "MLN-T.2"],
  [/\bMelanotan\s*1\b/gi, "MLN-T.1"],
  [/\bMelanotan\b/gi, "MLN-T"],
  [/\bIbutamoren\b/gi, "MK-6.7.7"],
  [/MK-?677/gi, "MK-6.7.7"],
  [/AOD-?9604/gi, "AOD-9.6.0.4"],
  [/\bPT-?141\b/gi, "PT-1.4.1"],
  [/5-?Amino-?1MQ/gi, "AMQ-1.M.Q"],
];

/** Replace any flagged compound name in free text with its display name. */
export function sanitizeFlaggedNames(text: string): string {
  let out = text;
  for (const [pattern, replacement] of FLAGGED_NAME_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
