"use client";

import { useLanguage } from "contexts/language-context";
import { sorting } from "lib/constants";
import { Collection } from "lib/woocommerce/types";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

interface Props {
  collections: Collection[];
  activeCollection: string | undefined;
  sort: string | undefined;
  count: number;
}

export function ShopMobileControls({
  collections,
  activeCollection,
  sort,
  count,
}: Props) {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const sortRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const ts = t.shop;

  // Close drawers on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Lock body scroll when categories drawer is open
  useEffect(() => {
    document.body.style.overflow = categoriesOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [categoriesOpen]);

  const activeSort = sorting.find((s) => s.slug === sort) ?? sorting[0]!;
  const activeCategoryLabel = activeCollection
    ? (collections.find((c) => c.handle === activeCollection)?.title ?? ts.categoriesLabel)
    : ts.allProducts;

  return (
    <>
      {/* ── Mobile filter bar ──────────────────────────────────────── */}
      <div className="mb-4 lg:hidden">
        {/* Buttons row — full width, no count here to prevent overflow */}
        <div className="flex items-center gap-3">
          {/* Categories button */}
          <button
            type="button"
            onClick={() => setCategoriesOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[.98]"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
            <span className="min-w-0 truncate">{activeCategoryLabel}</span>
            <svg className="h-3 w-3 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Sort dropdown */}
          <div className="relative shrink-0" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[.98]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
              <span>{ts.sortBy}</span>
              <svg
                className={`h-3 w-3 text-slate-400 transition-transform ${sortOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Sort dropdown panel */}
            {sortOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <p className="border-b border-slate-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {ts.sortBy}
                </p>
                {sorting.map((item) => {
                  const isActive = (sort ?? null) === item.slug;
                  const href = activeCollection
                    ? `/shop?collection=${activeCollection}${item.slug ? `&sort=${item.slug}` : ""}`
                    : `/shop${item.slug ? `?sort=${item.slug}` : ""}`;
                  return (
                    <Link
                      key={item.slug ?? "relevance"}
                      href={href}
                      onClick={() => setSortOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                        isActive
                          ? "bg-slate-900 font-semibold text-white"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {item.title}
                      {isActive && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Product count — own row so it never overflows */}
        <p className="mt-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-700">{count}</span> {ts.products}
        </p>
      </div>

      {/* ── Categories slide-in drawer (left) ──────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          categoriesOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setCategoriesOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-900 lg:hidden ${
          categoriesOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">{ts.categoriesLabel}</h2>
          <button
            type="button"
            onClick={() => setCategoriesOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close categories"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer links */}
        <nav className="flex-1 overflow-y-auto">
          {/* All Products */}
          {(() => {
            const href = "/shop";
            const isActive = !activeCollection;
            const isLoading = isPending && activeHref === href;
            return (
              <Link
                href={href}
                onClick={() => {
                  setActiveHref(href);
                  startTransition(() => setCategoriesOpen(false));
                }}
                className={`flex items-center justify-between px-5 py-3.5 text-sm transition-all duration-200 active:scale-[.98] ${
                  isActive
                    ? "bg-slate-900 font-semibold text-white"
                    : "text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-3">
                  <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                  {ts.allProducts}
                </span>
                {isLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
                ) : isActive ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : null}
              </Link>
            );
          })()}

          {/* ── Product type collections ─────────────────────────────── */}
          {(() => {
            const BENEFIT_HANDLES = new Set([
              "longevity-and-anti-aging-research",
              "weight-loss-research",
              "sleep-enhancement-research",
              "immunity-enhancement-research",
              "muscle-growth-research",
              "cognitive-enhancement-research",
              "healing-and-regeneration-research",
            ]);
            const productCollections = collections.filter((c) => !BENEFIT_HANDLES.has(c.handle));
            const benefitCollections  = collections.filter((c) =>  BENEFIT_HANDLES.has(c.handle));

            return (
              <>
                {/* Product type section */}
                {productCollections.length > 0 && (
                  <>
                    <div className="border-t border-slate-100" />
                    {productCollections.map((c) => {
                      const href = `/shop?collection=${c.handle}`;
                      const isActive = activeCollection === c.handle;
                      const isLoading = isPending && activeHref === href;
                      return (
                        <div key={c.handle}>
                          <Link
                            href={href}
                            onClick={() => {
                              setActiveHref(href);
                              startTransition(() => setCategoriesOpen(false));
                            }}
                            className={`flex items-center justify-between px-5 py-3 text-sm transition-all duration-200 active:scale-[.98] ${
                              isActive
                                ? "bg-slate-900 font-semibold text-white"
                                : "text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                            }`}
                          >
                            <span>{c.title}</span>
                            {isLoading ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
                            ) : isActive ? (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            ) : null}
                          </Link>
                          <div className="mx-5 border-t border-slate-100" />
                        </div>
                      );
                    })}
                  </>
                )}

                {/* By Benefits section */}
                {benefitCollections.length > 0 && (
                  <>
                    <div className="border-t border-slate-200" />
                    <p className="px-5 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      By Benefits
                    </p>
                    {benefitCollections.map((c) => {
                      const href = `/shop?collection=${c.handle}`;
                      const isActive = activeCollection === c.handle;
                      const isLoading = isPending && activeHref === href;
                      return (
                        <div key={c.handle}>
                          <Link
                            href={href}
                            onClick={() => {
                              setActiveHref(href);
                              startTransition(() => setCategoriesOpen(false));
                            }}
                            className={`flex items-center justify-between px-5 py-3 text-sm transition-all duration-200 active:scale-[.98] ${
                              isActive
                                ? "bg-slate-900 font-semibold text-white"
                                : "text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                            }`}
                          >
                            <span>{c.title}</span>
                            {isLoading ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
                            ) : isActive ? (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            ) : null}
                          </Link>
                          <div className="mx-5 border-t border-slate-100" />
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            );
          })()}
        </nav>

        {/* RUO notice at bottom */}
        <div className="border-t border-slate-100 px-5 py-4">
          <p className="text-[11px] leading-relaxed text-slate-400">
            <span className="font-semibold text-red-500">{t.common.ruo.forResearchOnly}.</span>{" "}
            {t.common.ruo.notForHuman}.
          </p>
        </div>
      </div>
    </>
  );
}
