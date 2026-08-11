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
    </>
  );
}
