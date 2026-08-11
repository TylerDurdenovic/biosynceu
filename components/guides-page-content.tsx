"use client";

import { useLanguage } from "contexts/language-context";
import { GUIDES } from "lib/guides-data";
import Link from "next/link";

export function GuidesPageContent() {
  const { t, lang } = useLanguage();

  return (
    <>
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">
            {t.guides.badge}
          </p>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            {t.guides.title}
          </h1>
          <p className="mt-3 text-slate-500 md:text-lg">
            {t.guides.subtitle}
          </p>
        </div>
      </div>

      {/* Guide cards */}
      <div className="bg-slate-50 px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <ul className="space-y-4">
            {GUIDES.map((guide) => (
              <li key={guide.slug}>
                <Link
                  href={`/guides/${guide.slug}`}
                  className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-start sm:gap-6"
                >
                  <div className="shrink-0">
                    <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-600">
                      {guide.tag}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-700">
                      {guide.title}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      {guide.description}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                      <span>{guide.readTime}</span>
                      <span>·</span>
                      <span>
                        {new Date(guide.publishedAt).toLocaleDateString(
                          lang === "de" ? "de-DE" : "en-GB",
                          { day: "numeric", month: "long", year: "numeric" }
                        )}
                      </span>
                    </div>
                  </div>

                  <svg
                    className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition-colors group-hover:text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-center text-xs text-slate-400">
            {t.guides.disclaimer}
          </p>
        </div>
      </div>
    </>
  );
}
