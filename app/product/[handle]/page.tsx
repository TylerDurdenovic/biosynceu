// Give the function room for a cold WC fetch before Vercel kills it.
export const maxDuration = 30;
// ISR: render once, serve the whole page from Vercel's edge cache, and
// regenerate in the background every 5 minutes. This is what makes product
// pages load instantly even while the WooCommerce backend is slow — the slow
// fetch happens once per window, not on every visit. (Product webhooks also
// bust the cache via revalidateTag on change.)
export const revalidate = 300;

import { Gallery } from "components/product/gallery";
import { FrequentlyBoughtTogether } from "components/product/frequently-bought-together";
import { ProductBreadcrumb, RelatedProductsSection } from "components/product/product-page-client";
import { ProductDescription } from "components/product/product-description";
import { ProductPageWrapper } from "components/product/product-page-wrapper";
import { ProductTabs } from "components/product/product-tabs";
import { StickyCartBar } from "components/product/sticky-cart-bar";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import { getProduct, getProductRecommendations } from "lib/woocommerce";
import type { Product } from "lib/woocommerce/types";
import { baseUrl } from "lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

/**
 * Build the gallery image list for a product.
 *
 * Priority order:
 *  1. Nova per-variant images in variant order (each variant shows its own
 *     images first, so the gallery snap-to-variant behaviour works correctly).
 *  2. Any remaining product images (lifestyle shots etc.) that weren't already
 *     covered by Nova.
 *
 * The Gallery component matches images → variants via `variant.image.url`, so
 * clicking a thumbnail automatically selects the right variant and vice-versa.
 */
function buildGalleryImages(
  product: Product
): { src: string; altText: string }[] {
  const seen = new Set<string>();
  const result: { src: string; altText: string }[] = [];

  for (const variant of product.variants) {
    const sources = variant.novaImages?.length
      ? variant.novaImages
      : variant.image
        ? [variant.image]
        : [];

    for (const img of sources) {
      if (!seen.has(img.url)) {
        seen.add(img.url);
        result.push({ src: img.url, altText: img.altText ?? product.title });
      }
    }
  }

  // Append any product images not already included (covers single-variant
  // products and lifestyle images Nova doesn't assign to a specific variant).
  for (const img of product.images) {
    if (!seen.has(img.url)) {
      seen.add(img.url);
      result.push({ src: img.url, altText: img.altText });
    }
  }

  return result;
}

/**
 * Format a Shopify Money value as a locale-aware string for use in titles
 * and meta descriptions. Falls back to "{currency} {amount}" if the runtime
 * doesn't recognise the currency code.
 */
