"use client";

import { useLanguage } from "contexts/language-context";
import Link from "next/link";
import { useEffect, useState } from "react";

const SEEN_KEY = "bsl_shop10_seen";
/** Written by the compliance gates. The promo is the LAST thing a first-time
 *  visitor should see, so it waits for both to be cleared rather than stacking
 *  on top of them. */
const AGE_KEY = "bsl_age_verified_v1";
const EMAIL_GATE_KEY = "bsl_email_gate_v1";
const CODE = "SHOP10";

const STRINGS = {
  en: {
    eyebrow: "Welcome offer",
    off: "10% OFF",
    sub: "your first order",
    use: "Use this code at checkout:",
    copy: "Copy",
    copied: "Copied!",
    cta: "Shop now",
    dismiss: "No thanks",
  },
  de: {
    eyebrow: "Willkommensangebot",
    off: "10% RABATT",
    sub: "auf Ihre erste Bestellung",
    use: "Code an der Kasse eingeben:",
    copy: "Kopieren",
    copied: "Kopiert!",
    cta: "Jetzt einkaufen",
    dismiss: "Nein danke",
  },
} as const;

export function DiscountPopup() {
  const { lang } = useLanguage();
  const s = STRINGS[lang] ?? STRINGS.en;

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(SEEN_KEY)) return;
    // Poll until both gates are cleared, then show the promo.
    const timer = setInterval(() => {
      if (localStorage.getItem(AGE_KEY) && localStorage.getItem(EMAIL_GATE_KEY)) {
        clearInterval(timer);
        setTimeout(() => setOpen(true), 2500);
      }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const copy = () => {
    navigator.clipboard?.writeText(CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Gradient header */}
        <div className="bg-gradient-to-br from-[#06B6D4] to-[#1D4ED8] px-6 pb-8 pt-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-white/80">
            {s.eyebrow}
          </p>
          <p className="mt-2 text-5xl font-extrabold leading-none text-white">
            {s.off}
          </p>
          <p className="mt-1 text-sm font-medium text-white/90">{s.sub}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">{s.use}</p>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 rounded-xl border-2 border-dashed border-[#06B6D4] bg-cyan-50 py-3 dark:bg-cyan-900/20">
              <span className="font-mono text-2xl font-extrabold tracking-[0.2em] text-slate-900 dark:text-white">
                {CODE}
              </span>
            </div>
            <button
              type="button"
              onClick={copy}
              className="shrink-0 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {copied ? s.copied : s.copy}
            </button>
          </div>

          <Link
            href="/shop"
            onClick={dismiss}
            className="mt-4 block rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#1D4ED8] py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            {s.cta}
          </Link>

          <button
            type="button"
            onClick={dismiss}
            className="mt-2 text-xs font-medium text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
          >
            {s.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
