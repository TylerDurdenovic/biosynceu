// Slow cPanel host — give the serverless function room for a cold WC fetch.
export const maxDuration = 30;

import { ShopAddToCart } from "components/shop-add-to-cart";
import { ShopMobileControls } from "components/shop-mobile-controls";
import { WishlistHeart } from "components/wishlist-heart";
import { defaultSort, sorting } from "lib/constants";
import { translations } from "lib/i18n/translations";
import {
  getCollectionProducts,
  getCollections,
  getProducts,
} from "lib/woocommerce";
import { shopifyImageSrcSet, shopifyImageUrl } from "lib/woocommerce/image";
import { Collection, Product } from "lib/woocommerce/types";
import { groupedAllOrder } from "lib/product-category";
import { baseUrl } from "lib/utils";

/**
 * WooCommerce categories that must never surface on the storefront, even if
 * they somehow still hold a product. The vials-only product filter already
 * empties these, but listing them by name means a category can't reappear in
 * the sidebar (or be reached by typing its ?collection= URL) if a product is
 * ever mis-filed.
 */
const OFF_CATALOGUE_COLLECTIONS = new Set([
  "anabolics",
  "steroids",
  "injectables",
  "pct",
  "accessories",
  "consumables",
  "uncategorized",
]);
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

/* ── Benefit research area strip ─────────────────────────────────────────── */
type BenefitArea = {
  handle: string;
  labelEn: string;
  labelDe: string;
  gradient: string;
  iconPath: string;
  imageSrc?: string; // real photo from public/icons — overrides gradient icon when set
};

const BENEFIT_AREAS: BenefitArea[] = [
  {
    handle: "longevity-and-anti-aging-research",
    labelEn: "Longevity Peptides",
    labelDe: "Longevity-Peptide",
    gradient: "from-amber-400 to-orange-500",
    iconPath: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z",
    imageSrc: "/icons/Longevity%20and%20Anti-aging%20Research.png",
  },
  {
    handle: "weight-loss-research",
    labelEn: "Incretin & GLP-1 Analogues",
    labelDe: "Inkretin- & GLP-1-Analoga",
    gradient: "from-cyan-400 to-blue-500",
    iconPath: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    imageSrc: "/icons/Weight%20Loss%20Research.png",
  },
  {
    handle: "sleep-enhancement-research",
    labelEn: "Neuroregulatory Peptides",
    labelDe: "Neuroregulatorische Peptide",
    gradient: "from-indigo-400 to-violet-500",
    iconPath: "M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z",
    imageSrc: "/icons/Sleep%20Enhancement%20Research.png",
  },
  {
    handle: "immunity-enhancement-research",
    labelEn: "Thymic & Immune Peptides",
    labelDe: "Thymische & Immunpeptide",
    gradient: "from-green-400 to-emerald-500",
    iconPath: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
    imageSrc: "/icons/Immunity%20Enhancement%20Research.png",
  },
  {
    handle: "muscle-growth-research",
    labelEn: "Growth-Factor Peptides",
    labelDe: "Wachstumsfaktor-Peptide",
    gradient: "from-orange-400 to-red-500",
    iconPath: "M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0",
    imageSrc: "/icons/Muscle%20Growth%20research.png",
  },
  {
    handle: "cognitive-enhancement-research",
    labelEn: "Nootropic Peptides",
    labelDe: "Nootropische Peptide",
    gradient: "from-yellow-400 to-amber-500",
    iconPath: "M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18",
    imageSrc: "/icons/Cognitive%20Enhancement%20Research.png",
  },
  {
    handle: "healing-and-regeneration-research",
    labelEn: "Regenerative Sequences",
    labelDe: "Regenerative Sequenzen",
    gradient: "from-teal-400 to-cyan-500",
    iconPath: "M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
    imageSrc: "/icons/Healing%20and%20Regeneration%20research.png",
  },
];

/* ── Collection description banners ─────────────────────────────────────── */
type CollectionBanner = {
  tag: string;        // compound class / research area
  headline: string;
  body: string;
  purityNote: string;
};

