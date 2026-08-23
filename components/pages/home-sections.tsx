"use client";

import { useLanguage } from "contexts/language-context";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useEffect, useRef, useState } from "react";

export function HeroSection() {
  const { t } = useLanguage();
  const h = t.home.hero as { title1: string; title2: string; subtitle: string; body: string };
  const ticker = t.ticker;

  // Mobile hero crossfades between two background images every 6 seconds.
  const mobileHeroes = ["/hero-bg-mobile4.webp", "/hero-bg-mobile5.webp"];
  const [mobileHeroIdx, setMobileHeroIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setMobileHeroIdx((i) => (i + 1) % mobileHeroes.length),
      6000,
    );
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tickerItems = [
    { text: ticker.item1, highlight: false },
    { text: ticker.item2, highlight: true },
    { text: ticker.item3, highlight: false },
    { text: ticker.item4, highlight: false },
    { text: ticker.item5, highlight: false },
    { text: ticker.item6, highlight: false },
    { text: ticker.item7, highlight: true },
  ];

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="overflow-hidden bg-[#0B1929]">

        {/* ── MOBILE: natural image height so full image is visible.
            Two backgrounds crossfade on a timer. The first image stays in
            normal flow to set the section height; the rest overlay it with
            `fill` and fade in/out (all images share the same dimensions). ── */}
        <div className="relative md:hidden">
          <Image
            src={mobileHeroes[0]!}
            alt="BioSyncLabs hero"
            width={0}
            height={0}
            sizes="100vw"
            className={`h-auto w-full transition-opacity duration-1000 ease-in-out ${
              mobileHeroIdx === 0 ? "opacity-100" : "opacity-0"
            }`}
            priority
          />
          {mobileHeroes.slice(1).map((src, i) => (
            <Image
              key={src}
              src={src}
              alt=""
              aria-hidden
              fill
              sizes="100vw"
              className={`object-cover transition-opacity duration-1000 ease-in-out ${
                mobileHeroIdx === i + 1 ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          {/* dark overlay so text is always readable */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/10" />
          {/* Content: top-center */}
          <div className="absolute inset-0 flex flex-col items-center justify-start px-6 pt-10">
            <div className="w-full max-w-sm text-center">
              <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-white drop-shadow-lg">
                {h.title1}
                <br />
                {h.title2}
              </h1>
              <p className="mt-3 text-base font-semibold tracking-wide text-white/90 drop-shadow">
                {h.subtitle}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/75">
                {h.body}
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold tracking-wide text-[#0B1929] shadow-lg transition-all hover:bg-white/90 active:scale-[.98]"
                >
                  {t.common.shopNow}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── DESKTOP: fixed-height fill layout ─────────────────────────── */}
        <div className="relative hidden min-h-[620px] md:block lg:min-h-[680px]">
          <Image
            src="/herto4.webp"
            alt="BioSyncLabs hero"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          <div className="relative mx-auto flex h-full max-w-7xl items-center px-6 py-24 lg:px-8">
            <div className="max-w-lg text-left">
              <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white lg:text-6xl">
                {h.title1}
                <br />
                <span className="text-white">{h.title2}</span>
              </h1>
              <p className="mt-5 text-xl font-semibold tracking-wide text-white">
                {h.subtitle}
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85">
                {h.body}
              </p>
              <div className="mt-8 flex items-center gap-4">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2.5 rounded-full bg-white px-10 py-5 text-base font-bold tracking-wide text-[#0B1929] shadow-lg transition-all hover:bg-white/90 hover:shadow-xl active:scale-[.98] lg:px-12 lg:py-6 lg:text-lg"
                >
                  {t.common.shopNow}
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER STRIP — sits directly below the hero image ─────────────── */}
      <div className="overflow-hidden border-y border-slate-700 bg-[#0B1929]">
        <div className="flex animate-[carousel_28s_linear_infinite] whitespace-nowrap py-3">
          {[0, 1].map((pass) => (
            <div key={pass} className="flex shrink-0 items-center">
              {tickerItems.map((item, i) => (
                <span key={i} className="flex items-center">
                  <span
                    className={`px-5 text-xs font-medium tracking-wide ${
                      item.highlight ? "text-cyan-300" : "text-slate-300"
                    }`}
                  >
                    {item.text}
                  </span>
                  <span className="text-slate-600">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function TrustFeaturesSection() {
  const { t } = useLanguage();
  const tr = t.home.trust;

  const features: {
    key: "tested" | "satisfaction" | "support";
    icon: React.ReactNode;
    /** card tint + icon chip colours — slight contrast so each pillar reads
        as its own tile instead of plain text on white */
    card: string;
    chip: string;
    num: string;
  }[] = [
    {
      key: "tested",
      card: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white",
      chip: "bg-emerald-100 text-emerald-700",
      num: "text-emerald-500",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .194.014.386.042.576m0 0a2.25 2.25 0 01-.659 1.591M14.25 8.906V3.104M5 14.5h14m-14 0l-.619 1.853A2.25 2.25 0 006.52 19.5h10.96a2.25 2.25 0 002.139-3.147L19 14.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2 2 4-4" />
        </svg>
      ),
    },
    {
      key: "satisfaction",
      card: "border-blue-100 bg-gradient-to-br from-blue-50 to-white",
      chip: "bg-blue-100 text-blue-700",
      num: "text-blue-500",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
    },
    {
      key: "support",
      card: "border-violet-100 bg-gradient-to-br from-violet-50 to-white",
      chip: "bg-violet-100 text-violet-700",
      num: "text-violet-500",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="border-b border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.key}
              className={`flex flex-col gap-3 rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${f.card}`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${f.chip}`}>
                {f.icon}
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${f.num}`}>
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-0.5 text-sm font-bold text-slate-900">
                  {tr[f.key].title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{tr[f.key].desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrustedSourceSection() {
  const { t } = useLanguage();
  const ts = t.home.trusted;

  const pillars = [
    { key: "purity" as const },
    { key: "ruo" as const },
    { key: "dispatch" as const },
    { key: "worldwide" as const },
  ];

  const pillarIcons = {
    purity: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    ruo: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .194.014.386.042.576M5 14.5h14m-14 0l-.619 1.853A2.25 2.25 0 006.52 19.5h10.96a2.25 2.25 0 002.139-3.147L19 14.5" />
      </svg>
    ),
    dispatch: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677" />
      </svg>
    ),
    worldwide: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12c0 .778.099 1.533.284 2.253" />
      </svg>
    ),
  };

  return (
    <section className="bg-[#0B1929] px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-cyan-400">
              {ts.eyebrow}
            </p>
            <h2 className="text-3xl font-extrabold leading-tight text-white md:text-4xl">
              {ts.title}
              <br />
              <span className="text-cyan-400">{ts.titleHighlight}</span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-slate-400">
              {ts.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#06B6D4] to-[#1D4ED8] px-6 py-3 text-sm font-bold text-white transition-all hover:from-cyan-400 hover:to-blue-700 hover:shadow-md md:px-8 md:py-4 md:text-base"
              >
                {ts.browseCompounds}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/lab-results"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-white/40 hover:text-white"
              >
                {ts.viewLabResults}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pillars.map((p) => (
              <div
                key={p.key}
                className="rounded-xl border border-white/8 bg-white/5 p-5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
                  {pillarIcons[p.key]}
                </div>
                <h3 className="mb-1.5 text-sm font-bold text-white">{ts.pillars[p.key].title}</h3>
                <p className="text-xs leading-relaxed text-slate-400">{ts.pillars[p.key].desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function BestsellersHeader() {
  const { t } = useLanguage();
  const bs = t.home.bestsellers;
  return (
    <div className="mb-8 text-center">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
        {bs.topSellers}
      </p>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-3xl">
        {bs.title}
      </h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {bs.subtitle}
      </p>
    </div>
  );
}

export function ShopAllButton() {
  const { t } = useLanguage();
  return (
    <div className="mt-10 flex justify-center">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#1D4ED8] px-8 py-3.5 text-sm font-bold tracking-wide text-white shadow-md transition-all hover:from-cyan-400 hover:to-blue-700 hover:shadow-lg md:px-10 md:py-4 md:text-base"
      >
        {t.common.shopAll}
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  );
}

export function SoldOutBadge() {
  const { t } = useLanguage();
  return t.home.bestsellers.soldOut;
}

export function OutOfStockText() {
  const { t } = useLanguage();
  return t.home.bestsellers.outOfStock;
}

export function FeaturedProductsHeader() {
  const { t } = useLanguage();
  const f = t.home.featured;
  return (
    <div className="mb-12 flex items-end justify-between">
      <div>
        <h2 className="text-3xl font-bold text-blue-900 md:text-4xl">{f.title}</h2>
        <p className="mt-2 text-blue-600/70">{f.subtitle}</p>
      </div>
      <Link
        href="/shop"
        className="hidden text-sm font-semibold text-blue-700 hover:text-blue-900 sm:block"
      >
        {f.viewAll}
      </Link>
    </div>
  );
}

export function CarouselHeader() {
  const { t } = useLanguage();
  return (
    <h2 className="text-3xl font-bold text-blue-900 md:text-4xl">
      {t.home.carousel.title}
    </h2>
  );
}

const TRUST_BADGES = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .194.014.386.042.576m-4.542-.576L5 14.5m9.25-11.396L14.25 8.91M5 14.5h14m-14 0l-.619 1.853A2.25 2.25 0 006.52 19.5h10.96a2.25 2.25 0 002.139-3.147L19 14.5" />
      </svg>
    ),
    label: "HPLC Tested",
    sub: "≥99% Purity",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    label: "3rd Party Verified",
    sub: "Independent lab",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    label: "GMP-Aligned",
    sub: "ISO-grade standards",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
      </svg>
    ),
    label: "Discreet Packaging",
    sub: "No labels outside",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677" />
      </svg>
    ),
    label: "EU Dispatch",
    sub: "1–3 day delivery",
  },
];

export function TrustBadgesStrip() {
  const { t } = useLanguage();
  // Pair each icon (kept in code) with its translated label/sub by index.
  const labels = t.home.trustBadges;
  return (
    <div className="overflow-hidden border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-5 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:justify-between">
          {TRUST_BADGES.map((b, i) => {
            const copy = labels[i] ?? { label: b.label, sub: b.sub };
            return (
              <div key={copy.label} className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {b.icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{copy.label}</p>
                  <p className="text-[10px] text-slate-400">{copy.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Animated Stats Counter ──────────────────────────────────────────────── */

function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

const STATS = [
  { value: 1500, suffix: "+", label: "Researchers served" },
  { value: 99, suffix: "%", label: "Purity guaranteed" },
  { value: 15, suffix: "+", label: "Peptide compounds" },
  { value: 1, suffix: " yr", label: "EU operation" },
];

function StatItem({ value, suffix, label, start }: { value: number; suffix: string; label: string; start: boolean }) {
  const count = useCountUp(value, 1600, start);
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-3xl font-extrabold tabular-nums text-white lg:text-4xl">
        {count.toLocaleString()}{suffix}
      </span>
      <span className="text-xs font-medium uppercase tracking-widest text-white/50">{label}</span>
    </div>
  );
}

export function StatsSection() {
  const { t } = useLanguage();
  const statLabels = t.home.stats;
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="border-b border-white/10 bg-[#0B1929] py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <StatItem
              key={s.label}
              value={s.value}
              suffix={s.suffix}
              label={statLabels[i]?.label ?? s.label}
              start={started}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Newsletter Section ──────────────────────────────────────────────────── */

export function NewsletterSection() {
  const { t } = useLanguage();
  const tn = t.home.newsletter;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="bg-gradient-to-br from-[#0f2c50] to-[#0B1929] py-14">
      <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
          {tn.eyebrow}
        </p>
        <h2 className="text-2xl font-extrabold text-white md:text-3xl">
          {tn.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          {tn.body}
        </p>

        {status === "done" ? (
          <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-5 text-emerald-400">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">{tn.success}</span>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              placeholder={tn.placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3.5 text-sm font-bold text-white transition-all hover:from-cyan-300 hover:to-blue-500 hover:shadow-lg disabled:opacity-60"
            >
              {status === "loading" ? tn.sending : tn.button}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-3 text-xs text-red-300">
            Something went wrong. Please try again.
          </p>
        )}

        <p className="mt-3 text-[11px] text-white/30">
          {tn.disclaimer}
        </p>
      </div>
    </section>
  );
}
