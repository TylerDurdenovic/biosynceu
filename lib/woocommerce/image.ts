// WordPress/WooCommerce images are plain CDN URLs without Shopify's
// `?width=N` resize API. These helpers mirror the exact call-site signatures
// of shopifyImageUrl / shopifyImageSrcSet so every component that imports
// from lib/shopify/image can point here instead without any other changes.

export const PRODUCT_CARD_WIDTHS = [200, 300, 400, 600, 800];

export function shopifyImageUrl(
  src: string | undefined | null,
  _options: { width?: number; quality?: number } = {},
): string {
  // WordPress doesn't support CDN query-param resizing out of the box.
  // Next.js <Image> handles responsive sizing via its image-optimisation
  // pipeline, so we just return the original URL.
  return src ?? "";
}

export function shopifyImageSrcSet(
  src: string | undefined | null,
  _widths: number[] = PRODUCT_CARD_WIDTHS,
  _quality: number = 80,
): string {
  // WP images don't support Shopify-style CDN srcsets.
  // Return "" so callers' `|| undefined` guard drops the srcSet attribute
  // entirely — a plain URL without width descriptors is invalid srcSet syntax
  // and causes browsers to ignore the image.
  return "";
}

// Direct aliases in case anyone imports by the wc* name
export const wcImageUrl = shopifyImageUrl;
export const wcImageSrcSet = shopifyImageSrcSet;
