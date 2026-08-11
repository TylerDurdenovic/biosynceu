"use client";

import { ProductOption, ProductVariant } from "lib/woocommerce/types";
import { useProductOptions } from "./product-context";

function fmt(amount: string, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(amount));
}

export function ProductPrice({
  variants,
  options,
  minAmount,
  maxAmount,
  currencyCode,
}: {
  variants: ProductVariant[];
  options: ProductOption[];
  minAmount: string;
  maxAmount: string;
  currencyCode: string;
}) {
  const { selectedVariant, quantity } = useProductOptions();

  // Guard: only take the per-variant branch when the variant actually carries
  // a price. A malformed/partial variant (no price) would otherwise throw on
  // `.amount` and bubble up to the error boundary — exactly the kind of crash
  // a customer hits mid-selection. Falling through to the range view is safe.
  if (selectedVariant?.price?.amount) {
    const unitPrice = parseFloat(selectedVariant.price.amount);
    const totalPrice = (unitPrice * quantity).toFixed(2);

    return (
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">
          {fmt(totalPrice, currencyCode)}
        </span>
        {quantity > 1 && (
          <span className="text-sm text-slate-400">
            {fmt(selectedVariant.price.amount, currencyCode)} × {quantity}
          </span>
        )}
      </div>
    );
  }

  // No variant selected — show range
  const min = parseFloat(minAmount);
  const max = parseFloat(maxAmount);

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-2xl font-bold text-slate-900">
        {min === max ? (
          fmt(minAmount, currencyCode)
        ) : (
          <>
            {fmt(minAmount, currencyCode)}
            <span className="mx-1.5 font-normal text-slate-400">–</span>
            {fmt(maxAmount, currencyCode)}
          </>
        )}
      </span>
    </div>
  );
}
