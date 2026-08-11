"use client";

import { CheckIcon, PlusIcon } from "@heroicons/react/24/outline";
import { addItem } from "components/cart/actions";
import { useCart } from "components/cart/cart-context";
import { useLanguage } from "contexts/language-context";
import { Product, ProductVariant } from "lib/woocommerce/types";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

function Btn({
  available,
  hasVariants,
  handle,
  isPreOrder,
}: {
  available: boolean;
  hasVariants: boolean;
  handle: string;
  isPreOrder: boolean;
}) {
  const { pending } = useFormStatus();
  const [success, setSuccess] = useState(false);
  const wasPending = useRef(false);
  const { t } = useLanguage();
  const tp = t.product;

  useEffect(() => {
    if (wasPending.current && !pending) {
      setSuccess(true);
      const timer = setTimeout(() => setSuccess(false), 1600);
      return () => clearTimeout(timer);
    }
    wasPending.current = pending;
  }, [pending]);

  if (hasVariants) {
    // Multi-variant: still send the customer to the product page to pick a
    // dose, but label it "Pre-order" (amber) when every variant is pre-order
    // so the status reads the same as the product page.
    return (
      <Link
        href={`/product/${handle}`}
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
          isPreOrder
            ? "border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400 hover:bg-amber-100"
            : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        }`}
      >
        {isPreOrder ? tp.preOrder : tp.selectOption}
      </Link>
    );
  }

  if (!available) {
    return (
      <button disabled className="flex w-full items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed">
        {tp.outOfStock}
      </button>
    );
  }

  if (pending) {
    return (
      <button disabled className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white cursor-wait ${isPreOrder ? "bg-amber-500" : "bg-blue-500"}`}>
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        {tp.adding}
      </button>
    );
  }

  if (success) {
    return (
      <button disabled className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white">
        <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
        {tp.added}
      </button>
    );
  }

  // Single-variant: pre-order shows the same amber "Pre-order" as the product
  // page; in-stock shows the normal blue "Add to Cart".
  return (
    <button
      type="submit"
      className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all active:scale-[.97] ${
        isPreOrder
          ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
          : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      <PlusIcon className="h-3.5 w-3.5" />
      {isPreOrder ? tp.preOrder : tp.addToCart}
    </button>
  );
}

export function ShopAddToCart({ product }: { product: Product }) {
  const { addCartItem } = useCart();
  const [, formAction] = useActionState(addItem, null);

  // Use options (variation attributes) to detect multi-variant products.
  // product.variants is always length 1 from getProducts() because variations
  // aren't fetched in the shop list — so we can't rely on variants.length.
  const isSingleVariant =
    product.options.length === 0 ||
    (product.options.length === 1 &&
      product.options[0]?.name.toLowerCase() === "title" &&
      product.options[0]?.values.length === 1);

  const defaultVariant: ProductVariant | undefined = product.variants[0];

  // Pre-order = on sale ("Continue selling when out of stock") but zero stock.
  // Single variant → that variant's flag; multi-variant → only when EVERY
  // variant is pre-order (mirrors the product page's no-selection logic).
  const isPreOrder = isSingleVariant
    ? product.availableForSale && Boolean(defaultVariant?.currentlyNotInStock)
    : product.availableForSale &&
      product.variants.length > 0 &&
      product.variants.every((v) => v.currentlyNotInStock);

  if (!isSingleVariant) {
    return (
      <div className="mt-3">
        <Btn
          available={product.availableForSale}
          hasVariants={true}
          handle={product.handle}
          isPreOrder={isPreOrder}
        />
      </div>
    );
  }

  const addItemAction = formAction.bind(null, {
    variantId: defaultVariant?.id,
    quantity: 1,
  });

  return (
    <form
      className="mt-3"
      action={async () => {
        if (defaultVariant) addCartItem(defaultVariant, product, 1);
        await addItemAction();
      }}
    >
      <Btn
        available={product.availableForSale}
        hasVariants={false}
        handle={product.handle}
        isPreOrder={isPreOrder}
      />
    </form>
  );
}
