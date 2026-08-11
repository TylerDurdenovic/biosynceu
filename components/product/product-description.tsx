"use client";

import { AddToCart } from "components/cart/add-to-cart";
import Prose from "components/prose";
import { useLanguage } from "contexts/language-context";
import { type CoaEntry, getCoaByHandle } from "lib/coa-data";
import { Product } from "lib/woocommerce/types";
import { getProductSocialProof } from "lib/product-social-proof";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useProductOptions } from "./product-context";
import { ProductPrice } from "./product-price";
import { ShareButton } from "./share-button";
import { VariantSelector } from "./variant-selector";

/* ── Availability + pre-order block — reads the live selected variant ───── */
function AvailabilityBlock({ product }: { product: Product }) {
  const { t } = useLanguage();
  const tp = t.product;
  const { selectedVariant } = useProductOptions();

  // Treat the page as pre-order when:
  //  - a specific variant is selected and it has currentlyNotInStock=true, OR
  //  - no variant is selected yet but every variant is currentlyNotInStock
  //    (so the customer can't accidentally see "in stock" before picking).
  const isPreOrder = selectedVariant
    ? Boolean(selectedVariant.currentlyNotInStock)
    : product.availableForSale &&
      product.variants.length > 0 &&
      product.variants.every((v) => v.currentlyNotInStock);

  const isOutOfStock = !product.availableForSale;

  // Status icon + colour pairing — colour alone fails for ~8% of male
  // visitors with red/green deficiency, so each state gets a distinct
  // glyph as well.
  const statusKey = isOutOfStock
    ? "oos"
    : isPreOrder
      ? "preorder"
      : "instock";

  const ariaLabel = isOutOfStock
    ? tp.outOfStock
    : isPreOrder
      ? `${tp.preOrder} — ${tp.preOrderShipsIn}`
      : `${tp.inStock} — ${tp.dispatchTime}`;

  return (
    <div
      className="mb-4 flex items-center gap-2"
      role="status"
      aria-label={ariaLabel}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full ${
          isOutOfStock
            ? "bg-red-100 text-red-600"
            : isPreOrder
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
        }`}
        aria-hidden="true"
      >
        {statusKey === "instock" && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {statusKey === "preorder" && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {statusKey === "oos" && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </span>
      <span className="text-xs font-semibold text-slate-700">
        {isOutOfStock
          ? tp.outOfStock
          : isPreOrder
            ? tp.preOrder
            : tp.inStock}
      </span>
      {isPreOrder && (
        <span className="text-xs text-amber-700">
          · {tp.preOrderShipsIn}
        </span>
      )}
    </div>
  );
}

/* ── Trustpilot badge (inline, no external image dependency) ─────────────── */
function TrustpilotBadge() {
  const { lang } = useLanguage();
  const reviewText = lang === "de" ? "Basierend auf verifizierten Kundenbewertungen" : "Based on verified customer reviews";
  const excellentText = lang === "de" ? "Ausgezeichnet" : "Excellent";

  return (
    <div className="mt-5 border-t border-slate-100 pt-5">
      <a
        href="https://www.trustpilot.com/review/biosynclabs.to"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Read our reviews on Trustpilot"
        className="inline-flex flex-col gap-1.5 transition-opacity hover:opacity-80"
      >
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 55 52" className="h-5 w-5" aria-hidden="true">
            <polygon points="27.5,0 34.1,19.1 54.5,19.1 38.7,30.9 45.3,50 27.5,38.2 9.7,50 16.3,30.9 0.5,19.1 20.9,19.1" fill="#00B67A" />
          </svg>
          <span className="text-base font-bold tracking-tight text-slate-900">Trustpilot</span>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="flex h-6 w-6 items-center justify-center bg-[#00B67A]">
              <svg viewBox="0 0 55 52" className="h-3.5 w-3.5" fill="white" aria-hidden="true">
                <polygon points="27.5,0 34.1,19.1 54.5,19.1 38.7,30.9 45.3,50 27.5,38.2 9.7,50 16.3,30.9 0.5,19.1 20.9,19.1" />
              </svg>
            </span>
          ))}
          <span className="ml-2 text-xs font-semibold text-slate-700">{excellentText}</span>
        </div>
        <p className="text-[10px] text-slate-400">{reviewText}</p>
      </a>
    </div>
  );
}

/* ── Back in stock form ──────────────────────────────────────────────────── */
function NotifyMeForm({ handle }: { handle: string }) {
  const { t } = useLanguage();
  const tn = t.product.notify;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/back-in-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, handle }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        {tn.success}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-1 text-sm font-semibold text-slate-800">{tn.title}</p>
      <p className="mb-3 text-xs text-slate-500">{tn.sub}</p>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="email"
          required
          placeholder={tn.placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
        >
          {status === "loading" ? tn.sending : tn.button}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-600">{tn.error}</p>
      )}
    </div>
  );
}

function ProductMiniStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-3.5 w-3.5 ${i < full ? "fill-amber-400" : "fill-slate-200"}`}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

/* ── Certificate of Analysis CTA ───────────────────────────────────────────
   A high-trust call-out shown directly below the add-to-cart bullets. When
   we have a product-specific CoA we link straight to the PDF (opens in a new
   tab so the customer doesn't lose their place); when we don't, we fall
   back to the lab-results page so the customer can still browse our other
   batch reports and see that we publish every one. */
function CoaCallout({ coa }: { coa: CoaEntry | undefined }) {
  const { t } = useLanguage();
  const tc = t.product.coaCallout;

  if (coa) {
    return (
      <div className="mt-5 overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 shadow-sm">
        {/* Top stripe */}
        <div className="flex items-center justify-between gap-2 border-b border-emerald-100 bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-2">
          <div className="flex items-center gap-2 text-white">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span className="text-[11px] font-bold uppercase tracking-widest">
              {tc.verified}
            </span>
          </div>
          <span className="inline-block shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white sm:text-[10px]">
            {coa.purity}
          </span>
        </div>

        {/* Body */}
        <div className="px-4 py-3.5">
          <p className="text-sm font-bold text-slate-900">
            {tc.heading}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
            {tc.sub}
          </p>

          {/* Quick facts */}
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <div className="rounded-md bg-white px-2 py-1.5 ring-1 ring-slate-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {tc.purity}
              </p>
              <p className="mt-0.5 font-mono text-[11px] font-semibold text-emerald-700">
                {coa.purity}
              </p>
            </div>
            <div className="rounded-md bg-white px-2 py-1.5 ring-1 ring-slate-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {tc.method}
              </p>
              <p className="mt-0.5 font-mono text-[11px] font-semibold text-slate-700">
                {coa.method}
              </p>
            </div>
            <div className="rounded-md bg-white px-2 py-1.5 ring-1 ring-slate-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {tc.tested}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-700">
                {coa.lastTested}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3.5 flex gap-2">
            <a
              href={coa.file}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:from-emerald-500 hover:to-cyan-500 hover:shadow-md active:scale-[.98]"
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {tc.viewBtn}
            </a>
            <a
              href={coa.file}
              download
              aria-label={tc.viewBtn}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {tc.pdf}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // No product-specific CoA — link to the full lab-results library so the
  // customer can still confirm we publish a certificate for every batch.
  return (
    <Link
      href="/lab-results"
      className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{tc.browseTitle}</p>
          <p className="text-[11px] text-slate-500">{tc.browseSub}</p>
        </div>
      </div>
      <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export function ProductDescription({ product }: { product: Product }) {
  const { t } = useLanguage();
  const tp = t.product;
  const coa = getCoaByHandle(product.handle);
  const sp = getProductSocialProof(product.handle);

  return (
    <div className="flex h-full flex-col">
      {/* ── Title & price ── */}
      <div className="mb-5 border-b border-slate-100 pb-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {product.title}
          </h1>
          <div className="shrink-0 pt-1">
            <ShareButton title={product.title} description={product.description} />
          </div>
        </div>

        {/* ── Social proof row ── */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          {/* Stars + rating */}
          <div className="flex items-center gap-1.5">
            <ProductMiniStars rating={sp.rating} />
            <span className="text-sm font-bold text-amber-500">{sp.rating.toFixed(1)}</span>
            <span className="text-xs text-slate-400">({sp.reviewCount} {tp.reviews})</span>
          </div>
          {/* Divider */}
          <span className="hidden h-4 w-px bg-slate-200 sm:block" />
          {/* Purchased count */}
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-600 ring-1 ring-orange-200">
            🔥 {sp.purchasedCount}+ {tp.boughtThis}
          </span>
        </div>

        {/* Reactive price */}
        <Suspense
          fallback={
            <span className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: product.priceRange.minVariantPrice.currencyCode,
              }).format(parseFloat(product.priceRange.minVariantPrice.amount))}
            </span>
          }
        >
          <ProductPrice
            variants={product.variants}
            options={product.options}
            minAmount={product.priceRange.minVariantPrice.amount}
            maxAmount={product.priceRange.maxVariantPrice.amount}
            currencyCode={product.priceRange.minVariantPrice.currencyCode}
          />
        </Suspense>
      </div>

      {/* ── Variant selector ── */}
      <VariantSelector options={product.options} variants={product.variants} />

      {/* ── RUO disclaimer ── */}
      <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 sm:px-4 sm:py-3">
        <p className="text-[11px] font-bold text-red-700 sm:text-xs">
          {t.common.ruo.labUseHeading}
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-red-600 sm:text-xs">
          {t.common.ruo.subtext}
        </p>
      </div>

      {/* ── Availability (in stock / pre-order / out of stock) ── */}
      <AvailabilityBlock product={product} />

      {/* ── Add to cart ── */}
      <div id="add-to-cart-sentinel" className="mt-auto">
        {/* ── Certificate of Analysis CTA ─────────────────────────────────
            Prominent trust signal shown directly ABOVE the add-to-cart area
            so customers see purity/verification before the conversion action.
            If a CoA exists for this product, link straight to the PDF;
            otherwise fall back to the lab-results index so the customer can
            still see our verification process. */}
        <div className="mb-5 [&>*]:!mt-0">
          <CoaCallout coa={coa} />
        </div>

        <AddToCart product={product} />

        {/* EU compliance badges — always visible below ATC. Compact 2×2 grid
            on phones to save vertical space, flex-wrap row on sm+. */}
        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
          {[
            { icon: "🇪🇺", label: tp.badges.euWarehouse },
            { icon: "🔬", label: tp.badges.thirdPartyTested },
            { icon: "📄", label: tp.badges.coaIncluded },
            { icon: "📦", label: tp.badges.discreetPackaging },
          ].map(({ icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600"
            >
              <span aria-hidden>{icon}</span> {label}
            </span>
          ))}
        </div>

        {/* Back-in-stock form for sold-out products */}
        {!product.availableForSale && (
          <div className="mt-4">
            <NotifyMeForm handle={product.handle} />
          </div>
        )}

        <ul className="mt-3 flex flex-col gap-1.5">
          {[tp.coaIncluded, tp.purity].map((text) => (
            <li key={text} className="flex items-center gap-2 text-xs text-slate-500">
              <svg className="h-3.5 w-3.5 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {text}
            </li>
          ))}
        </ul>

        {/* ── Accepted payment methods ── */}
        <div className="mt-5 border-t border-slate-100 pt-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {tp.weAccept}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cards.png"
            alt="Accepting PayPal and all major cards"
            width={220}
            height={48}
            loading="lazy"
            className="h-auto w-auto max-w-[220px] rounded-md"
          />
        </div>

        {/* ── Trustpilot ── */}
        <TrustpilotBadge />
      </div>

      {/* ── Description from Shopify ── */}
      {(product.descriptionHtml || product.description) && (
        <div className="mt-6 border-t border-slate-100 pt-5" style={{ color: "#000" }}>
          {product.descriptionHtml ? (
            <Prose
              className="!text-xs leading-relaxed [&_*]:!text-black [&_*]:![color:inherit]"
              html={product.descriptionHtml}
            />
          ) : (
            <p className="text-xs leading-relaxed">{product.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
