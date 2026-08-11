"use client";

import { useLanguage } from "contexts/language-context";

export default function PrivacyContent() {
  const { t } = useLanguage();
  const p = t.privacy;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-600">
        {p.badge}
      </div>
      <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900">{p.title}</h1>
      <p className="mb-8 text-sm text-slate-400">{p.lastUpdated}</p>

      <div className="space-y-8 text-sm leading-relaxed text-slate-600">
        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">{p.ruoTitle}</h2>
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-700">
              {t.common.ruo.full}<br />
              {t.common.ruo.subtext}
            </p>
          </div>
          <p>{p.ruoBody}</p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900">{p.privacyTitle}</h2>
          {p.sections.map((section) => (
            <section key={section.heading} className="mb-5">
              <h3 className="mb-1.5 text-base font-semibold text-slate-800">{section.heading}</h3>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
