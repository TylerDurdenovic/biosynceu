"use client";

import { useMemo, useState } from "react";

type ProductItem = { handle: string; title: string };

/**
 * Internal merchant tool: builds the ready-to-send creator referral link.
 *
 * Pairs with the existing referral flow (lib/affiliate.ts + affiliate-tracker):
 * a link like https://biosynclabs.eu/product/<handle>?ref=<CODE> stores <CODE>
 * in a 30-day cookie, auto-applies it to the cart, carries it through Shopify
 * checkout, and attributes the sale to the creator. The <CODE> must match a
 * real Shopify discount code.
 */
export function CreatorLinkGenerator({
  products,
  baseUrl,
}: {
  products: ProductItem[];
  baseUrl: string;
}) {
  // In local dev baseUrl is http://localhost:3000 — default to the real domain
  // so the links are actually sendable. Editable in case the domain changes.
  const defaultOrigin = baseUrl.includes("localhost")
    ? "https://biosynclabs.eu"
    : baseUrl;

  const [origin, setOrigin] = useState(defaultOrigin);
  const [code, setCode] = useState("");
  const [handle, setHandle] = useState(""); // "" = homepage / whole site
  const [copied, setCopied] = useState(false);

  const cleanCode = code.trim();

  const link = useMemo(() => {
    if (!cleanCode) return "";
    const o = origin.trim().replace(/\/$/, "");
    const path = handle ? `/product/${handle}` : "/";
    return `${o}${path}?ref=${encodeURIComponent(cleanCode)}`;
  }, [origin, handle, cleanCode]);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the link is selectable in the box */
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200";

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Creator Referral Links
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Generate the link to send a creator. When someone clicks it, their code
        is saved for 30&nbsp;days, auto-applied at checkout, and the sale is
        credited to the creator.
      </p>

      {/* How-to */}
      <ol className="mt-5 space-y-1.5 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-900">
        <li>
          <span className="font-semibold">1.</span> In{" "}
          <span className="font-semibold">Shopify Admin → Discounts</span>,
          create a discount code (e.g. <code className="font-mono">HASAN</code>,
          20% off). For automatic commission tracking, attach it to the creator
          in Shopify Collabs.
        </li>
        <li>
          <span className="font-semibold">2.</span> Enter that exact code below
          and pick where to send them.
        </li>
        <li>
          <span className="font-semibold">3.</span> Copy the link and send it to
          your creator.
        </li>
      </ol>

      {/* Form */}
      <div className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
            Creator / discount code
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. HASAN"
            spellCheck={false}
            autoCapitalize="characters"
            className={`${inputClass} font-mono tracking-wide`}
          />
          <p className="mt-1 text-xs text-slate-400">
            Must match a discount code you created in Shopify.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
            Send them to
          </label>
          <select
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className={inputClass}
          >
            <option value="">Homepage (whole site)</option>
            {products.map((p) => (
              <option key={p.handle} value={p.handle}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <details className="group">
          <summary className="cursor-pointer select-none text-xs font-semibold text-slate-500 hover:text-slate-700">
            Site URL (advanced)
          </summary>
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            spellCheck={false}
            className={`${inputClass} mt-2`}
          />
        </details>
      </div>

      {/* Output */}
      <div className="mt-6">
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
          Link to send
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <div className="min-w-0 flex-1 break-all rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 font-mono text-sm text-slate-800">
            {link || (
              <span className="text-slate-400">
                Enter a code above to generate the link…
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={copy}
            disabled={!link}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