const COLLECTION_BANNERS: Record<string, CollectionBanner> = {
  "peptides": {
    tag: "Peptide compounds",
    headline: "Research-grade peptides",
    body: "Synthetic peptides for cellular repair, metabolic and regenerative research. All supplied as lyophilized powder with independent HPLC Certificate of Analysis.",
    purityNote: "≥ 99% purity by HPLC",
  },
  "weight-loss": {
    tag: "Metabolic research",
    headline: "Metabolic & weight-management peptides",
    body: "GLP-1, GIP and glucagon receptor agonists used in metabolic pathway and adipose tissue research. Including Retatrutide and next-generation dual/triple agonists.",
    purityNote: "≥ 99% purity · HPLC / NMR verified",
  },
  "accessories": {
    tag: "Lab consumables",
    headline: "Reconstitution & lab accessories",
    body: "Bacteriostatic water and ancillary lab supplies required for correct reconstitution and handling of lyophilized peptide compounds.",
    purityNote: "Laboratory grade",
  },
  "healing": {
    tag: "Tissue repair",
    headline: "Tissue & cellular repair compounds",
    body: "Peptides studied for tissue repair, extracellular matrix synthesis and cellular recovery. Including BPC-157, TB-500 and GHK-Cu.",
    purityNote: "≥ 99% purity by HPLC / LC-MS",
  },
  "anti-aging": {
    tag: "Anti-aging research",
    headline: "Longevity & anti-aging compounds",
    body: "Peptides and coenzymes investigated for their role in cellular senescence, NAD⁺ metabolism and epigenetic maintenance.",
    purityNote: "≥ 99% purity · third-party verified",
  },
};

type ShopT = typeof translations.en.shop | typeof translations.de.shop;

const BENEFIT_META: Record<string, { title: string; description: string; keywords: string[] }> = {
  "longevity-and-anti-aging-research": {
    title: "Longevity Peptides | BioSyncLabs",
    description: "Longevity-class research peptides — GHK-Cu, Epithalon, BPC-157 and more. ≥99% purity by HPLC, CoA per batch. For laboratory research use only.",
    keywords: [
      "anti-aging peptides EU", "longevity peptides buy", "Epithalon buy Germany", "GHK-Cu anti-aging research",
      "Epithalon kaufen", "GHK-Cu kaufen", "Kupferpeptid kaufen", "Peptide für Haut", "Anti-Aging Peptide Deutschland",
      "NAD+ kaufen", "Langlebigkeit Peptide kaufen",
    ],
  },
  "weight-loss-research": {
    title: "Incretin & GLP-1 Analogues | BioSyncLabs",
    description: "Incretin, GLP-1 and GIP receptor agonist sequences — Retatrutide, AOD-9604, Cagrilintide. ≥99% purity by HPLC. For laboratory research use only.",
    keywords: [
      "metabolic research peptides EU", "Retatrutide buy EU", "GLP-1 peptides research Germany", "AOD-9604 buy",
      "Retatrutide kaufen", "AOD-9604 kaufen",
    ],
  },
  "sleep-enhancement-research": {
    title: "Neuroregulatory Peptides | BioSyncLabs",
    description: "Neuroregulatory peptide sequences — DSIP, Selank, Pinealon. ≥99% purity by HPLC, CoA per batch. For laboratory research use only.",
    keywords: [
      "sleep peptides research", "DSIP buy EU", "sleep enhancement compounds Germany",
      "DSIP kaufen", "Selank kaufen", "Peptide für Schlaf", "Schlaf Peptide Deutschland", "Schlafpeptide kaufen",
    ],
  },
  "immunity-enhancement-research": {
    title: "Thymic & Immune Peptides | BioSyncLabs",
    description: "Thymic and immune-class peptide sequences — Thymalin, TB-500, KPV. ≥99% purity by HPLC, CoA per batch. For laboratory research use only.",
    keywords: [
      "immunity peptides EU", "Thymosin Alpha-1 buy", "TB-500 immune research Germany",
      "TB-500 kaufen", "BPC-157 kaufen", "Peptide für Immunsystem", "Immunstärkung Peptide kaufen Deutschland",
    ],
  },
  "muscle-growth-research": {
    title: "Growth-Factor Peptides | BioSyncLabs",
    description: "Growth-factor and secretagogue sequences — CJC-1295, Ipamorelin, GHRP-2. ≥99% purity by HPLC, CoA per batch. For laboratory research use only.",
    keywords: [
      "muscle growth peptides EU", "muscle recovery peptides", "CJC-1295 buy Germany", "Ipamorelin research EU",
      "Peptide für Muskelaufbau", "Peptide für Muskeln", "Peptide für Wachstum", "CJC-1295 kaufen",
      "Ipamorelin kaufen", "GHRP-6 kaufen", "Muskelaufbau Peptide kaufen Deutschland", "Follistatin 344 kaufen",
    ],
  },
  "cognitive-enhancement-research": {
    title: "Nootropic Peptides | BioSyncLabs",
    description: "Nootropic-class peptide sequences — Semax, Selank, PE 22-28. ≥99% purity by HPLC, CoA per batch. For laboratory research use only.",
    keywords: [
      "cognitive peptides EU", "Semax buy Germany", "nootropic peptides research EU",
      "Semax kaufen", "Selank kaufen", "kognitive Peptide kaufen", "Nootropika Peptide Deutschland",
      "Peptide für Konzentration", "Peptide für Gedächtnis",
    ],
  },
  "healing-and-regeneration-research": {
    title: "Regenerative Sequences | BioSyncLabs",
    description: "Regenerative peptide sequences — BPC-157, TB-500, GHK-Cu. ≥99% purity by HPLC, CoA per batch. For laboratory research use only.",
    keywords: [
      "tissue repair peptides EU", "BPC-157 buy Germany", "TB-500 regeneration research", "regeneration peptides EU",
      "BPC-157 kaufen", "TB-500 kaufen", "GHK-Cu kaufen", "Peptide für Regeneration",
      "BPC-157 kaufen Deutschland",
    ],
  },
};

