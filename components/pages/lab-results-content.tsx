"use client";

import { useLanguage } from "contexts/language-context";
import { type CoaEntry } from "lib/coa-data";
import { useMemo, useState } from "react";

function VerifiedBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
      <svg
        className="h-3 w-3 shrink-0"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden
      >
        <path
          d="M10 3L5 8.5 2 5.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {text}
    </span>
  );
}

function CoaCard({ item }: { item: CoaEntry }) {
  const { t } = useLanguage();
  const lr = t.labResults;
  // Per-card peak position derived from the handle so each card looks
  // distinct but is stable across renders. Range: ~28–72 (% across the
  // chromatogram strip), avoiding the badges at the corners.
  const seed = Array.from(item.handle).reduce(
    (acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0,
    0,
  );
  const peakX = 28 + (seed % 45); // 28..72
  // Some CoAs are file-only (no metadata yet) — show what we have, invent nothing.
  const subtitle = [item.variant, item.cas ? `CAS ${item.cas}` : ""]
    .filter(Boolean)
    .join(" · ");
  const hasStats = Boolean(item.method || item.lastTested);
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg">
      {/* Chromatogram-thumbnail header — feels lab-authentic vs a generic
          PDF icon. SVG draws a baseline + one peak at a per-card position,
          with subtle grid lines. Method label + purity badge sit on top. */}
      <div className="relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-[#0B1929] to-slate-800">
        {/* Faint vertical grid (mimics x-axis ticks) */}
        <div className="absolute inset-0 opacity-[0.08]" aria-hidden>
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.45) 0, rgba(255,255,255,0.45) 1px, transparent 1px, transparent 40px)",
            }}
          />
        </div>

        {/* Chromatogram peak SVG (responsive) */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 32"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id={`peak-fill-${item.handle}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Baseline + Gaussian peak using a quadratic bezier silhouette. */}
          <path
            d={`M0 28 L${peakX - 4} 28 Q${peakX - 2} 28 ${peakX - 1} 22 Q${peakX} 4 ${peakX + 1} 22 Q${peakX + 2} 28 ${peakX + 4} 28 L100 28`}
            fill={`url(#peak-fill-${item.handle})`}
            stroke="#67E8F9"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
          {/* Faint horizontal baseline rule */}
          <line
            x1="0"
            x2="100"
            y1="28"
            y2="28"
            stroke="#67E8F9"
            strokeOpacity="0.18"
            strokeWidth="0.4"
          />
        </svg>

        {/* Bottom-left method pill (overlays the chromatogram) */}
        {item.method && (
          <div className="absolute bottom-2 left-3 z-10">
            <span className="rounded-sm bg-cyan-500/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-300 ring-1 ring-cyan-500/30">
              {item.method.toUpperCase()}
            </span>
          </div>
        )}

        {/* Top-left compound abbreviation — a small visual identifier */}
        <div className="absolute left-3 top-3 z-10">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-200/70">
            {item.product.replace(/[^A-Za-z0-9]+/g, " ").trim().slice(0, 18)}
          </span>
        </div>

        {/* Purity badge anchored top-right on the preview */}
        {item.purity && (
          <div className="absolute right-3 top-3 z-10">
            <VerifiedBadge text={item.purity} />
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-3 p-5">
        <div>
          <p className="font-display text-lg font-bold leading-tight text-slate-900">
            {item.product}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs font-medium text-slate-400">{subtitle}</p>
          )}
          {item.batch && (
            <p className="mt-1.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-slate-500">
              Batch {item.batch}
            </p>
          )}
        </div>

        {item.description && (
          <p className="line-clamp-2 text-[12px] leading-relaxed text-slate-500">
            {item.description}
          </p>
        )}

        {/* Stats row */}
        {hasStats && (
          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            {item.method && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  {lr.methodLabel}
                </p>
                <p className="mt-0.5 font-mono text-xs font-semibold text-slate-800">
                  {item.method}
                </p>
              </div>
            )}
            {item.lastTested && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  {lr.lastTestedLabel}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-800">
                  {item.lastTested}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-1 flex gap-2">
          <a
            href={item.file}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:from-emerald-500 hover:to-cyan-500 hover:shadow-md active:scale-[.98]"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            {lr.viewCoA}
          </a>
          <a
            href={item.file}
            download
            aria-label={`Download ${item.product} CoA`}
            className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LabResultsContent({ items }: { items: CoaEntry[] }) {
  const { t } = useLanguage();
  const lr = t.labResults;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => {
      const hay =
        `${c.product} ${c.variant} ${c.cas} ${c.method} ${c.description}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, items]);

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#0B1929]">
        {/* Decorative grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Glow */}
        <div
          aria-hidden
          className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-cyan-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">
              {lr.badge}
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            {lr.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
            {lr.subtitle}
          </p>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap gap-2.5">
            {lr.trustBar.map((item) => (
              <span
                key={item.text}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-200 backdrop-blur-sm"
              >
                <svg
                  className="h-3 w-3 text-cyan-400"
                  fill="none"
                  viewBox="0 0 12 12"
                  aria-hidden
                >
                  <path
                    d="M10 3L5 8.5 2 5.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {item.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats + Search bar ───────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="flex h-2 w-2 items-center justify-center rounded-full bg-emerald-500">
                <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500 opacity-75" />
              </span>
              {filtered.length} {lr.ofWord} {items.length} {lr.compounds}
            </span>
            <span className="hidden h-3.5 w-px bg-slate-200 sm:block" />
            <span className="hidden sm:inline">
              {lr.allVerified}
            </span>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lr.searchPlaceholder}
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Card grid ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.6}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {lr.noMatchTitle}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {lr.noMatchSub}
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              {lr.showAll}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <CoaCard key={item.file} item={item} />
            ))}
          </div>
        )}

        {/* ── Missing CoA / contact box ──────────────────────────────── */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow-sm">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">
                  {lr.missingCoATitle}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {lr.missingCoABody}{" "}
                  <a
                    href="mailto:research@biosynclabs.to"
                    className="font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
                  >
                    research@biosynclabs.to
                  </a>{" "}
                  {lr.missingCoASuffix}
                </p>
              </div>
            </div>
            <a
              href="mailto:research@biosynclabs.to"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0B1929] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-slate-700"
            >
              {lr.requestCoA}
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* ── RUO Disclaimer ──────────────────────────────────────────── */}
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-800">
            {t.common.ruo.full}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-red-700">
            {t.common.ruo.subtextLong}
          </p>
        </div>
      </div>
    </div>
  );
}
