"use client";

import { useLanguage } from "contexts/language-context";

export default function FaqContent() {
  const { t } = useLanguage();
  const f = t.faq;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-700">
        {f.badge}
      </div>
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">{f.title}</h1>
      <p className="mb-10 text-lg text-slate-500">{f.subtitle}</p>

      <div className="space-y-5">
        {f.items.map((faq, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-base font-semibold text-slate-800">{faq.question}</h3>
            <p className="text-sm leading-relaxed text-slate-600">{faq.answer}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-semibold text-red-700">{t.common.ruo.full}</p>
        <p className="mt-1 text-xs text-red-600">{t.common.ruo.subtext}</p>
      </div>
    </main>
  );
}