export async function generateMetadata(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<Metadata> {
  const sp = await props.searchParams;
  const collection = (sp?.collection as string | undefined) ?? "";
  const specific = collection ? BENEFIT_META[collection] : undefined;

  return {
    title: specific?.title ?? "Shop Research Peptides | BPC-157, TB-500, GHK-Cu, Retatrutide & More",
    description:
      specific?.description ??
      "Browse all BioSyncLabs research-grade peptides. Buy BPC-157, TB-500, GHK-Cu, Retatrutide, CJC-1295, Ipamorelin and more — shipped from Germany across the EU. ≥99% purity, CoA available online.",
    keywords: specific?.keywords ?? [
      "buy peptides Germany", "research peptides EU", "peptide shop EU",
      "BPC-157 buy", "TB-500 buy EU", "GHK-Cu buy", "Retatrutide buy",
      "CJC-1295 buy", "Ipamorelin buy Germany", "peptide supplier Germany",
      "lyophilized peptides buy", "Peptide kaufen Deutschland", "Peptide bestellen EU",
    ],
    alternates: {
      canonical: collection ? `/shop?collection=${collection}` : "/shop",
    },
  };
}

/* ── Collection banner strip ─────────────────────────────────────────────── */
function CollectionBannerStrip({ handle }: { handle: string }) {
  const banner = COLLECTION_BANNERS[handle.toLowerCase()];
  if (!banner) return null;
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-slate-50 px-5 py-5">
      <span className="mb-1.5 inline-block text-[10px] font-bold uppercase tracking-widest text-blue-500">
        {banner.tag}
      </span>
      <h2 className="text-base font-bold text-slate-900">{banner.headline}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{banner.body}</p>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none">
          <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {banner.purityNote}
      </div>
    </div>
  );
}

/* ── Category icon map (simple SVG paths, no emojis) ─────────────────────── */
function CategoryIcon({ handle }: { handle: string }) {
  const h = handle.toLowerCase();

  if (h.includes("peptide") || h.includes("cellular"))
    return (
      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.059l.094.044a2.25 2.25 0 002.732-.66 2.25 2.25 0 00.356-2.118l-1.79-7.158A2.25 2.25 0 0015.75 3.1m-6 0a24.301 24.301 0 00-4.5 0m0 0A2.25 2.25 0 002.79 4.944l-1.79 7.158a2.25 2.25 0 00.356 2.118 2.25 2.25 0 002.732.66l.094-.044A2.25 2.25 0 005.75 12.818V7.104" />
      </svg>
    );

  if (h.includes("water") || h.includes("bac") || h.includes("hydrat"))
    return (
      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" />
      </svg>
    );

  if (h.includes("accessor") || h.includes("kit") || h.includes("supply"))
    return (
      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );

  /* default: flask/research icon */
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .194.014.386.042.576m-4.793-2.27a2.25 2.25 0 01.659-1.591M15 3.104v5.714c0 .194-.014.386-.042.576M15 3.104c.251.023.501.05.75.082M19 14.5l-4.091-4.091" />
    </svg>
  );
}

