"use client";

import { useLanguage } from "contexts/language-context";
import { GridTileImage } from "components/grid/tile";
import Link from "next/link";
import type { Product } from "lib/woocommerce/types";

export function ProductBreadcrumb({ title }: { title: string }) {
  const { t } = useLanguage();
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400">
      <a href="/" className="hover:text-slate-700">{t.product.breadcrumbHome}</a>
      <span>/</span>
      <a href="/shop" className="hover:text-slate-700">{t.product.breadcrumbShop}</a>
      <span>/</span>
      <span className="text-slate-700 line-clamp-1">{title}</span>
    </nav>
  );
}

export function RelatedProductsSection({ products }: { products: Product[] }) {
  const { t } = useLanguage();
  if (!products.length) return null;

  return (
    <div className="mt-12 border-t border-slate-100 pt-10 pb-8">
      <h2 className="mb-6 font-display text-xl font-bold tracking-tight text-slate-900">
        {t.product.relatedTitle}
      </h2>
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {products.map((product) => (
          <li
            key={product.handle}
            className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
          >
            <Link
              className="relative h-full w-full"
              href={`/product/${product.handle}`}
              prefetch={false}
            >
              <GridTileImage
                alt={product.title}
                label={{
                  title: product.title,
                  amount: product.priceRange.maxVariantPrice.amount,
                  currencyCode: product.priceRange.maxVariantPrice.currencyCode,
                }}
                src={product.featuredImage?.url}
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
