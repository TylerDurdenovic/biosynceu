// Slow cPanel host — give the serverless function room for a cold WC fetch.
export const maxDuration = 30;

import {
  BestsellersHeader,
  CarouselHeader,
  FeaturedProductsHeader,
  HeroSection,
  NewsletterSection,
  ShopAllButton,
  StatsSection,
  TrustBadgesStrip,
  TrustFeaturesSection,
  TrustedSourceSection,
} from "components/pages/home-sections";
import { getCollectionProducts, getProduct } from "lib/woocommerce";
import { Product } from "lib/woocommerce/types";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  // Branded-search-optimized title: brand name FIRST so it appears bold in
  // SERPs when someone searches "BioSyncLabs", followed by the value prop.
  title: {
    // Absolute title overrides the layout template — without this, the
    // template would re-append " | BioSyncLabs" on top of the brand.
    absolute:
      "BioSyncLabs — Buy Research Peptides in Germany & EU | ≥99% Purity",
  },
  // Short, brand-led, single-sentence description. Google is most likely to
  // *use* a meta description when it (a) starts with the brand name being
  // searched, (b) is < 160 chars, (c) is unique vs every other page.
  description:
    "BioSyncLabs is Germany's trusted EU research peptide supplier. BPC-157, TB-500, GHK-Cu, Retatrutide — HPLC-verified ≥99% purity, CoA available online, fast EU shipping.",
  keywords: [
    // Brand variations — feed these to Google so "BioSync" alone resolves.
    "BioSyncLabs",
    "BioSync",
    "BioSync Labs",
    "BioSyncLabs Germany",
    "BioSyncLabs review",
    // Product / category
    "buy peptides Germany",
    "research peptides EU",
    "BPC-157 buy",
    "BPC-157 Germany",
    "TB-500 buy EU",
    "GHK-Cu buy",
    "Retatrutide EU",
    "peptide supplier Germany",
    "peptide shop EU",
    "high purity peptides online",
    // German
    "Peptide kaufen Deutschland",
    "Forschungspeptide kaufen",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title:
      "BioSyncLabs — Buy Research Peptides in Germany & EU | ≥99% Purity",
    description:
      "Germany-based EU research peptide supplier. BPC-157, TB-500, GHK-Cu, Retatrutide — HPLC-verified ≥99% purity. CoA available online. Fast intra-EU shipping.",
    siteName: "BioSyncLabs",
  },
};

/* ─── Hero ──────────────────────────────────────────────────────────────── */
function Hero() {
  return <HeroSection />;
}

/* ─── Trust Features ─────────────────────────────────────────────────────── */
function TrustFeatures() {
  return <TrustFeaturesSection />;
}