/* ── Benefit research area visual strip ──────────────────────────────────── */

function BenefitCategoryStrip({
  activeCollection,
  lang,
}: {
  activeCollection: string | undefined;
  lang: "en" | "de";
}) {
  return (
    <div className="border-b border-slate-200 bg-white">
      {/* On desktop the left category sidebar (lg:w-56 + gap-8) pushes the
          product grid right, so a viewport-centered icon row looks off to the
          left. Nudge the whole strip right on lg+ so it sits over the grid —
          kept to ~11rem so the 9 icons still fit on one row on laptops. */}
      <div className="mx-auto max-w-7xl px-6 py-5 lg:pl-44 lg:pr-8">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          {lang === "de" ? "Forschungsbereiche" : "Research Areas"}
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:justify-center lg:overflow-visible">
          {/* All products card */}
          <Link
            href="/shop"
            className={`flex w-[100px] shrink-0 flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all ${
              !activeCollection
                ? "border-[#06B6D4] bg-cyan-50 shadow-sm"
                : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white"
            }`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#1D4ED8]">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </span>
            <span className={`w-full break-words text-[11px] font-semibold leading-tight ${!activeCollection ? "text-[#06B6D4]" : "text-slate-600"}`}>
              {lang === "de" ? "Alle" : "All"}
            </span>
          </Link>

          {BENEFIT_AREAS.map((area) => {
            const isActive = activeCollection === area.handle;
            const label = lang === "de" ? area.labelDe : area.labelEn;
            return (
              <Link
                key={area.handle}
                href={`/shop?collection=${area.handle}`}
                className={`flex w-[100px] shrink-0 flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all ${
                  isActive
                    ? "border-[#06B6D4] bg-cyan-50 shadow-sm"
                    : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white"
                }`}
              >
                {/* Clean vector glyphs (not the AI photo icons) — consistent
                    and unambiguous at this small size. The photos in
                    /public/icons read oddly when shrunk (one looked like the
                    Libra zodiac scales), so the selector uses the gradient
                    SVG for every category. */}
                <span className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${area.gradient}`}>
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={area.iconPath} />
                  </svg>
                </span>
                <span className={`w-full break-words text-[11px] font-semibold leading-tight ${isActive ? "text-[#06B6D4]" : "text-slate-600"}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Sidebar category list ────────────────────────────────────────────────── */
function CategorySidebar({
  collections,
  activeCollection,
  allProductsCount,
  collectionCounts,
  ts,
}: {
  collections: Collection[];
  activeCollection: string | undefined;
  allProductsCount: number;
  collectionCounts: Record<string, number>;
  ts: ShopT;
}) {
  return (
    <aside className="w-full lg:w-56 lg:shrink-0">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {ts.categoriesLabel}
          </p>
        </div>
        <ul className="py-1.5">
          {/* All */}
          <li>
            <Link
              href="/shop"
              className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                !activeCollection
                  ? "border-l-2 border-slate-900 bg-slate-50 font-semibold text-slate-900"
                  : "border-l-2 border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                {ts.allProducts}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
                  !activeCollection
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {allProductsCount}
              </span>
            </Link>
          </li>

          {collections.map((c) => {
            const count = collectionCounts[c.handle] ?? 0;
            const isActive = activeCollection === c.handle;
            return (
              <li key={c.handle}>
                <Link
                  href={`/shop?collection=${c.handle}`}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "border-l-2 border-slate-900 bg-slate-50 font-semibold text-slate-900"
                      : "border-l-2 border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <CategoryIcon handle={c.handle} />
                    <span className="truncate">{c.title}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* RUO notice */}
      <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">
        <p className="text-[11px] leading-snug text-red-600">
          <strong>RUO</strong> — {ts.allProducts}
        </p>
      </div>
    </aside>
  );
}


/* ── Sort select (client-safe static links) ───────────────────────────────── */
function SortBar({
  activeCollection,
  sort,
  count,
  ts,
}: {
  activeCollection: string | undefined;
  sort: string | undefined;
  count: number;
  ts: ShopT;
}) {
  const base = activeCollection ? `/shop?collection=${activeCollection}` : "/shop";

  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <p className="text-sm text-slate-500">
        <span className="font-medium text-slate-800">{count}</span>{" "}
        {ts.products}
      </p>
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400">{ts.sortBy}:</span>
        <div className="flex flex-wrap gap-1">
          {sorting.map((item) => (
            <Link
              key={item.slug ?? "relevance"}
              href={`${base}${base.includes("?") ? "&" : "?"}sort=${item.slug ?? ""}`}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                (sort ?? null) === item.slug
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Shared price formatter ───────────────────────────────────────────────── */
function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(amount));
}

function PriceDisplay({ product, ts }: { product: Product; ts: ShopT }) {
  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const min = parseFloat(minVariantPrice.amount);
  const max = parseFloat(maxVariantPrice.amount);
  const currency = minVariantPrice.currencyCode;

  if (!product.availableForSale) {
    return <span className="text-slate-400">{ts.outOfStock}</span>;
  }

  // Struck-through original price when on sale. We show it only for a single
  // effective price (min === max) so a discounted product reads cleanly as
  // "€100 €50"; mixed-price ranges just show the range to avoid confusion.
  const compareMax = product.compareAtPriceRange
    ? parseFloat(product.compareAtPriceRange.maxVariantPrice.amount)
    : 0;
  const showCompare = min === max && compareMax > min;

  return (
    <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      {showCompare && (
        <span className="whitespace-nowrap text-sm font-medium text-slate-400 line-through">
          {formatPrice(product.compareAtPriceRange!.maxVariantPrice.amount, currency)}
        </span>
      )}
      {/* Current price (or range) — keep on its own line so it never wraps
          mid-range like "€149.90 – \n €329.90" */}
      <span className={`whitespace-nowrap ${showCompare ? "font-bold text-red-600" : ""}`}>
        {min === max
          ? formatPrice(minVariantPrice.amount, currency)
          : `${formatPrice(minVariantPrice.amount, currency)} – ${formatPrice(maxVariantPrice.amount, currency)}`}
      </span>
    </span>
  );
}

/* ── Product card ─────────────────────────────────────────────────────────── */
function ProductCard({
  product,
  ts,
  index = 0,
}: {
  product: Product;
  ts: ShopT;
  /** Position in the grid — used to mark above-the-fold images as eager. */
  index?: number;
}) {
  const available = product.availableForSale;

  /* Primary variant axis (e.g. "Dose") and ALL its values. The shop list never
     fetches variations, so we read the option values straight off the product's
     attributes — this is what lets a card advertise every dose (5mg, 10mg…)
     instead of just the first one. */
  const meaningfulOpts = product.options.filter(
    (opt) => opt.name.toLowerCase() !== "title"
  );
  const variantValues: string[] = meaningfulOpts[0]?.values ?? [];

  // First 4 cards are above the fold on desktop / 2 on mobile — preload them
  // eagerly so the LCP image isn't held up by lazy loading.
  const isAboveFold = index < 4;
  const featuredUrl = product.featuredImage?.url;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-slate-300 hover:shadow-md">
      <Link
        href={`/product/${product.handle}`}
        prefetch={false}
        className="flex-1"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          {featuredUrl ? (
            // Shopify CDN serves WebP/AVIF natively + supports ?width= resizing,
            // so we hand-build the srcset instead of going through next/image
            // (which is unoptimized in this project — see next.config.ts).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shopifyImageUrl(featuredUrl, { width: 600, quality: 80 })}
              srcSet={
                shopifyImageSrcSet(featuredUrl, [200, 300, 400, 600, 800], 80) ||
                undefined
              }
              sizes="(min-width: 1280px) 280px, (min-width: 768px) 30vw, 50vw"
              width={600}
              height={600}
              loading={isAboveFold ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={isAboveFold ? "high" : "auto"}
              alt={product.featuredImage?.altText ?? product.title}
              className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .194.014.386.042.576m-4.793-2.27a2.25 2.25 0 01.659-1.591M15 3.104v5.714c0 .194-.014.386-.042.576" />
              </svg>
            </div>
          )}
          {/* Badges — sold-out / pre-order / sale */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {!available && (
              <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                {ts.soldOut}
              </span>
            )}
            {/* Pre-order badge: shown when every sellable variant is on
                "Continue selling when out of stock" with zero inventory. */}
            {available &&
              product.variants.length > 0 &&
              product.variants.every((v) => v.currentlyNotInStock) && (
                <span className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Pre-order
                </span>
              )}
            {/* Sale badge with the discount percentage — language-neutral. */}
            {available && product.compareAtPriceRange && (() => {
              const now = parseFloat(product.priceRange.minVariantPrice.amount);
              const was = parseFloat(product.compareAtPriceRange.maxVariantPrice.amount);
              const pct = was > now ? Math.round(((was - now) / was) * 100) : 0;
              return pct > 0 ? (
                <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  −{pct}%
                </span>
              ) : null;
            })()}
          </div>
          {/* Wishlist heart */}
          <WishlistHeart
            item={{
              handle: product.handle,
              title: product.title,
              imageUrl: product.featuredImage?.url,
              imageAlt: product.featuredImage?.altText,
              price: product.priceRange.minVariantPrice.amount,
              currencyCode: product.priceRange.minVariantPrice.currencyCode,
            }}
            className="absolute right-2 top-2 h-8 w-8"
          />
        </div>

        {/* Info — clean hierarchy: title → small dose pill (if any) → price */}
        <div className="px-3 pt-3">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-slate-900 group-hover:text-slate-700">
            {product.title}
          </h3>

          {variantValues.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {variantValues.map((v) => (
                <span
                  key={v}
                  className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-600"
                >
                  {v}
                </span>
              ))}
            </div>
          )}

          <p className="mt-1.5 text-base font-bold text-slate-900">
            <PriceDisplay product={product} ts={ts} />
          </p>
        </div>
      </Link>

      {/* Add to cart */}
      <div className="px-3 pb-3 pt-1">
        <ShopAddToCart product={product} />
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default async function ShopPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { sort, collection: activeCollection } = (searchParams ?? {}) as {
    sort?: string;
    collection?: string;
  };

  /* ── Language from cookie ── */
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value === "de" ? "de" : "en";
  const ts = translations[lang].shop;

  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;

  // Wrap every Shopify call in a fallback so a transient upstream error
  // (HTML maintenance page, "upstream connect error", rate limit) renders
  // an empty shop page instead of crashing the whole route.
  const collections = await getCollections().catch(() => [] as Awaited<ReturnType<typeof getCollections>>);
  const listedCollections = collections.filter(
    (c) =>
      c.handle &&
      !c.handle.startsWith("hidden") &&
      !OFF_CATALOGUE_COLLECTIONS.has(c.handle),
  );

  /* Fetch in parallel:
     - main product list for the visible page
     - the full catalogue (for the "All" total + per-collection badge counts)
     Both come back already filtered to vials only — pens, HGH, anabolics and
     accessories are dropped in lib/woocommerce, so nothing here has to
     re-filter them out. */
  const [pageProductsRaw, allProductsList] = await Promise.all([
    (activeCollection
      ? getCollectionProducts({ collection: activeCollection, sortKey, reverse })
      : getProducts({ sortKey, reverse })
    ).catch(() => [] as Product[]),
    (activeCollection ? getProducts({}) : Promise.resolve(null)).catch(() => null),
  ]);

  // Full catalogue (for counts). On the default All view the page list already
  // IS the full catalogue, so reuse it rather than fetching twice.
  const fullList: Product[] = allProductsList ?? (!activeCollection ? pageProductsRaw : []);

  let products: Product[] = pageProductsRaw;
  if (!activeCollection && !sort) {
    // Default "All" view: merchandising order (flagship vials first).
    products = groupedAllOrder(products);
  }

  const allProductsCount = fullList.length || products.length;

  // Badge counts come from the already-filtered catalogue rather than
  // WooCommerce's raw category counts, which still include the hidden pens /
  // HGH / anabolics / accessories and would overstate every category.
  const collectionCounts: Record<string, number> = {};
  for (const c of listedCollections) {
    collectionCounts[c.handle] = fullList.filter((p) =>
      p.categories.includes(c.handle),
    ).length;
  }

  // A category left empty by the vials-only filter must not show up as a dead
  // 0-product link either.
  const visibleCollections = listedCollections.filter(
    (c) => (collectionCounts[c.handle] ?? 0) > 0,
  );

  const activeTitle = activeCollection
    ? (visibleCollections.find((c) => c.handle === activeCollection)?.title ?? "Collection")
    : ts.allProducts;

  // ── Structured data ───────────────────────────────────────────────
  // BreadcrumbList → drives the Home › Shop › {Collection} trail in SERPs.
  const shopUrl = activeCollection
    ? `${baseUrl}/shop?collection=${activeCollection}`
    : `${baseUrl}/shop`;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${baseUrl}/shop` },
      ...(activeCollection
        ? [{ "@type": "ListItem", position: 3, name: activeTitle, item: shopUrl }]
        : []),
    ],
  };

  // ItemList → tells Google this is a product listing page so it can
  // surface the products as a carousel rich result. Capped at 30 to keep
  // the JSON-LD payload reasonable.
  const itemListElements = products.slice(0, 30).map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `${baseUrl}/product/${p.handle}`,
    name: p.title,
  }));

  // CollectionPage → exposes the shop / category view as a navigable
  // collection (eligible for SiteNavigationElement sitelinks) and embeds
  // the product ItemList as its mainEntity. Named after the active category
  // when one is selected, otherwise the full shop.
  const collectionDescription = activeCollection
    ? BENEFIT_META[activeCollection]?.description ??
      COLLECTION_BANNERS[activeCollection.toLowerCase()]?.body ??
      `Research-grade ${activeTitle} peptides from BioSyncLabs — ≥99% purity, shipped from Germany across the EU.`
    : "Browse all BioSyncLabs research-grade peptides — BPC-157, TB-500, GHK-Cu, Retatrutide, CJC-1295, Ipamorelin and more. ≥99% purity, shipped from Germany across the EU.";

  const collectionName = activeCollection
    ? `${activeTitle} Research Peptides`
    : "Shop Research Peptides";

  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${shopUrl}#collectionpage`,
    name: collectionName,
    url: shopUrl,
    description: collectionDescription,
    isPartOf: { "@type": "WebSite", "@id": `${baseUrl}/#website` },
    breadcrumb: breadcrumbJsonLd,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: itemListElements,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }}
      />
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
            <Link href="/" className="hover:text-slate-700">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-slate-700">{ts.breadcrumb}</Link>
            {activeCollection && (
              <>
                <span>/</span>
                <span className="text-slate-700">{activeTitle}</span>
              </>
            )}
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{activeTitle}</h1>
        </div>
      </div>

      {/* ── Research areas ──────────────────────────────────────────── */}
      <BenefitCategoryStrip activeCollection={activeCollection} lang={lang} />

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="bg-slate-50 px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">

          {/* Mobile: categories drawer + sort dropdown */}
          <ShopMobileControls
            collections={visibleCollections}
            activeCollection={activeCollection}
            sort={sort}
            count={products.length}
          />

          <div className="flex gap-8">
            {/* Sidebar (desktop) */}
            <div className="hidden lg:block">
              <div className="sticky top-[72px]">
                <CategorySidebar
                  collections={visibleCollections}
                  activeCollection={activeCollection}
                  allProductsCount={allProductsCount}
                  collectionCounts={collectionCounts}
                  ts={ts}
                />
              </div>
            </div>

            {/* Product area */}
            <div className="min-w-0 flex-1">
              {/* Category description banner */}
              {activeCollection && (
                <CollectionBannerStrip handle={activeCollection} />
              )}

              {/* Desktop sort bar only */}
              <div className="hidden lg:block">
                <SortBar
                  activeCollection={activeCollection}
                  sort={sort}
                  count={products.length}
                  ts={ts}
                />
              </div>

              {products.length > 0 ? (
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {products.map((product, index) => (
                    <li key={product.handle}>
                      <ProductCard product={product} ts={ts} index={index} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-lg border border-slate-200 bg-white text-center">
                  <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .194.014.386.042.576" />
                  </svg>
                  <div>
                    <p className="font-semibold text-slate-700">{ts.noProducts}</p>
                    <p className="mt-1 text-sm text-slate-400">{ts.noProductsSub}</p>
                  </div>
                  <Link
                    href="/shop"
                    className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    {ts.allProducts}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