function formatPrice(amount: string, currencyCode: string): string {
  const num = Number(amount);
  if (!Number.isFinite(num)) return `${currencyCode} ${amount}`;
  try {
    return new Intl.NumberFormat("en-DE", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currencyCode} ${num.toFixed(2)}`;
  }
}

/** Trim a string to ~155 chars on a word boundary for meta descriptions. */
function truncate(input: string, max = 155): string {
  const clean = input.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  // Catch transient WooCommerce errors so a single hiccup during metadata
  // generation doesn't crash the page. IMPORTANT: never call notFound() here —
  // a timed-out fetch would otherwise be cached as a permanent 404. Let the
  // page component below be the sole decider of notFound(), and only for a
  // genuinely missing product.
  const product = await getProduct(params.handle).catch(() => undefined);

  if (!product) {
    return { title: "Product", robots: { index: false, follow: false } };
  }

  const { url: imageUrl, width, height, altText } = product.featuredImage || {};
  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);

  const minPrice = product.priceRange.minVariantPrice;
  const priceLabel = formatPrice(minPrice.amount, minPrice.currencyCode);
  const productUrl = `${baseUrl}/product/${product.handle}`;

  // HTML <title>: "Buy Retatrutide 10mg — €89.00" → root layout template
  // appends " | BioSyncLabs" automatically. Kept short so it doesn't get
  // truncated in Google SERP. Falls back to merchant-set Shopify SEO title
  // if one is configured.
  const title =
    product.seo.title || `Buy ${product.title} — ${priceLabel}`;

  // OG / Twitter titles don't go through the title template, so include the
  // brand inline for share previews on Discord, WhatsApp, X, FB, iMessage…
  const socialTitle = product.seo.title
    ? title
    : `${product.title} — ${priceLabel} | BioSyncLabs`;

  // Description: lead with the product name + brand (best for branded searches
  // like "biosynclabs bac water"), then the merchant copy or a rich fallback.
  const baseDescription = (product.seo.description || product.description || "").trim();
  const description = truncate(
    baseDescription.length > 30
      ? `${product.title} — ${priceLabel} at BioSyncLabs. ${baseDescription}`
      : `${product.title} — ${priceLabel} at BioSyncLabs. Research-grade quality, ≥99% HPLC purity, Certificate of Analysis available online. Fast tracked EU shipping from Germany.`,
  );

  const ogImage = imageUrl
    ? [
        {
          url: imageUrl,
          width: width || 1200,
          height: height || 1200,
          alt: altText || product.title,
        },
      ]
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/product/${product.handle}`,
    },
    robots: {
      // Full rich-result eligibility: let Google show the product's description
      // snippet and a large image preview so branded searches (e.g. "biosynclabs
      // bac water") return a proper, clickable result with title + image + price.
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      url: productUrl,
      siteName: "BioSyncLabs",
      title: socialTitle,
      description,
      locale: "en_EU",
      alternateLocale: ["de_DE"],
      ...(ogImage ? { images: ogImage } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    other: {
      // OGP product extension (Facebook / Pinterest / WhatsApp use these
      // when they detect a product page) — gives crawlers explicit price
      // and availability hints for richer share cards.
      "product:price:amount": minPrice.amount,
      "product:price:currency": minPrice.currencyCode,
      "product:availability": product.availableForSale ? "instock" : "oos",
      // Pinterest also reads the og:price:* aliases.
      "og:price:amount": minPrice.amount,
      "og:price:currency": minPrice.currencyCode,
    },
  };
}

export default async function ProductPage(props: {
  params: Promise<{ handle: string }>;
}) {
  // NOTE: we intentionally do NOT read searchParams here. Reading them would
  // force every product page to render dynamically (and hit the slow backend
  // on every visit). The ?dose= pre-selection is applied on the client instead
  // (see ProductOptionsProvider), which lets this page cache at the edge.
  const params = await props.params;
  const [product, bacWater] = await Promise.all([
    // NO .catch() here on purpose: getProduct returns undefined ONLY when the
    // product genuinely doesn't exist (empty API result), and THROWS on a
    // fetch error/timeout. Letting a throw propagate sends the user to the
    // retryable error page instead of a notFound() 404 that Next would cache
    // for hours — which is exactly the "product shows 404" bug.
    getProduct(params.handle),
    // Bac-water is the optional upsell — never let a transient error for it
    // bring down the main product page.
    getProduct("bacteriostatic-water-bac-water").catch(() => undefined),
  ]);

  if (!product) return notFound();

  // Variant pre-selection now happens on the client from the URL.
  const initialSelected: Record<string, string> = {};

  const productUrl = `${baseUrl}/product/${product.handle}`;
  // priceValidUntil ~1 year out — required by Google for offer rich results.
  const priceValidUntil = new Date(
    Date.now() + 365 * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10);

  // Collect every product image so search engines can pick the best aspect
  // ratio for rich results (Google recommends 1:1, 4:3, and 16:9).
  const imageList = Array.from(
    new Set(
      [
        product.featuredImage?.url,
        ...product.images.map((i) => i.url),
        ...product.variants.flatMap((v) =>
          v.novaImages?.length
            ? v.novaImages.map((i) => i.url)
            : v.image
              ? [v.image.url]
              : [],
        ),
      ].filter((u): u is string => Boolean(u)),
    ),
  );

  // Breadcrumb structured data — drives the rich-snippet trail
  // ("Home › Shop › {product}") below the result in Google.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: `${baseUrl}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: productUrl,
      },
    ],
  };

  const currency = product.priceRange.minVariantPrice.currencyCode;

  // Shipping policy (mirrors the on-site shipping copy): intra-EU dispatch,
  // 2–3 business-day delivery, free over €250. Modelled as the free tier so
  // Google can show "Free delivery" in the product rich result; orders under
  // the threshold are quoted at checkout, so we don't assert a flat rate here.
  const shippingDetails = {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: "0",
      currency,
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: [
        "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE",
        "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT",
        "RO", "SK", "SI", "ES", "SE",
      ],
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 0,
        maxValue: 1,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 2,
        maxValue: 3,
        unitCode: "DAY",
      },
    },
  };

  // Return policy. The published policy states "all sales are generally final"
  // with returns accepted only for incorrect/damaged/defective items — there
  // is NO general change-of-mind return window. Representing that truthfully
  // as a non-permitted merchant return policy (rather than inventing a 14-day
  // window) keeps the structured data accurate and Google-compliant.
  const returnPolicy = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "DE",
    returnPolicyCategory:
      "https://schema.org/MerchantReturnNotPermitted",
    merchantReturnLink: `${baseUrl}/refund-returns`,
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: imageList.length ? imageList : undefined,
    sku: product.handle,
    mpn: product.handle,
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: "BioSyncLabs",
    },
    offers: {
      "@type": "AggregateOffer",
      url: productUrl,
      availability: product.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceCurrency: currency,
      highPrice: product.priceRange.maxVariantPrice.amount,
      lowPrice: product.priceRange.minVariantPrice.amount,
      offerCount: product.variants.length || 1,
      priceValidUntil,
      seller: {
        "@type": "Organization",
        name: "BioSyncLabs",
      },
      shippingDetails,
      hasMerchantReturnPolicy: returnPolicy,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <div className="bg-white">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
          <ProductBreadcrumb title={product.title} />
        </div>

        {/* Main product card */}
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          {/* Shared variant context wraps both Gallery and Description */}
          <ProductPageWrapper
            options={product.options}
            variants={product.variants}
            initialSelected={initialSelected}
          >
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
            {/* Gallery */}
            <div className="w-full lg:w-3/5">
              <Suspense
                fallback={
                  <div className="relative aspect-square w-full animate-pulse rounded-xl bg-slate-100" />
                }
              >
                <Gallery
                  images={buildGalleryImages(product)}
                  variants={product.variants}
                  options={product.options}
                />
              </Suspense>
            </div>

            {/* Info panel */}
            <div className="w-full lg:w-2/5">
              <Suspense fallback={null}>
                <ProductDescription product={product} />
              </Suspense>
            </div>
          </div>
          </ProductPageWrapper>

          {/* ── Frequently bought together ── */}
          {bacWater && bacWater.handle !== product.handle && bacWater.availableForSale && (
            <FrequentlyBoughtTogether upsell={bacWater} />
          )}

          {/* ── Tabs: Details / Storage / Lab Certificate / Quality ── */}
          <ProductTabs product={product} />

          <RelatedProducts id={product.id} />
        </div>
      </div>
      <Suspense fallback={null}>
        <StickyCartBar product={product} />
      </Suspense>
    </>
  );
}

async function RelatedProducts({ id }: { id: string }) {
  // Recommendations are nice-to-have; never let a transient Shopify error
  // here turn the whole product page into a 500.
  const relatedProducts = await getProductRecommendations(id).catch(() => []);
  return <RelatedProductsSection products={relatedProducts} />;
}
