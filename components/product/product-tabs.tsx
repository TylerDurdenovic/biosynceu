"use client";

import { useLanguage } from "contexts/language-context";
import { getCoaByHandle } from "lib/coa-data";
import { Product } from "lib/woocommerce/types";
import Link from "next/link";
import { useState } from "react";

export function ProductTabs({ product }: { product: Product }) {
  const [active, setActive] = useState("details");
  const { t } = useLanguage();
  const tt = t.product.tabs;
  const coa = getCoaByHandle(product.handle);

  const TABS = [
    { id: "details", label: tt.details },
    { id: "storage", label: tt.storage },
    { id: "certificate", label: tt.labCertificate },
    { id: "quality", label: tt.qualityAssurance },
  ];

  /* Pull milligram values dynamically from any option whose values contain "mg" */
  const mgOption = product.options.find((opt) =>
    opt.values.some((v) => /\d+\s*mg/i.test(v)),
  );
  const mgValues = mgOption?.values.filter((v) => /\d+\s*mg/i.test(v)) ?? [];

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Tab headers */}
      <div className="flex snap-x snap-mandatory overflow-x-auto border-b border-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`shrink-0 snap-start px-3.5 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500 sm:px-5 sm:py-3.5 ${
              active === tab.id
                ? "border-b-2 border-[#0B1929] bg-slate-50 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {/* ── Details ── */}
        {active === "details" && (
          <div className="space-y-0">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {[
                  { label: tt.purityLabel, value: "> 99%" },
                  { label: tt.form, value: tt.lyophilizedPowder },
                  ...(mgValues.length > 0
                    ? [{ label: tt.milligram, value: mgValues.join(", ") }]
                    : []),
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="py-3 pr-6 font-semibold text-slate-500 w-40">
                      {row.label}
                    </td>
                    <td className="py-3 text-slate-900">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Storage ── */}
        {active === "storage" && (
          <div className="space-y-4 text-sm">
            <div className="flex gap-4 rounded-lg border border-slate-200 p-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{tt.storageTitle}</p>
                <p className="mt-0.5 text-slate-600">{tt.storageDesc}</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-lg border border-slate-200 p-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .194.014.386.042.576M5 14.5h14m-14 0l-.619 1.853A2.25 2.25 0 006.52 19.5h10.96a2.25 2.25 0 002.139-3.147L19 14.5" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{tt.afterReconstitution}</p>
                <p className="mt-0.5 text-slate-600">{tt.afterReconstitutionDesc}</p>
              </div>
            </div>
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-700">
              {tt.sunlightWarning}
            </p>
          </div>
        )}

        {/* ── Lab Certificate ── */}
        {active === "certificate" && (
          <div className="space-y-4 text-sm">
            <p className="text-slate-600 leading-relaxed">{tt.certBody}</p>

            {/* Purity + method + last tested */}
            {coa && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Purity", value: coa.purity },
                  { label: "Method", value: coa.method },
                  { label: "Last tested", value: coa.lastTested },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="mt-0.5 font-mono text-xs font-semibold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <div>
                  <p className="font-semibold text-emerald-800">{tt.hplcCert}</p>
                  <p className="mt-1 text-xs text-emerald-700">{tt.hplcCertDesc}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Direct PDF download if we have CoA data */}
              {coa ? (
                <>
                  <a
                    href={coa.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0B1929] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    {tt.openLabReport}
                  </a>
                  <a
                    href={coa.file}
                    download
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </a>
                </>
              ) : (
                <Link
                  href="/lab-results"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  {tt.openLabReport}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Quality Assurance ── */}
        {active === "quality" && (
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">{tt.qaBody}</p>
            <ul className="space-y-2.5">
              {tt.qaItems.map((item) => (
                <li key={item.label} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <span className="font-semibold text-slate-900">{item.label}</span>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
