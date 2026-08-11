export const dynamic = "force-dynamic";

import { ShopAddToCart } from "components/shop-add-to-cart";
import { defaultSort, sorting } from "lib/constants";
import { getCollection, getCollectionProducts } from "lib/woocommerce";
import { shopifyImageSrcSet, shopifyImageUrl } from "lib/woocommerce/image";
import { Product } from "lib/woocommerce/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata(props: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const collection = await getCollection(params.collection).catch(() => undefined);
  if (!collection) return notFound();
  return {
    title: collection.seo?.title || collection.title,
    description:
      collection.seo?.description ||
      collection.description ||
      `${collection.title} products`,
  };
}

function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(amount));
}

function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const min = parseFloat(minVariantPrice.amount);
  const max = parseFloat(maxVariantPrice.amount);
  const currency = minVariantPrice.currencyCode;
  const available = product.availableForSale;
  const isAboveFold = index < 4;
  const featuredUrl = product.featuredImage?.url;

  return (
    <div className="group flex flex-col rounded-lg border border-slate-200 bg-white transition-all hover:border-slate-400 hover:shadow-md">
      {/* Clickable image + info */}
      <Link
        href={`/product/${product.handle}`}
        prefetch={true}
        className="flex-1"
      >
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-slate-50">
          {featuredUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shopifyImageUrl(featuredUrl, { width: 600, quality: 80 })}
              srcSet={
                shopifyImageSrcSet(featuredUrl, [200, 300, 400, 600, 800], 80) ||
                undefined
              }
              sizes="(min-width: 1280px) 280px, (min-width: 768px) 30vw, 50vw"
              width={600}
              height={600}
              loading={isAboveFold ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={isAboveFold ? "high" : "auto"}
              alt={product.featuredImage?.altText ?? product.title}
              className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                className="h-12 w-12 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .194.014.386.042.576"
                />
              </svg>
            </div>
          )}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Research Only
            </span>
            {!available && (
              <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Sold Out
              </span>
            )}
            {available &&
              product.variants.length > 0 &&
              product.variants.every((v) => v.currentlyNotInStock) && (
                <span className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Pre-order
                </span>
              )}
          </div>
        </div>

        <div className="p-3 pb-0">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-slate-700">
            {product.title}
          </h3>

          {/* Prominent variant pills */}
          {(() => {
            const meaningful = product.options.filter(
              (opt) => opt.name.toLowerCase() !== "title"
            );
            if (!meaningful.length) return null;
            return (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {meaningful.map((opt) =>
                  opt.values.map((v) => (
                    <span
                      key={`${opt.name}-${v}`}
                      className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200"
                    >
                      {opt.values.length === 1 ? `${opt.name}: ${v}` : v}
                    </span>
                  ))
                )}
              </div>
            );
          })()}

          <p className="mt-2 text-sm font-bold text-slate-900">
            {!available ? (
              <span className="text-slate-400">Out of stock</span>
            ) : min === max ? (
              formatPrice(minVariantPrice.amount, currency)
            ) : (
              <>
                {formatPrice(minVariantPrice.amount, currency)}
                <span className="mx-1 text-slate-400">–</span>
                {formatPrice(maxVariantPrice.amount, currency)}
              </>
            )}
          </p>
        </div>
      </Link>

      {/* Add to cart — outside the Link */}
      <div className="px-3 pb-3">
        <ShopAddToCart product={product} />
      </div>
    </div>
  );
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [searchParams, params] = await Promise.all([
    props.searchParams,
    props.params,
  ]);
  const { sort } = (searchParams ?? {}) as { sort?: string };
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;

  const [collection, products] = await Promise.all([
    getCollection(params.collection).catch(() => undefined),
    getCollectionProducts({ collection: params.collection, sortKey, reverse }).catch(
      () => [] as Product[]
    ),
  ]);

  if (!collection) return notFound();

  return (
    <>
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="mt-1 text-sm text-slate-500">{collection.description}</p>
          )}
          <p className="mt-1 text-sm text-slate-500">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-[#f6f7f9] px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Sort bar */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sort:
            </span>
            {sorting.map((item) => (
              <Link
                key={item.slug ?? "relevance"}
                href={`/search/${params.collection}?sort=${item.slug ?? ""}`}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  (sort ?? null) === item.slug
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {item.title}
              </Link>
            ))}
          </div>

          {/* Grid */}
          {products.length === 0 ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-slate-200 bg-white">
              <p className="text-slate-500">No products found in this collection.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {products.map((product, index) => (
                <li key={product.handle}>
                  <ProductCard product={product} index={index} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
