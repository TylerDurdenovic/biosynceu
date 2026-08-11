"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "contexts/language-context";
import {
  groupShopProducts,
  SHOP_GROUP_ORDER,
  type ShopGroupKey,
  type ShopMenuProduct,
} from "lib/shop-groups";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

export default function ShopDropdown({
  isActive,
  products,
}: {
  isActive: boolean;
  products?: ShopMenuProduct[];
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useLanguage();
  const tr = t.nav.shopCategories;

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  // Group the live catalogue into thematic columns. Memoised so we don't
  // re-bucket on every render while the menu is open.
  const grouped = useMemo(
    () => groupShopProducts(products ?? []),
    [products],
  );

  // Only render columns that actually have products.
  const columns = SHOP_GROUP_ORDER.filter(
    (key) => grouped[key].length > 0,
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      {/* Trigger */}
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        className={`group relative flex items-center gap-0.5 whitespace-nowrap px-2.5 py-2 text-[13px] font-medium transition-colors duration-150 ${
          isActive || open
            ? "text-[#06B6D4] dark:text-cyan-400"
            : "text-slate-600 hover:text-[#06B6D4] dark:text-slate-300 dark:hover:text-cyan-400"
        }`}
      >
        {t.nav.shop}
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
        <span
          className={`absolute bottom-0 left-2.5 right-7 h-0.5 origin-left rounded-full bg-[#06B6D4] transition-transform duration-200 dark:bg-cyan-400 ${
            isActive || open ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}
        />
      </button>

      {/* Invisible bridge prevents gap-triggered close */}
      {open && <div className="absolute left-0 top-full h-2 w-full" />}

      {/* Mega-menu — product columns grouped by theme */}
      {open && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-[920px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          role="menu"
        >
          {/* Shop All banner */}
          <div className="mb-4">
            <Link
              href="/shop"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#1D4ED8] px-4 py-3 text-white transition-opacity hover:opacity-90"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold">{t.shop.deptPeptides}</p>
                <p className="truncate text-[11px] text-white/70">{t.shop.deptPeptidesSub}</p>
              </div>
              <svg className="h-5 w-5 shrink-0 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {columns.length === 0 ? (
            // Fallback: if the live catalogue didn't load, keep the menu useful.
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {tr.shopAll} →
            </Link>
          ) : (
            <div
              className="grid gap-x-5 gap-y-1"
              style={{
                gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
              }}
            >
              {columns.map((key) => (
                <div key={key} className="min-w-0">
                  {/* Column heading */}
                  <p className="mb-2 border-b border-slate-100 px-1 pb-2 text-[12px] font-bold text-slate-800 dark:border-slate-700 dark:text-slate-100">
                    {tr.groups[key as ShopGroupKey]}
                  </p>
                  <ul className="space-y-0.5">
                    {grouped[key].map((p) => (
                      <li key={p.handle}>
                        <Link
                          href={`/product/${p.handle}`}
                          role="menuitem"
                          onClick={() => setOpen(false)}
                          className="group flex items-center gap-1.5 rounded-md px-1.5 py-1.5 text-[13px] text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#06B6D4] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-400"
                        >
                          <svg
                            className="h-3 w-3 shrink-0 text-slate-300 transition-colors group-hover:text-[#06B6D4]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            aria-hidden
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                          <span className="truncate">{p.title}</span>
                          {!p.available && (
                            <span className="ml-auto shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-400 dark:bg-slate-700 dark:text-slate-400">
                              Soon
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
