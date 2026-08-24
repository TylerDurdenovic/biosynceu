"use client";

import { useLanguage } from "contexts/language-context";

export function NavbarBars() {
  const { t } = useLanguage();

  return (
    <>
      {/* ── Promo (red) ───────────────────────────────────────────────── */}
      <div className="bg-[#fe0000] px-4 py-1.5 text-center text-[11px] font-bold uppercase tracking-widest text-white">
        {t.nav.promo}
      </div>

      {/* ── RUO compliance strip ──────────────────────────────────────────
          The disclaimer is required in the header as well as the footer,
          PDPs and cart, so it sits directly under the promo bar on every
          page rather than only in the scrolling ticker. */}
      <div className="border-b border-slate-200 bg-slate-100 px-4 py-1 text-center text-[10px] font-medium tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        {t.nav.complianceShort}
      </div>
    </>
  );
}
