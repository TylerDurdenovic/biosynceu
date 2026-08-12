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

    // Original ("was") price for this variant, when it's on sale.
    const compareUnit = selectedVariant.compareAtPrice?.amount
      ? parseFloat(selectedVariant.compareAtPrice.amount)
      : 0;
    const onSale = compareUnit > unitPrice;
    const compareTotal = (compareUnit * quantity).toFixed(2);
    const pct = onSale ? Math.round(((compareUnit - unitPrice) / compareUnit) * 100) : 0;

    return (
      <div className="flex flex-wrap items-baseline gap-2">
        {onSale && (
          <span className="text-lg font-medium text-slate-400 line-through">
            {fmt(compareTotal, currencyCode)}
          </span>
        )}
        <span className={`text-2xl font-bold ${onSale ? "text-red-600" : "text-slate-900"}`}>
          {fmt(totalPrice, currencyCode)}
        </span>
        {onSale && (
          <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
            −{pct}%
          </span>
        )}
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

  // Original range from any on-sale variant, so the range view also reflects
  // a discount when one exists.
  const compareAmts = variants
    .map((v) => (v.compareAtPrice ? parseFloat(v.compareAtPrice.amount) : NaN))
    .filter((n) => !isNaN(n) && n > 0);
  const compareMax = compareAmts.length ? Math.max(...compareAmts) : 0;
  const rangeOnSale = compareMax > min;

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      {rangeOnSale && (
        <span className="text-lg font-medium text-slate-400 line-through">
          {fmt(String(compareMax), currencyCode)}
        </span>
      )}
      <span className={`text-2xl font-bold ${rangeOnSale ? "text-red-600" : "text-slate-900"}`}>
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
