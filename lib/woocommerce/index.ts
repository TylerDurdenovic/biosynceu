import { TAGS } from "lib/constants";
import { isVialPeptide } from "lib/product-category";
import { displayTitle, sanitizeFlaggedNames } from "lib/product-naming";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
  revalidateTag,
} from "next/cache";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type {
  Cart,
  CartItem,
  Collection,
  DiscountAllocation,
  DiscountCode,
  Image,
  Menu,
  Money,
  Page,
  Product,
  ProductOption,
  ProductVariant,
  StoredCart,
  StoredCartItem,
  StoredDiscount,
  WCCategory,
  WCCoupon,
  WCPage,
  WCProduct,
  WCProductVariation,
} from "./types";

// ── Config ───────────────────────────────────────────────────────────────────

const WC_URL = process.env.WC_URL ?? "";
const WP_URL = process.env.WP_URL ?? "";
const WC_KEY = process.env.WC_CONSUMER_KEY ?? "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET ?? "";
const CURRENCY = process.env.WC_CURRENCY ?? "EUR";
const CART_COOKIE = "wc_cart";
// WordPress checkout URL — set the WP site domain here
const WP_CHECKOUT_URL =
  process.env.WP_CHECKOUT_URL ??
  "https://furnitureblogger.eu/checkout/";
// Shared secret for signing headless cart payloads (set in WP functions.php too)
const HEADLESS_SECRET = process.env.WC_HEADLESS_SECRET ?? "";

// Placeholder image used when a product has no images uploaded
const PLACEHOLDER_IMAGE: Image = {
  url: "https://placehold.co/800x800/f5f5f4/a8a29e?text=No+Image",
  altText: "Product image",
  width: 800,
  height: 800,
};

// ── HTTP helpers ─────────────────────────────────────────────────────────────

function authHeader(): string {
  return `Basic ${btoa(`${WC_KEY}:${WC_SECRET}`)}`;
}

const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);

// Retry budget — kept tight so a slow/unreachable backend fails fast instead
// of hanging a page render (which makes the whole site feel frozen):
//   6s + 0.8s + 6s ≈ 12.8s worst case, ~0.3s on a healthy host. Warm requests
// are served from the "use cache" layer and never hit the network at all.
const ATTEMPTS = 2;
const ATTEMPT_TIMEOUT = 6000;
const BACKOFF = [800];

async function wcFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!WC_URL) throw new Error("WC_URL env var is not set");

  const url = `${WC_URL}${path}`;
  let lastErr: unknown;

  for (let i = 0; i < ATTEMPTS; i++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT),
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader(),
          ...(init?.headers ?? {}),
        },
      });

      // Transient server status (503 overload, 502, 429…) — wait and retry.
      // Shared/flaky hosts recover within a couple seconds, so back off in SECONDS.
      if (RETRYABLE.has(res.status) && i < ATTEMPTS - 1) {
        await sleep(BACKOFF[i] ?? 3000);
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `WooCommerce ${res.status} for ${path}: ${text.slice(0, 300)}`,
        );
      }

      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        throw new Error(
          `WooCommerce returned non-JSON (${ct}) for ${path}: ${text.slice(0, 200)}`,
        );
      }

      return res.json() as Promise<T>;
    } catch (err) {
      lastErr = err;
      // Retry timeouts AND network errors too — a flaky host blips for a few
      // seconds then recovers, so one more try usually succeeds and lets the
      // "use cache" layer store the result (keeping WordPress off the hot path).
      if (i < ATTEMPTS - 1) await sleep(BACKOFF[i] ?? 3000);
    }
  }

  throw lastErr ?? new Error(`WooCommerce request failed: ${path}`);
}

