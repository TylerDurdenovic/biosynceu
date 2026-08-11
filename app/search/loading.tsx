export default function Loading() {
  return (
    <div className="bg-[#f6f7f9] px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <li key={i}>
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="aspect-square animate-pulse rounded-t-xl bg-slate-100" />
                  <div className="p-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                    <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
