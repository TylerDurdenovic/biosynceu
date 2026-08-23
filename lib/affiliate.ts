/**
 * Shopify Collabs affiliate tracking helpers.
 *
 * Flow:
 *  - An affiliate sends customers to https://biosynclabs.eu/?sca_ref=<refId>
 *  - On first arrival we read the param and stash it in a 30-day cookie
 *    (matching Shopify Collabs' attribution window)
 *  - When the customer checks out — either via the Shopify checkoutUrl or
 *    through the PayGate crypto/card flow — we forward the value, so
 *    Shopify Collabs attributes the sale to the right affiliate
 *
 * The cookie is HTTP-readable from the client (no HttpOnly) because the
 * cart modal needs to read it when building the checkout button href.
 */

export const SCA_REF_COOKIE = "sca_ref";
export const SCA_REF_PARAM = "sca_ref";
/**
 * Referral / creator code (Shopify Collabs).
 *
 * Customers arriving via /?ref=hasan have the value "hasan" stashed in this
 * cookie for 30 days. The code is ALSO a Shopify discount code — applying
 * it at checkout both gives the customer a discount and attributes the
 * sale to the creator via Shopify Collabs.
 */
export const REF_CODE_COOKIE = "ref";
export const REF_CODE_PARAM = "ref";
const COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60; // 30 days

/** Read an arbitrary cookie value from the browser. Returns null on the server. */
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const all = document.cookie.split("; ");
    for (const entry of all) {
      const [k, v] = entry.split("=");
      if (k === name && v) {
        return decodeURIComponent(v);
      }
    }
  } catch {
    // sandboxed iframe — cookies unavailable; act as if there's none
  }
  return null;
}

/** Persist a value to a 30-day cookie. Silent in sandboxed iframes. */
function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  if (!value) return;
  try {
    document.cookie =
      `${name}=${encodeURIComponent(value)}` +
      `;path=/;max-age=${COOKIE_MAX_AGE_SEC};SameSite=Lax`;
  } catch {
    // ignore
  }
}

/** Read the sca_ref cookie value from the browser. */
export function readScaRefCookie(): string | null {
  return readCookie(SCA_REF_COOKIE);
}

/** Persist the sca_ref value as a 30-day cookie. */
export function writeScaRefCookie(value: string): void {
  writeCookie(SCA_REF_COOKIE, value);
}

/** Read the referral / creator-code cookie value from the browser. */
export function readRefCodeCookie(): string | null {
  return readCookie(REF_CODE_COOKIE);
}

/** Persist the referral / creator-code value as a 30-day cookie. */
export function writeRefCodeCookie(value: string): void {
  writeCookie(REF_CODE_COOKIE, value);
}

/**
 * Generic helper: append `?<key>=<value>` to any URL. Handles URLs that
 * already have a query string or a hash. Returns the input unchanged
 * when value is empty or the URL is falsy.
 */
function appendQueryParam(
  url: string | null | undefined,
  key: string,
  value: string | null,
): string | null {
  if (!url) return url ?? null;
  if (!value) return url;
  const hashIdx = url.indexOf("#");
  const hash = hashIdx >= 0 ? url.slice(hashIdx) : "";
  const base = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${key}=${encodeURIComponent(value)}${hash}`;
}

/** Append `?sca_ref=…` to any URL. */
export function appendScaRef(url: string | null | undefined, ref: string | null): string | null {
  return appendQueryParam(url, SCA_REF_PARAM, ref);
}

/**
 * Wrap a Shopify checkout URL in the documented discount-apply-and-redirect
 * pattern:
 *
 *   https://<store>.myshopify.com/discount/CODE?redirect=/checkouts/cn/...
 *
 * When the customer clicks this URL, Shopify:
 *   1. Validates the discount code
 *   2. Stores it on the cart session
 *   3. 302-redirects to the original checkout path
 *
 * The customer lands on Shopify checkout with the discount already
 * applied — visible in the order summary, automatically deducted from
 * the total, and (because Shopify Collabs creator codes are also
 * discount codes) attributed to the creator.
 *
 * Falls back to the original URL if either argument is missing or the
 * URL isn't parseable.
 */
export function appendDiscountToUrl(
  url: string | null | undefined,
  code: string | null,
): string | null {
  if (!url) return url ?? null;
  if (!code) return url;
  try {
    const parsed = new URL(url);
    // Shopify requires the redirect target to be a relative URL on the
    // same domain. Preserve path + any existing query (e.g. ?sca_ref=…)
    // + hash so other tracking params survive.
    const redirectPath = parsed.pathname + parsed.search + parsed.hash;
    return (
      `${parsed.origin}/discount/${encodeURIComponent(code)}` +
      `?redirect=${encodeURIComponent(redirectPath)}`
    );
  } catch {
    // URL parsing failed (e.g. relative URL) — fall back to query param.
    return appendQueryParam(url, "discount", code);
  }
}
