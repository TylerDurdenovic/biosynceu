"use client";

import { useLanguage } from "contexts/language-context";

export default function ShippingContent() {
  const { t } = useLanguage();
  const s = t.shipping;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-600">
        {s.badge}
      </div>
      <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900">{s.title}</h1>
      <p className="mb-8 text-sm text-slate-400">{s.lastUpdated}</p>

      <div className="space-y-6 text-sm leading-relaxed text-slate-600">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-700">{s.ruoNote}</p>
        </div>

        {s.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-2 text-base font-semibold text-slate-800">{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
