/**
 * Shown instantly by Next.js while the new collection RSC payload is being
 * fetched — turns the perceived multi-second wait when a user switches
 * category into a sub-100ms "something happened" feedback.
 *
 * Keep this component pure layout (no server data fetches) so it ships in
 * the static prerender and renders on the client without any network work.
 */
export default function ShopLoading() {
  return (
    <>
      {/* ── Header skeleton ───────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-2 h-3 w-40 animate-pulse rounded bg-slate-100" />
          <div className="h-7 w-64 animate-pulse rounded bg-slate-200 md:h-8" />
        </div>
      </div>

      {/* ── Benefit research strip skeleton ───────────────────────── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5 lg:px-8">
          <div className="mb-3 h-3 w-32 animate-pulse rounded bg-slate-100" />
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="flex w-[100px] shrink-0 flex-col items-center gap-2 rounded-xl bg-slate-50 p-3"
              >
                <div className="h-14 w-14 animate-pulse rounded-xl bg-slate-200" />
                <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content skeleton ─────────────────────────────────── */}
      <div className="bg-slate-50 px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-8">
            {/* Sidebar skeleton (desktop only) */}
            <aside className="hidden w-56 shrink-0 lg:block">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="space-y-1 px-2 py-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-2 py-2.5"
                    >
                      <div className="h-3.5 w-28 animate-pulse rounded bg-slate-100" />
                      <div className="h-4 w-6 animate-pulse rounded-full bg-slate-100" />
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Product grid skeleton */}
            <div className="min-w-0 flex-1">
              <div className="mb-6 hidden items-center justify-between lg:flex">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-7 w-48 animate-pulse rounded bg-slate-100" />
              </div>

              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <li
                    key={i}
                    className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="aspect-square w-full animate-pulse bg-slate-100" />
                    <div className="space-y-2 px-3 pb-3 pt-3">
                      <div className="h-3.5 w-full animate-pulse rounded bg-slate-100" />
                      <div className="h-3.5 w-3/4 animate-pulse rounded bg-slate-100" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                      <div className="mt-2 h-9 w-full animate-pulse rounded-md bg-slate-100" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
