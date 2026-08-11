"use client";

import { addItem } from "components/cart/actions";
import { useCart } from "components/cart/cart-context";
import { useLanguage } from "contexts/language-context";
import Image from "next/image";
import Link from "next/link";
import { Product } from "lib/woocommerce/types";
import { useActionState, useState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

function CompactSubmitButton({ available }: { available: boolean }) {
  const { t } = useLanguage();
  const tf = t.product.fbt;
  const { pending } = useFormStatus();
  const [ok, setOk] = useState(false);
  const wasRef = useRef(false);

  useEffect(() => {
    if (wasRef.current && !pending) {
      setOk(true);
      const timer = setTimeout(() => setOk(false), 1800);
      return () => clearTimeout(timer);
    }
    wasRef.current = pending;
  }, [pending]);

  if (!available) {
    return (
      <button disabled className="rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-400">
        {tf.outOfStock}
      </button>
    );
  }
  if (ok) {
    return (
      <button disabled className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white">
        ✓ {tf.added}
      </button>
    );
  }
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
    >
      {pending ? "…" : `+ ${tf.add}`}
    </button>
  );
}

export function FrequentlyBoughtTogether({ upsell }: { upsell: Product }) {
  const { t } = useLanguage();
  const tf = t.product.fbt;
  const { addCartItem } = useCart();
  const [, formAction] = useActionState(addItem, null);

  // Pick the first available variant so multi-variant products (e.g. BAC Water 3ml)
  // are never incorrectly shown as out of stock.
  const variant = upsell.variants.find((v) => v.availableForSale) ?? upsell.variants[0];
  const addItemAction = formAction.bind(null, { variantId: variant?.id, quantity: 1 });

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: upsell.priceRange.minVariantPrice.currencyCode,
    minimumFractionDigits: 2,
  }).format(parseFloat(upsell.priceRange.minVariantPrice.amount));

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          {tf.heading}
        </p>
      </div>

      <div className="flex items-center gap-4 p-5">
        {/* Product image */}
        <Link
          href={`/product/${upsell.handle}`}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50"
        >
          {upsell.featuredImage?.url && (
            <Image
              src={upsell.featuredImage.url}
              alt={upsell.featuredImage.altText ?? upsell.title}
              fill
              sizes="80px"
              className="object-contain p-1.5"
            />
          )}
        </Link>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <Link
            href={`/product/${upsell.handle}`}
            className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-blue-700"
          >
            {upsell.title}
          </Link>
          <p className="mt-0.5 text-xs text-slate-500">
            {tf.requiredSub}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900">{price}</p>
        </div>

        {/* Compact add to cart */}
        <form
          className="shrink-0"
          action={async () => {
            if (variant) addCartItem(variant, upsell, 1);
            await addItemAction();
          }}
        >
          <CompactSubmitButton available={upsell.availableForSale && !!variant} />
        </form>
      </div>
    </div>
  );
}
