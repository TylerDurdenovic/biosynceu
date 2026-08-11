"use client";

import { useLanguage } from "contexts/language-context";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "lib/i18n/translations";

const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
];

/** Dropdown for desktop navbar */
export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === lang)!;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-all ${
          open
            ? "border-slate-300 bg-white shadow-sm text-slate-900"
            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-900"
        }`}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span>{current.code.toUpperCase()}</span>
        <svg
          className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Language"
          className="absolute right-0 top-full z-50 mt-1.5 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          {LANGS.map((l) => {
            const isActive = lang === l.code;
            return (
              <button
                key={l.code}
                role="option"
                aria-selected={isActive}
                onClick={() => { setLang(l.code); setOpen(false); }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-slate-900 font-semibold text-white"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span>{l.label}</span>
                {isActive && (
                  <svg
                    className="ml-auto h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Full-width version for mobile drawer — big tap targets */
export function LanguageToggleFull() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="px-3 pb-2">
      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Language / Sprache
      </p>
      <div className="grid grid-cols-2 gap-2">
        {LANGS.map((l) => {
          const isActive = lang === l.code;
          return (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              aria-pressed={isActive}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl border-2 text-sm font-bold transition-all active:scale-95 ${
                isActive
                  ? "border-[#0B1929] bg-[#0B1929] text-white shadow-md"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
              }`}
            >
              <span aria-hidden="true" className="text-2xl leading-none">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** One-tap flag toggle for mobile navbar */
export function LanguageToggleMini() {
  const { lang, setLang } = useLanguage();
  const next = lang === "en" ? "de" : "en";
  const current = LANGS.find((l) => l.code === lang)!;

  return (
    <button
      onClick={() => setLang(next)}
      aria-label={`Switch to ${next === "de" ? "Deutsch" : "English"}`}
      title={`Switch to ${next === "de" ? "Deutsch" : "English"}`}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-base transition-colors hover:bg-slate-100 active:scale-95"
    >
      <span aria-hidden="true">{current.flag}</span>
    </button>
  );
}
