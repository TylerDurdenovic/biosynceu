import type { Product } from "lib/woocommerce/types";

/**
 * Tags (lowercased) that mark a product as an anabolic compound
 * (steroids / injectables / PCT / AI). The anabolics section was removed from
 * the storefront, so any product carrying one of these tags is EXCLUDED from
 * the catalogue — it stays in Shopify but never shows on the site.
 */
export const ANABOLIC_TAGS = ["injectables", "steroids", "pct", "ai"] as const;

/** True when a product carries ANY anabolic tag (exact, case-insensitive). */
export function isAnabolic(product: Pick<Product, "tags">): boolean {
  const tags = (product.tags ?? []).map((t) => t.toLowerCase());
  return ANABOLIC_TAGS.some((t) => tags.includes(t));
}