async function wpFetch<T>(path: string): Promise<T> {
  if (!WP_URL) throw new Error("WP_URL env var is not set");
  const res = await fetch(`${WP_URL}${path}`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok)
    throw new Error(`WordPress API ${res.status} for ${path}`);
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(`WordPress API returned non-JSON (${ct}) for ${path}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ── Shape helpers ─────────────────────────────────────────────────────────────

function money(amount: string | number): Money {
  const n = typeof amount === "number" ? amount : parseFloat(amount);
  return { amount: isNaN(n) ? "0.00" : n.toFixed(2), currencyCode: CURRENCY };
}

function reshapeImage(
  img: { src?: string; alt?: string; name?: string } | undefined,
  fallback = "",
): Image {
  if (!img?.src) return { ...PLACEHOLDER_IMAGE, altText: fallback || PLACEHOLDER_IMAGE.altText };
  return {
    url: img.src,
    // WooCommerce's own image alt/name still carry the original compound name,
    // so scrub them — otherwise alt text and og:image:alt reintroduce it.
    altText: sanitizeFlaggedNames(img.alt || img.name || fallback),
    width: 800,
    height: 800,
  };
}

function reshapeOptions(product: WCProduct): ProductOption[] {
  return product.attributes
    .filter((a) => a.variation)
    .map((a) => ({ id: String(a.id), name: a.name, values: a.options }));
}

function reshapeVariant(v: WCProductVariation, product: WCProduct): ProductVariant {
  const id = `${product.id}-${v.id}`;
  const title =
    v.attributes.map((a) => a.option).join(" / ") || "Default Title";
  return {
    id,
    title,
    availableForSale:
      (v.stock_status === "instock" || v.stock_status === "onbackorder") &&
      v.purchasable,
    currentlyNotInStock: v.stock_status === "onbackorder",
    selectedOptions: v.attributes.map((a) => ({ name: a.name, value: a.option })),
    price: money(v.price || product.price || 0),
    compareAtPrice:
      v.regular_price && v.sale_price && v.regular_price !== v.sale_price
        ? money(v.regular_price)
        : null,
    image: reshapeImage(v.image ?? product.images[0], displayTitle(product.slug, product.name)),
  };
}

function reshapeSimpleVariant(product: WCProduct): ProductVariant {
  return {
    id: `${product.id}-0`,
    title: "Default Title",
    availableForSale:
      (product.stock_status === "instock" ||
        product.stock_status === "onbackorder") &&
      product.purchasable,
    currentlyNotInStock: product.stock_status === "onbackorder",
    selectedOptions: [{ name: "Title", value: "Default Title" }],
    price: money(product.price || 0),
    compareAtPrice:
      product.regular_price && product.sale_price && product.sale_price !== ""
        ? money(product.regular_price)
        : null,
    image: reshapeImage(product.images[0], displayTitle(product.slug, product.name)),
  };
}

function reshapeProduct(
  product: WCProduct,
  variations: WCProductVariation[] = [],
): Product {
  const isVariable = product.type === "variable" && variations.length > 0;
  const variants: ProductVariant[] = isVariable
    ? variations.map((v) => reshapeVariant(v, product))
    : [reshapeSimpleVariant(product)];

  const prices = variants
    .map((v) => parseFloat(v.price.amount))
    .filter((n) => !isNaN(n) && n > 0);

  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  // Original ("was") prices from any on-sale variant. We only expose a
  // compare-at range when at least one variant is genuinely discounted
  // (regular price above the current price) so the struck-through price and
  // sale badge only appear on real sales.
  const compareAts = variants
    .map((v) => (v.compareAtPrice ? parseFloat(v.compareAtPrice.amount) : NaN))
    .filter((n) => !isNaN(n) && n > 0);
  const onSale = compareAts.length > 0 && Math.max(...compareAts) > minPrice;

  // One rename applied centrally — page copy, <title>, image alt text,
  // JSON-LD, cart, search and the sitemap all read from here, so they can
  // never disagree.
  const title = displayTitle(product.slug, product.name);

  const images: Image[] = product.images.length
    ? product.images.map((img) => reshapeImage(img, title))
    : [PLACEHOLDER_IMAGE];

  return {
    id: String(product.id),
    handle: product.slug,
    availableForSale:
      product.stock_status !== "outofstock" && product.purchasable,
    title,
    description: product.short_description.replace(/<[^>]+>/g, "").trim(),
    descriptionHtml: product.description || product.short_description,
    options: reshapeOptions(product),
    priceRange: {
      minVariantPrice: money(minPrice),
      maxVariantPrice: money(maxPrice),
    },
    compareAtPriceRange: onSale
      ? {
          minVariantPrice: money(Math.min(...compareAts)),
          maxVariantPrice: money(Math.max(...compareAts)),
        }
      : null,
    variants,
    featuredImage: images[0]!,
    images,
    seo: {
      title,
      description: product.short_description.replace(/<[^>]+>/g, "").trim(),
    },
    tags: product.tags.map((t) => t.slug),
    categories: product.categories.map((c) => c.slug),
    updatedAt: product.date_modified,
  };
}

/**
 * Storefront display names for the research categories.
 *
 * WooCommerce stores these as consumer-benefit phrases ("Weight Loss",
 * "Muscle Growth") which read as claims about human use. The catalogue is
 * Research Use Only, so the storefront shows the research domain instead.
 * Slugs, URLs and the WooCommerce records themselves are untouched — this is
 * presentation only.
 */
const COLLECTION_LABELS: Record<string, string> = {
  "longevity-and-anti-aging-research": "Longevity Peptides",
  "weight-loss-research": "Incretin & GLP-1 Analogues",
  "sleep-enhancement-research": "Neuroregulatory Peptides",
  "immunity-enhancement-research": "Thymic & Immune Peptides",
  "muscle-growth-research": "Growth-Factor Peptides",
  "cognitive-enhancement-research": "Nootropic Peptides",
  "healing-and-regeneration-research": "Regenerative Sequences",
  "aesthetics-essentials": "Melanocortin Peptides",
  peptides: "Peptides",
};

/** WooCommerce returns names HTML-encoded ("Aesthetics &amp; Essentials").
 *  React escapes on render, so without decoding the user sees the raw entity. */
function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function reshapeCollection(cat: WCCategory): Collection {
  const title = COLLECTION_LABELS[cat.slug] ?? decodeEntities(cat.name);
  return {
    handle: cat.slug,
    title,
    description: decodeEntities(cat.description),
    seo: { title, description: decodeEntities(cat.description) },
    path: `/search/${cat.slug}`,
    updatedAt: new Date().toISOString(),
  };
}

// ── Sort key mapping ──────────────────────────────────────────────────────────

const SORT_MAP: Record<string, string> = {
  BEST_SELLING: "popularity",
  CREATED_AT: "date",
  PRICE: "price",
  RELEVANCE: "menu_order",
};

function sortParams(sortKey?: string, reverse?: boolean): string {
  const parts: string[] = [];
  const orderby = sortKey ? SORT_MAP[sortKey] : undefined;
  if (orderby) parts.push(`orderby=${orderby}`);
  if (reverse !== undefined) parts.push(`order=${reverse ? "desc" : "asc"}`);
  return parts.join("&");
}

// ── Cart storage (cookie-based, JSON in "wc_cart") ────────────────────────────

function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function emptyStored(): StoredCart {
  return { id: makeId(), items: [], discounts: [], attributes: [] };
}

async function readStored(): Promise<StoredCart> {
  const jar = await cookies();
  const raw = jar.get(CART_COOKIE)?.value;
  if (!raw) return emptyStored();
  try {
    const parsed = JSON.parse(raw) as Partial<StoredCart>;
    // Migrate old format: `discountCodes` → `discounts`
    if (!parsed.discounts && (parsed as any).discountCodes) {
      parsed.discounts = [];
    }
    return {
      id: parsed.id ?? makeId(),
      items: parsed.items ?? [],
      discounts: parsed.discounts ?? [],
      attributes: parsed.attributes ?? [],
    };
  } catch {
    return emptyStored();
  }
}

async function writeStored(cart: StoredCart): Promise<void> {
  const jar = await cookies();
  jar.set(CART_COOKIE, JSON.stringify(cart), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

// ── Discount calculation ──────────────────────────────────────────────────────

function calcDiscountAmount(discount: StoredDiscount, subtotal: number): number {
  const v = parseFloat(discount.amount);
  if (isNaN(v) || v <= 0) return 0;
  if (discount.discountType === "percent") {
    return subtotal * (v / 100);
  }
  // fixed_cart or fixed_product
  return Math.min(v, subtotal);
}

// ── Checkout URL builder (signs payload for WordPress cart sync) ──────────────

async function hmacSign(message: string, secret: string): Promise<string> {
  if (!secret) return "";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function buildCheckoutUrl(stored: StoredCart): Promise<string> {
  if (!stored.items.length) return WP_CHECKOUT_URL;

  const payload = {
    items: stored.items.map((i) => ({
      product_id: i.productId,
      variation_id: i.variationId || 0,
      quantity: i.quantity,
    })),
    coupon: stored.discounts.find((d) => d.applicable)?.code ?? "",
    ts: Date.now(),
  };

  let encoded = "";
  try {
    if (HEADLESS_SECRET) {
      const sig = await hmacSign(JSON.stringify(payload), HEADLESS_SECRET);
      encoded = btoa(JSON.stringify({ ...payload, sig }));
    } else {
      encoded = btoa(JSON.stringify(payload));
    }
    return `${WP_CHECKOUT_URL}?hc_cart=${encoded}`;
  } catch {
    return WP_CHECKOUT_URL;
  }
}

// storedToCart is synchronous but checkoutUrl building is async — we need a sync wrapper
// that fires the async build and keeps the type clean.
function storedToCart(stored: StoredCart): Cart {
  const lines: CartItem[] = stored.items.map((item) => ({
    id: item.key,
    quantity: item.quantity,
    cost: {
      totalAmount: money(parseFloat(item.price) * item.quantity),
    },
    merchandise: {
      id: item.key,
      title: item.variantTitle,
      selectedOptions: item.selectedOptions,
      product: {
        id: String(item.productId),
        handle: item.handle,
        title: item.name,
        featuredImage: item.image,
      },
    },
  }));

  const subtotal = stored.items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0,
  );

  const applicableDiscounts = stored.discounts.filter((d) => d.applicable);
  const totalDiscount = applicableDiscounts.reduce(
    (sum, d) => sum + calcDiscountAmount(d, subtotal),
    0,
  );
  const total = Math.max(0, subtotal - totalDiscount);

  const discountAllocations: DiscountAllocation[] = applicableDiscounts.map(
    (d) => ({ discountedAmount: money(calcDiscountAmount(d, subtotal)) }),
  );

  return {
    id: stored.id,
    checkoutUrl: WP_CHECKOUT_URL,
    attributes: stored.attributes,
    cost: {
      subtotalAmount: money(subtotal),
      totalAmount: money(total),
      totalTaxAmount: money(0),
    },
    lines,
    totalQuantity: stored.items.reduce((sum, i) => sum + i.quantity, 0),
    discountCodes: stored.discounts.map((d) => ({
      code: d.code,
      applicable: d.applicable,
    })),
    discountAllocations,
  };
}

// Decode "productId-variationId" from merchandiseId string
function parseMerchandiseId(id: string): { productId: number; variationId: number } {
  const idx = id.indexOf("-");
  if (idx === -1) return { productId: Number(id), variationId: 0 };
  return {
    productId: Number(id.slice(0, idx)),
    variationId: Number(id.slice(idx + 1)),
  };
}

// ── Cart API ──────────────────────────────────────────────────────────────────

export async function createCart(): Promise<Cart> {
  const stored = emptyStored();
  await writeStored(stored);
  return storedToCart(stored);
}

export async function getCart(): Promise<Cart | undefined> {
  const jar = await cookies();
  const raw = jar.get(CART_COOKIE)?.value;
  if (!raw) return undefined;

  try {
    const stored = JSON.parse(raw) as Partial<StoredCart>;
    const normalised: StoredCart = {
      id: stored.id ?? makeId(),
      items: stored.items ?? [],
      discounts: stored.discounts ?? (stored as any).discountCodes?.map((d: DiscountCode) => ({
        code: d.code,
        applicable: d.applicable,
        discountType: "percent" as const,
        amount: "0",
      })) ?? [],
      attributes: stored.attributes ?? [],
    };
    if (!normalised.items.length) return undefined;
    return storedToCart(normalised);
  } catch {
    return undefined;
  }
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const stored = await readStored();

  for (const line of lines) {
    const { productId, variationId } = parseMerchandiseId(line.merchandiseId);
    const key = `${productId}-${variationId}`;
    const existing = stored.items.find((i) => i.key === key);

    if (existing) {
      existing.quantity += line.quantity;
      continue;
    }

    const product = await wcFetch<WCProduct>(`/products/${productId}`);
    let price = product.price || "0";
    let image = reshapeImage(product.images[0], displayTitle(product.slug, product.name));
    let variantTitle = "Default Title";
    let selectedOptions: { name: string; value: string }[] = [];

    if (variationId) {
      const variation = await wcFetch<WCProductVariation>(
        `/products/${productId}/variations/${variationId}`,
      );
      price = variation.price || product.price || "0";
      if (variation.image) image = reshapeImage(variation.image, displayTitle(product.slug, product.name));
      variantTitle = variation.attributes.map((a) => a.option).join(" / ");
      selectedOptions = variation.attributes.map((a) => ({
        name: a.name,
        value: a.option,
      }));
    }

    const item: StoredCartItem = {
      key,
      productId,
      variationId,
      quantity: line.quantity,
      name: displayTitle(product.slug, product.name),
      variantTitle,
      price,
      currency: CURRENCY,
      image,
      handle: product.slug,
      selectedOptions,
    };

    stored.items.push(item);
  }

  await writeStored(stored);
  revalidateTag(TAGS.cart, "seconds" as never);
  return storedToCart(stored);
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const stored = await readStored();
  stored.items = stored.items.filter((i) => !lineIds.includes(i.key));
  await writeStored(stored);
  revalidateTag(TAGS.cart, "seconds" as never);
  return storedToCart(stored);
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const stored = await readStored();

  for (const line of lines) {
    const item = stored.items.find((i) => i.key === line.id);
    if (item) item.quantity = line.quantity;
  }
  stored.items = stored.items.filter((i) => i.quantity > 0);

  await writeStored(stored);
  revalidateTag(TAGS.cart, "seconds" as never);
  return storedToCart(stored);
}

export async function updateCartAttributes(
  attributes: { key: string; value: string }[],
): Promise<{ cart: Cart; userErrors: { field: string[] | null; message: string }[] }> {
  const stored = await readStored();
  stored.attributes = attributes;
  await writeStored(stored);
  revalidateTag(TAGS.cart, "seconds" as never);
  return { cart: storedToCart(stored), userErrors: [] };
}

export async function applyDiscountCode(
  discountCodes: string[],
): Promise<{ cart: Cart; userErrors: { field: string; message: string }[] }> {
  const stored = await readStored();
  const userErrors: { field: string; message: string }[] = [];

  // Empty array = clear all discounts
  if (!discountCodes.length) {
    stored.discounts = [];
    await writeStored(stored);
    return { cart: storedToCart(stored), userErrors: [] };
  }

  for (const rawCode of discountCodes) {
    const code = rawCode.trim().toLowerCase();
    if (!code) continue;

    // Already applied
    if (stored.discounts.find((d) => d.code.toLowerCase() === code && d.applicable)) {
      continue;
    }

    try {
      const coupons = await wcFetch<WCCoupon[]>(
        `/coupons?code=${encodeURIComponent(code)}`,
      );

      if (!coupons.length) {
        userErrors.push({
          field: "discountCodes",
          message: `Coupon "${rawCode.toUpperCase()}" is not valid or has expired.`,
        });
        continue;
      }

      const coupon = coupons[0]!;

      // Remove existing entry for this code if re-applying
      stored.discounts = stored.discounts.filter(
        (d) => d.code.toLowerCase() !== code,
      );

      stored.discounts.push({
        code: coupon.code.toUpperCase(),
        applicable: true,
        discountType: coupon.discount_type,
        amount: coupon.amount,
      });
    } catch {
      userErrors.push({
        field: "discountCodes",
        message: `Could not validate coupon "${rawCode.toUpperCase()}". Please try again.`,
      });
    }
  }

  await writeStored(stored);
  return { cart: storedToCart(stored), userErrors };
}

// ── Checkout URL (exported for use in server actions) ─────────────────────────

export async function getCheckoutUrl(): Promise<string> {
  const stored = await readStored();
  if (!stored.items.length) return WP_CHECKOUT_URL;
  return buildCheckoutUrl(stored);
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function getProducts({
  query,
  reverse,
  sortKey,
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
} = {}): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("hours");

  if (!WC_URL) return [];

  const sort = sortParams(sortKey, reverse);
  const search = query ? `&search=${encodeURIComponent(query)}` : "";
  const qs = ["status=publish", "per_page=50", sort, search]
    .filter(Boolean)
    .join("&");

  const products = await wcFetch<WCProduct[]>(`/products?${qs}`);
  return products.map((p) => reshapeProduct(p)).filter(isVialPeptide);
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("hours");

  if (!WC_URL) return undefined;

  const products = await wcFetch<WCProduct[]>(
    `/products?slug=${encodeURIComponent(handle)}&status=publish`,
  );
  if (!products.length) return undefined;

  const product = products[0]!;
  let variations: WCProductVariation[] = [];

  if (product.type === "variable" && product.variations.length) {
    variations = await wcFetch<WCProductVariation[]>(
      `/products/${product.id}/variations?per_page=100`,
    );
  }

  return reshapeProduct(product, variations);
}

export async function getProductRecommendations(
  productId: string,
): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("hours");

  if (!WC_URL) return [];

  // WooCommerce has no native recommendations; return popular products.
  // Over-fetch because the vials-only filter below drops pens/HGH/anabolics/
  // accessories — a per_page of 4 would often leave nothing to recommend.
  const products = await wcFetch<WCProduct[]>(
    `/products?per_page=20&exclude=${productId}&orderby=popularity&status=publish`,
  );

  return products
    .filter((p) => String(p.id) !== productId)
    .map((p) => reshapeProduct(p))
    .filter(isVialPeptide)
    .slice(0, 4);
}

// ── Collections (WC product categories) ──────────────────────────────────────

const ALL_COLLECTION: Collection = {
  handle: "",
  title: "All",
  description: "All products",
  seo: { title: "All", description: "All products" },
  path: "/search",
  updatedAt: new Date().toISOString(),
};

// Single cached fetch of ALL categories. Every collection helper below sources
// its slug→id and count lookups from this ONE cached list instead of hitting
// the WC API per-collection — turning ~10 redundant round-trips into 1.
async function getRawCategories(): Promise<WCCategory[]> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("hours");

  if (!WC_URL) return [];
  return wcFetch<WCCategory[]>(`/products/categories?per_page=100`);
}

export async function getCollections(): Promise<Collection[]> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("hours");

  const cats = await getRawCategories();
  if (!cats.length) return [ALL_COLLECTION];

  return [
    ALL_COLLECTION,
    ...cats
      .filter((c) => c.slug !== "uncategorized" && c.count > 0)
      .map(reshapeCollection),
  ];
}

export async function getCollection(
  handle: string,
): Promise<Collection | undefined> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("hours");

  const cats = await getRawCategories();
  const cat = cats.find((c) => c.slug === handle);
  return cat ? reshapeCollection(cat) : undefined;
}

export async function getCollectionProducts({
  collection,
  reverse,
  sortKey,
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.collections, TAGS.products);
  cacheLife("hours");

  if (!WC_URL) return [];

  const cats = await getRawCategories();
  const cat = cats.find((c) => c.slug === collection);
  if (!cat) return [];

  const sort = sortParams(sortKey, reverse);
  const qs = [`category=${cat.id}`, sort, "per_page=50", "status=publish"]
    .filter(Boolean)
    .join("&");

  const products = await wcFetch<WCProduct[]>(`/products?${qs}`);
  return products.map((p) => reshapeProduct(p)).filter(isVialPeptide);
}

// ── Pages (WordPress REST API) ────────────────────────────────────────────────

function reshapePage(page: WCPage): Page {
  return {
    id: String(page.id),
    title: page.title.rendered,
    handle: page.slug,
    body: page.content.rendered,
    bodySummary: page.excerpt.rendered.replace(/<[^>]+>/g, "").slice(0, 200),
    seo: {
      title: page.title.rendered,
      description: page.excerpt.rendered.replace(/<[^>]+>/g, "").slice(0, 160),
    },
    createdAt: page.date,
    updatedAt: page.modified,
  };
}

export async function getPage(handle: string): Promise<Page> {
  const pages = await wpFetch<WCPage[]>(
    `/pages?slug=${encodeURIComponent(handle)}`,
  );
  const page = pages[0];
  if (!page) throw new Error(`WordPress page "${handle}" not found`);
  return reshapePage(page);
}

export async function getPages(): Promise<Page[]> {
  const pages = await wpFetch<WCPage[]>(`/pages?per_page=100&status=publish`);
  return pages.map(reshapePage);
}

// ── Navigation menu ───────────────────────────────────────────────────────────

export async function getMenu(_handle: string): Promise<Menu[]> {
  return [
    { title: "Home", path: "/" },
    { title: "Shop", path: "/shop" },
    { title: "Lab Results", path: "/lab-results" },
    { title: "Contact Us", path: "/contact" },
  ];
}

// ── Webhook revalidation ──────────────────────────────────────────────────────

export async function revalidate(req: NextRequest): Promise<NextResponse> {
  const secret = req.nextUrl.searchParams.get("secret");

  if (!secret || secret !== process.env.WC_REVALIDATION_SECRET) {
    console.error("[WC revalidate] Invalid or missing secret");
    return NextResponse.json({ status: 401 });
  }

  const topic = req.headers.get("x-wc-webhook-topic") ?? "";

  if (topic.startsWith("product")) {
    revalidateTag(TAGS.products, "seconds" as never);
  }
  if (topic.startsWith("product_cat")) {
    revalidateTag(TAGS.collections, "seconds" as never);
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}

// ── Order creation (called from checkout flow) ────────────────────────────────

export type CreateOrderParams = {
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address_1: string;
    address_2?: string;
    city: string;
    postcode: string;
    country: string;
    state?: string;
  };
  shipping?: CreateOrderParams["billing"];
  couponCodes?: string[];
};

export async function createWCOrder(
  params: CreateOrderParams,
): Promise<{ id: number; paymentUrl: string; total: string }> {
  const stored = await readStored();
  if (!stored.items.length) throw new Error("Cannot create order from empty cart");

  const body = {
    payment_method: "bacs",
    payment_method_title: "Bank Transfer",
    set_paid: false,
    billing: params.billing,
    shipping: params.shipping ?? params.billing,
    line_items: stored.items.map((item) => ({
      product_id: item.productId,
      ...(item.variationId ? { variation_id: item.variationId } : {}),
      quantity: item.quantity,
    })),
    coupon_lines: (
      params.couponCodes ?? stored.discounts.filter((d) => d.applicable).map((d) => d.code)
    ).map((code) => ({ code })),
  };

  const order = await wcFetch<{ id: number; payment_url: string; total: string }>(
    "/orders",
    { method: "POST", body: JSON.stringify(body) },
  );

  // Clear cart after order creation
  const empty = emptyStored();
  await writeStored(empty);

  return { id: order.id, paymentUrl: order.payment_url, total: order.total };
}

// ── Admin: orders list ────────────────────────────────────────────────────────

export type AdminOrder = {
  id: string;
  name: string;
  createdAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  total: number;
  shipping: number;
  currency: string;
};

type WCOrderListItem = {
  id: number;
  number: string;
  date_created: string;
  status: string;
  total: string;
  shipping_total: string;
  currency: string;
};

const WC_FINANCIAL: Record<string, string> = {
  pending: "PENDING",
  processing: "PROCESSING",
  "on-hold": "ON-HOLD",
  completed: "PAID",
  cancelled: "CANCELLED",
  refunded: "REFUNDED",
  failed: "FAILED",
};
const WC_FULFILLMENT: Record<string, string> = {
  pending: "UNFULFILLED",
  processing: "UNFULFILLED",
  "on-hold": "UNFULFILLED",
  completed: "FULFILLED",
  cancelled: "CANCELLED",
  refunded: "REFUNDED",
  failed: "FAILED",
};

export async function getAdminOrders(opts: {
  first?: number;
  after?: string;
}): Promise<AdminOrder[]> {
  if (!WC_URL) return [];
  const limit = Math.min(opts.first ?? 100, 100);
  const params = [`per_page=${limit}`, "orderby=date", "order=desc"];
  if (opts.after) params.push(`after=${encodeURIComponent(opts.after)}`);

  const orders = await wcFetch<WCOrderListItem[]>(`/orders?${params.join("&")}`);
  return orders.map((o) => ({
    id: String(o.id),
    name: `#${o.number}`,
    createdAt: o.date_created,
    financialStatus: WC_FINANCIAL[o.status] ?? o.status.toUpperCase(),
    fulfillmentStatus: WC_FULFILLMENT[o.status] ?? "UNFULFILLED",
    total: parseFloat(o.total) || 0,
    shipping: parseFloat(o.shipping_total) || 0,
    currency: o.currency,
  }));
}

