"use client";

/**
 * Custom Next.js image loader for Shopify CDN images.
 *
 * Instead of routing every image through Next's local optimizer (which has to
 * download the full original file and re-compress it — causing 7-second
 * timeouts in dev), we return a Shopify CDN URL with their native resizing
 * query params appended. Shopify's CDN already serves WebP/AVIF and supports
 * ?width=N natively, so the result is equivalent quality with no proxy.
 *
 * For non-Shopify URLs (local public/ assets, etc.) we return the source
 * unchanged so they continue to be served directly by Next's dev server.
 */
export default function shopifyImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (src.startsWith("https://cdn.shopify.com")) {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    if (quality) url.searchParams.set("quality", String(quality ?? 75));
    return url.toString();
  }

  // Local assets — return as-is (served from the Next.js dev / static server)
  return src;
}