/* ─── Week Bestsellers ───────────────────────────────────────────────────── */
async function WeekBestsellers() {
  // Slightly over-fetch so a single unresolved handle never leaves a gap in
  // the row — we render the first 5 that actually exist.
  const BESTSELLER_HANDLES = [
    "retatrutide",
    "ghk-cu",
    "bpc-157",
    "nad",
    "tb-500",
    "ghrp-2",
    "mots-c",
  ];

  const productResults = await Promise.all(
    BESTSELLER_HANDLES.map((h) => getProduct(h).catch(() => undefined))
  );
  const bestsellers = (productResults.filter(Boolean) as Product[]).slice(0, 5);

  if (!bestsellers.length) return null;

  // Count-aware columns so the row is always filled and centred — a 5-col grid
  // with 4 items used to leave an ugly empty cell.
  const colClass =
    {
      1: "lg:grid-cols-1",
      2: "lg:grid-cols-2",
      3: "lg:grid-cols-3",
      4: "lg:grid-cols-4",
      5: "lg:grid-cols-5",
    }[bestsellers.length] ?? "lg:grid-cols-5";

  return (
    <section className="bg-[#f6f7f9] px-6 py-14 dark:bg-slate-900 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <BestsellersHeader />

        <div className={`mx-auto grid grid-cols-2 justify-center gap-4 sm:grid-cols-3 ${colClass}`}>
          {bestsellers.map((product: Product, i: number) => {
            return (
            <Link
              key={product.handle}
              href={`/product/${product.handle}`}
              prefetch={false}
              className="group block rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
            >
              <div className="relative aspect-square overflow-hidden rounded-t-xl bg-slate-50 dark:bg-slate-700">
                {product.featuredImage?.url ? (
                  <Image
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText ?? product.title}
                    fill
                    className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                    priority={i < 2}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0" />
                    </svg>
                  </div>
                )}
                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                  <span className="rounded-full bg-[#0B1929] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    #{i + 1} Best
                  </span>
                  {!product.availableForSale && (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      Sold Out
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3">
                <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-slate-900 group-hover:text-slate-700 dark:text-slate-100 dark:group-hover:text-slate-300">
                  {product.title}
                </p>

                {(() => {
                  const meaningful = product.options.filter(
                    (opt) => opt.name.toLowerCase() !== "title"
                  );
                  if (!meaningful.length || product.variants.length > 1) return null;
                  const firstVal = meaningful[0]?.values[0];
                  if (!firstVal) return null;
                  return (
                    <span className="mt-1 inline-block text-xs font-medium text-slate-500 dark:text-slate-400">
                      {firstVal}
                    </span>
                  );
                })()}

                <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
                  {(() => {
                    const { minVariantPrice, maxVariantPrice } = product.priceRange;
                    const min = parseFloat(minVariantPrice.amount);
                    const max = parseFloat(maxVariantPrice.amount);
                    const currency = minVariantPrice.currencyCode;
                    const fmt = (amount: string) =>
                      new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency,
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(parseFloat(amount));

                    if (!product.availableForSale)
                      return <span className="text-sm text-slate-400">Out of stock</span>;

                    return (
                      <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {min === max ? fmt(minVariantPrice.amount) : (
                          <>{fmt(minVariantPrice.amount)}<span className="mx-1 text-slate-400">–</span>{fmt(maxVariantPrice.amount)}</>
                        )}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </Link>
            );
          })}
        </div>

        {/* SHOP ALL button — visible on all screen sizes */}
        <ShopAllButton />
      </div>
    </section>
  );
}

/* ─── Trusted Source ─────────────────────────────────────────────────────── */
function TrustedSource() {
  return <TrustedSourceSection />;
}

/* ─── Featured Products ──────────────────────────────────────────────────── */
async function FeaturedProducts() {
  const products = await getCollectionProducts({
    collection: "hidden-homepage-featured-items",
  }).catch(() => [] as Product[]);

  if (!products.length) return null;

  const featured = products.slice(0, 3);

  return (
    <section className="bg-gradient-to-b from-[#f6f7f9] to-blue-50/50 py-20 dark:from-slate-900 dark:to-slate-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FeaturedProductsHeader />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product: Product, i: number) => (
            <Link
              key={product.handle}
              href={`/product/${product.handle}`}
              className="group overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="relative aspect-square overflow-hidden bg-blue-50">
                {product.featuredImage?.url && (
                  <Image
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText || product.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    priority={i === 0}
                  />
                )}
                {!product.featuredImage?.url && (
                  <div className="flex h-full items-center justify-center text-5xl">🔬</div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-blue-900 transition-colors group-hover:text-blue-700">
                  {product.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-blue-500">
                  {product.description}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-900">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: product.priceRange.minVariantPrice.currencyCode,
                    }).format(Number(product.priceRange.minVariantPrice.amount))}
                  </span>
                  <span className="rounded-full bg-blue-700 px-3 py-1 text-xs font-semibold text-white">
                    Shop
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Product Carousel ───────────────────────────────────────────────────── */
async function HomeCarousel() {
  const products = await getCollectionProducts({
    collection: "hidden-homepage-carousel",
  }).catch(() => [] as Product[]);

  if (!products.length) return null;

  const items = [...products, ...products, ...products];

  return (
    <section className="overflow-hidden bg-[#f6f7f9] py-16 dark:bg-slate-900">
      <div className="mx-auto mb-10 max-w-7xl px-6 lg:px-8">
        <CarouselHeader />
      </div>
      <div className="w-full overflow-x-auto pb-4">
        <ul className="flex animate-[carousel_40s_linear_infinite] gap-5 px-6">
          {items.map((product, i) => (
            <li
              key={`${product.handle}${i}`}
              className="relative aspect-square h-[260px] w-[260px] flex-none"
            >
              <Link href={`/product/${product.handle}`} className="group block h-full w-full overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                {product.featuredImage?.url && (
                  <Image
                    src={product.featuredImage.url}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="260px"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-900/80 to-transparent p-4">
                  <p className="text-sm font-semibold text-white">{product.title}</p>
                  <p className="text-xs text-blue-200">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: product.priceRange.maxVariantPrice.currencyCode,
                    }).format(Number(product.priceRange.maxVariantPrice.amount))}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─── CTA Banner ─────────────────────────────────────────────────────────── */
/* ─── Page ───────────────────────────────────────────────────────────────── */
function TrustBadges() { return <TrustBadgesStrip />; }
function Stats() { return <StatsSection />; }
function Newsletter() { return <NewsletterSection />; }

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <TrustBadges />
      <TrustFeatures />
      <Suspense fallback={<BestsellersSkeletion />}>
        <WeekBestsellers />
      </Suspense>
      <Newsletter />
      <TrustedSource />
      <Suspense fallback={null}>
        <FeaturedProducts />
      </Suspense>
      <Suspense fallback={null}>
        <HomeCarousel />
      </Suspense>
    </>
  );
}

function BestsellersSkeletion() {
  return (
    <section className="bg-white px-6 py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 h-8 w-48 animate-pulse rounded bg-slate-100" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    </section>
  );
}