// ── Newsletter subscription ───────────────────────────────────────────────────

type WCCustomerCreate = { id: number } | { code: string; message: string };

export async function subscribeNewsletter(
  email: string,
): Promise<{ ok: boolean; alreadySubscribed?: boolean; error?: string }> {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { ok: false, error: "invalid email" };
  }
  if (!WC_URL) return { ok: false, error: "WooCommerce not configured" };

  try {
    const res = await wcFetch<WCCustomerCreate>("/customers", {
      method: "POST",
      body: JSON.stringify({
        email: clean,
        meta_data: [{ key: "_newsletter", value: "yes" }],
      }),
    });
    if ("code" in res) {
      if (res.code === "registration-error-email-exists") {
        return { ok: true, alreadySubscribed: true };
      }
      return { ok: false, error: res.message };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("registration-error-email-exists")) {
      return { ok: true, alreadySubscribed: true };
    }
    return { ok: false, error: msg };
  }
}

// ── Order confirmation (public, verified by order_key) ────────────────────────

type WCOrderDetail = {
  id: number;
  order_key: string;
  number: string;
  status: string;
  date_created: string;
  total: string;
  subtotal: string;
  shipping_total: string;
  total_tax: string;
  discount_total: string;
  currency: string;
  payment_method_title: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
    phone: string;
  };
  line_items: {
    id: number;
    name: string;
    quantity: number;
    total: string;
  }[];
  coupon_lines: { code: string; discount: string }[];
};

