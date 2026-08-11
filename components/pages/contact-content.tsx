"use client";

import { useLanguage } from "contexts/language-context";

export default function ContactContent() {
  const { t } = useLanguage();
  const c = t.contact;

  return (
    <main className="bg-[#f6f7f9] min-h-screen">
      {/* ── Header ── */}
      <section className="bg-[#0B1929] px-6 py-20 text-center lg:px-8">
        <div className="mx-auto max-w-xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-900/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300">
            {c.badge}
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
            {c.title}
          </h1>
          <p className="text-lg text-blue-200">{c.body}</p>
          <button
            type="button"
            onClick={() => {
              // Smartsupp JS API (loaded globally in app/layout.tsx)
              if (typeof window === "undefined") return;
              if ("smartsupp" in window) {
                // @ts-expect-error smartsupp is injected by the Smartsupp loader
                window.smartsupp("chat:open");
                return;
              }

              window.open(
                "https://widget-page.smartsupp.com/widget/e3a0bbae73e41db34d88866f40ae5aee14ab93f0",
                "_blank",
                "noopener,noreferrer",
              );
            }}
            className="mx-auto mt-8 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0B1929] shadow-sm transition-colors hover:bg-blue-50"
          >
            Live chat
          </button>
        </div>
      </section>

      {/* ── Email card ── */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-md">
          <a
            href="mailto:research@biosynclabs.to"
            className="group flex flex-col items-center gap-5 rounded-2xl border border-blue-100 bg-white p-10 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl transition-colors group-hover:bg-blue-100">
              ✉️
            </div>
            <div className="text-center">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                {c.emailLabel}
              </p>
              <p className="text-xl font-bold text-blue-700 group-hover:text-blue-800">
                research@biosynclabs.to
              </p>
              <p className="mt-2 text-sm text-slate-500">{c.emailSub}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors group-hover:bg-blue-700">
              {c.sendEmail}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </a>
          <p className="mt-6 text-center text-xs text-slate-400">{c.schedule}</p>
        </div>
      </section>
    </main>
  );
}
