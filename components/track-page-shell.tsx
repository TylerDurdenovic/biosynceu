"use client";

import { useLanguage } from "contexts/language-context";

export function TrackPageShell({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();

  return (
    <>
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{t.track.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{t.track.subtitle}</p>
      </div>

      {/* Form card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {children}
      </div>

      {/* Info strip */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {t.track.infoCards.map(({ title, body }) => (
          <div key={title} className="rounded-xl border border-slate-100 bg-white p-4">
            <svg className="mb-2 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-xs text-slate-500">{body}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        {t.track.cantFind}{" "}
        <a href="/contact" className="font-medium text-blue-600 hover:underline">
          {t.track.contactSupport}
        </a>
      </p>
    </>
  );
}
