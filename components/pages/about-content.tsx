"use client";

import { useLanguage } from "contexts/language-context";

export default function AboutContent() {
  const { t } = useLanguage();
  const a = t.about;

  return (
    <main className="bg-[#f6f7f9]">
      {/* ── Hero ── */}
      <section className="bg-[#0B1929] px-6 py-20 text-center lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-900/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300">
            {a.badge}
          </div>
          <h1 className="mb-5 text-4xl font-bold tracking-tight text-white md:text-5xl">
            {a.heroTitle}<br className="hidden sm:block" /> {a.heroTitle2}
          </h1>
          <p className="text-lg leading-relaxed text-blue-200">{a.heroBody}</p>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-10 md:grid-cols-2 md:gap-16 md:items-center">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-600">
                {a.missionEyebrow}
              </p>
              <h2 className="mb-5 text-3xl font-bold tracking-tight text-slate-900">
                {a.missionTitle}
              </h2>
              <p className="mb-4 text-base leading-relaxed text-slate-600">{a.missionBody1}</p>
              <p className="text-base leading-relaxed text-slate-600">{a.missionBody2}</p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
              <ul className="space-y-5">
                {a.stats.map(([label, desc]) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <svg className="h-3 w-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pillars ── */}
      <section className="border-t border-slate-200 bg-white px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-600">
              {a.pillarsEyebrow}
            </p>
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{a.pillarsTitle}</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {a.pillars.map((p) => (
              <div key={p.title} className="rounded-xl border border-slate-200 bg-[#f6f7f9] p-6 transition-shadow hover:shadow-md">
                <span className="mb-3 block text-3xl">{p.icon}</span>
                <h3 className="mb-2 text-sm font-bold text-slate-900">{p.title}</h3>
                <p className="text-xs leading-relaxed text-slate-600">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Research Integrity ── */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-600">
            {a.integrityEyebrow}
          </p>
          <h2 className="mb-5 text-2xl font-bold text-slate-900 md:text-3xl">{a.integrityTitle}</h2>
          <p
            className="mb-6 text-base leading-relaxed text-slate-600"
            dangerouslySetInnerHTML={{ __html: a.integrityBody1 }}
          />
          <p className="text-base leading-relaxed text-slate-600">{a.integrityBody2}</p>
        </div>
      </section>

      {/* ── RUO disclaimer ── */}
      <section className="px-6 pb-16 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-bold text-red-700">{t.common.ruo.full}</p>
          <p className="mt-1 text-xs text-red-600">{t.common.ruo.subtext}</p>
        </div>
      </section>
    </main>
  );
}
