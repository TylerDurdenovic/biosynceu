"use client";

import { useLanguage } from "contexts/language-context";
import { useWishlist } from "contexts/wishlist-context";
import Image from "next/image";
import Link from "next/link";
import { WishlistHeart } from "./wishlist-heart";

export function WishlistPageContent() {
  const { items } = useWishlist();
  const { t } = useLanguage();

  const fmt = (amount: string, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(parseFloat(amount));

  return (
    <>
      <h1 className="mb-8 text-2xl font-bold text-slate-900">{t.wishlist.title}</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white py-16 text-center">
          <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <div>
            <p className="font-semibold text-slate-700">{t.wishlist.empty}</p>
            <p className="mt-1 text-sm text-slate-400">{t.wishlist.emptyHint}</p>
          </div>
          <Link
            href="/shop"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
          >
            {t.wishlist.browseProducts}
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <li key={item.handle} className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md">
              <Link href={`/product/${item.handle}`} className="flex-1">
                <div className="relative aspect-square overflow-hidden bg-slate-50">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.imageAlt ?? item.title}
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5" />
                      </svg>
                    </div>
                  )}
                  <WishlistHeart item={item} className="absolute right-2 top-2 h-7 w-7" />
                </div>

                <div className="px-3 py-3">
                  <p className="line-clamp-2 text-sm font-semibold leading-tight text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {fmt(item.price, item.currencyCode)}
                  </p>
                </div>
              </Link>

              <div className="px-3 pb-3">
                <Link
                  href={`/product/${item.handle}`}
                  className="block w-full rounded-lg bg-blue-600 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  {t.wishlist.viewProduct}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
