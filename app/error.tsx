"use client";

import { useLanguage } from "contexts/language-context";

export default function Error({ reset }: { reset: () => void }) {
  // useLanguage falls back to the English default if the provider somehow
  // isn't an ancestor, so this is always safe inside an error boundary.
  const { t } = useLanguage();
  const te = t.common.error;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900">{te.title}</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          {te.body}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          {te.tryAgain}
        </button>
        <a
          href="/shop"
          className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          {te.backToShop}
        </a>
      </div>
    </div>
  );
}
