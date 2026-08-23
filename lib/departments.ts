import type { Product } from "lib/woocommerce/types";

/**
 * Markers that identify an anabolic compound (steroids / injectables / PCT /
 * AI). Anabolics are excluded from the storefront entirely — they stay in
 * WooCommerce but never appear in a listing.
 *
 * BOTH tags and categories are checked. The live catalogue organises purely by
 * WooCommerce *category* and carries no tags at all, so a tag-only check
 * silently matched nothing; the tag list is kept so products tagged in future
 * are still caught.
 */
export const ANABOLIC_TAGS = ["injectables", "steroids", "pct", "ai"] as const;

/** WooCommerce category slugs that mark a product as anabolic. */
export const ANABOLIC_CATEGORIES = [
  "anabolics",
  "steroids",
  "injectables",
  "pct",
] as const;

type Departmented = {
  tags?: Product["tags"];
  categories?: Product["categories"];
};

/** True when a product carries ANY anabolic tag or category. */
export function isAnabolic(product: Departmented): boolean {
  const tags = (product.tags ?? []).map((t) => t.toLowerCase());
  const cats = (product.categories ?? []).map((c) => c.toLowerCase());
  return (
    ANABOLIC_TAGS.some((t) => tags.includes(t)) ||
    ANABOLIC_CATEGORIES.some((c) => cats.includes(c))
  );
}