export type OrderDetail = {
  id: number;
  number: string;
  status: string;
  date: string;
  total: string;
  subtotal: string;
  shipping: string;
  tax: string;
  discount: string;
  currency: string;
  paymentMethod: string;
  billing: {
    name: string;
    email: string;
    address: string;
    city: string;
    postcode: string;
    country: string;
    phone: string;
  };
  items: { id: number; name: string; quantity: number; total: string }[];
  coupons: string[];
};

export async function getOrderByKey(
  orderId: string,
  key: string,
): Promise<OrderDetail | null> {
  if (!orderId || !key || !/^\d+$/.test(orderId)) return null;
  try {
    const o = await wcFetch<WCOrderDetail>(`/orders/${orderId}`);
    if (o.order_key !== key) return null;
    return {
      id: o.id,
      number: o.number,
      status: o.status,
      date: o.date_created,
      total: o.total,
      subtotal: o.subtotal ?? "0",
      shipping: o.shipping_total ?? "0",
      tax: o.total_tax ?? "0",
      discount: o.discount_total ?? "0",
      currency: o.currency,
      paymentMethod: o.payment_method_title,
      billing: {
        name: `${o.billing.first_name} ${o.billing.last_name}`.trim(),
        email: o.billing.email,
        address: [o.billing.address_1, o.billing.address_2].filter(Boolean).join(", "),
        city: o.billing.city,
        postcode: o.billing.postcode,
        country: o.billing.country,
        phone: o.billing.phone ?? "",
      },
      items: o.line_items.map((li) => ({
        id: li.id,
        name: li.name,
        quantity: li.quantity,
        total: li.total,
      })),
      coupons: o.coupon_lines.map((c) => c.code),
    };
  } catch {
    return null;
  }
}
