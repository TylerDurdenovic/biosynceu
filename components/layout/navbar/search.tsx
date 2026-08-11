"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Form from "next/form";
import { useSearchParams } from "next/navigation";

export default function Search() {
  const searchParams = useSearchParams();

  return (
    <Form
      action="/search"
      // Search is now only rendered at 2xl+ — keep it sized so the cluster
      // fits inside max-w-[1400px] alongside the full nav.
      className="relative w-44"
    >
      <input
        key={searchParams?.get("q")}
        type="text"
        name="q"
        placeholder="Search…"
        autoComplete="off"
        defaultValue={searchParams?.get("q") || ""}
        className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 pr-9 text-sm text-blue-900 placeholder:text-blue-300 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      <div className="pointer-events-none absolute right-0 top-0 mr-3 flex h-full items-center text-blue-300">
        <MagnifyingGlassIcon className="h-4" />
      </div>
    </Form>
  );
}

export function SearchSkeleton() {
  return (
    <form className="relative w-44">
      <input
        placeholder="Search…"
        className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 pr-9 text-sm text-blue-900 placeholder:text-blue-300 shadow-sm"
      />
      <div className="pointer-events-none absolute right-0 top-0 mr-3 flex h-full items-center text-blue-300">
        <MagnifyingGlassIcon className="h-4" />
      </div>
    </form>
  );
}
