/**
 * Server- and client-safe helpers for building responsive Shopify CDN image
 * URLs.
 *
 * Shopify's CDN supports native resizing via the `?width=N` query param and
 * automatically serves WebP / AVIF based on the `Accept` header — so by
 * appending the right size we cut payload by ~10× without going through
 * Next's image optimizer (which is disabled in next.config.ts because we
 * use Turbopack).
 */

const DEFAULT_QUALITY = 80;

/** Default candidate widths for product card srcsets (covers 1×–3× DPI). */
export const PRODUCT_CARD_WIDTHS = [200, 300, 400, 600, 800];

/**
 * Append `?width=N` (and optional `?quality=Q`) to a Shopify CDN URL so the
 * CDN delivers a pre-resized variant. Non-Shopify URLs (local /public assets,
 * etc.) are returned unchanged.
 */
export function shopifyImageUrl(
  src: string | undefined | null,
  options: { width?: number; quality?: number } = {},
): string {
  if (!src) return "";
  if (!src.startsWith("https://cdn.shopify.com")) return src;
  try {
    const url = new URL(src);
    if (options.width) url.searchParams.set("width", String(options.width));
    if (options.quality)
      url.searchParams.set("quality", String(options.quality));
    return url.toString();
  } catch {
    return src;
  }
}

/**
 * Build a `srcset` string for a Shopify CDN image at the given candidate
 * widths. Non-Shopify URLs return an empty string (browser falls back to
 * the plain `src`).
 */
export function shopifyImageSrcSet(
  src: string | undefined | null,
  widths: number[] = PRODUCT_CARD_WIDTHS,
  quality: number = DEFAULT_QUALITY,
): string {
  if (!src || !src.startsWith("https://cdn.shopify.com")) return "";
  return widths
    .map((w) => `${shopifyImageUrl(src, { width: w, quality })} ${w}w`)
    .join(", ");
}
