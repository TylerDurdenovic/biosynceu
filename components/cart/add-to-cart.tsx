"use client";

import { CheckIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { addItem } from "components/cart/actions";
import { useProductOptions } from "components/product/product-context";
import { useLanguage } from "contexts/language-context";
import { Product, ProductVariant } from "lib/woocommerce/types";
import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useCart } from "./cart-context";

/* ── Quantity stepper ───────────────────────────────────────────────────── */
function QuantityStepper({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (q: number) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        {t.product.qty}
      </span>
      <div className="flex h-12 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={quantity <= 1}
          onClick={() => onChange(Math.max(1, quantity - 1))}
          className="flex h-full w-12 items-center justify-center border-r border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <MinusIcon className="h-4 w-4" />
        </button>

        <input
          type="number"
          min={1}
          max={50}
          value={quantity}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) onChange(Math.min(50, Math.max(1, v)));
          }}
          className="w-14 bg-transparent text-center text-base font-bold text-slate-900 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <button
          type="button"
          aria-label="Increase quantity"
          disabled={quantity >= 50}
          onClick={() => onChange(Math.min(50, quantity + 1))}
          className="flex h-full w-12 items-center justify-center border-l border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
      <span className="text-[10px] text-slate-400">{t.product.maxQty}</span>
    </div>
  );
}

/* ── Submit button with hover-tick + loading + success states ───────────── */
function SubmitButton({
  availableForSale,
  selectedVariantId,
  isPreOrder,
}: {
  availableForSale: boolean;
  selectedVariantId: string | undefined;
  isPreOrder: boolean;
}) {
  const { pending } = useFormStatus();
  const [showSuccess, setShowSuccess] = useState(false);
  const wasPendingRef = useRef(false);
  const { t } = useLanguage();
  const tp = t.product;

  useEffect(() => {
    if (wasPendingRef.current && !pending) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 1800);
      return () => clearTimeout(timer);
    }
    wasPendingRef.current = pending;
  }, [pending]);

  const base =
    "group relative flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-4 text-base font-semibold tracking-wide text-white shadow-sm transition-all duration-200 md:py-5 md:text-lg";

  if (!availableForSale) {
    return (
      <button disabled className={clsx(base, "cursor-not-allowed bg-slate-400")}>
        {tp.outOfStock}
      </button>
    );
  }

  if (!selectedVariantId) {
    // Stronger disabled state: visibly inert (slate, no gradient) with high
    // WCAG-AA contrast text and an explicit "Select a dose first" label.
    // Removing the cyan-300 here so the disabled CTA doesn't masquerade as
    // an active button.
    return (
      <button
        disabled
        aria-label={tp.selectDoseFirst}
        className={clsx(
          base,
          "cursor-not-allowed border-2 border-dashed border-slate-300 bg-slate-100 text-slate-600 shadow-none",
        )}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 15l7-7 7 7"
          />
        </svg>
        {tp.selectDoseFirst}
      </button>
    );
  }

  if (pending) {
    return (
      <button disabled aria-label={tp.addingToCart} className={clsx(base, "cursor-wait bg-[#06B6D4]")}>
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        {tp.addingToCart}
      </button>
    );
  }

  if (showSuccess) {
    return (
      <button disabled aria-label={tp.addedToCart} className={clsx(base, "bg-emerald-500 shadow-emerald-200")}>
        <CheckIcon className="h-5 w-5" strokeWidth={2.5} />
        {tp.addedToCart}
      </button>
    );
  }

  // Pre-order flow: same submit, just relabelled and amber-tinted so
  // customers know stock is on the way rather than already-here.
  const label = isPreOrder ? tp.preOrder : tp.addToCart;
  const gradient = isPreOrder
    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
    : "bg-gradient-to-r from-[#06B6D4] to-[#1D4ED8] hover:from-cyan-400 hover:to-blue-700";

  return (
    <button
      type="submit"
      aria-label={label}
      className={clsx(
        base,
        "overflow-hidden hover:shadow-md active:scale-[.98]",
        gradient,
      )}
    >
      {/* Default label — hidden on desktop hover */}
      <span className="flex items-center gap-2.5 transition-all duration-200 md:absolute md:group-hover:pointer-events-none md:group-hover:-translate-y-full md:group-hover:opacity-0">
        <ShoppingCartIcon className="h-5 w-5" />
        {label}
      </span>

      {/* Hover label — slides in on desktop hover */}
      <span className="hidden items-center gap-2.5 transition-all duration-200 md:flex md:translate-y-full md:opacity-0 md:absolute md:group-hover:translate-y-0 md:group-hover:opacity-100">
        <CheckIcon className="h-5 w-5" strokeWidth={2.5} />
        {label}
      </span>

      {/* Mobile: always visible, no animation */}
      <span className="flex items-center gap-2.5 md:hidden">
        <ShoppingCartIcon className="h-5 w-5" />
        {label}
      </span>
    </button>
  );
}

/* ── AddToCart wrapper ──────────────────────────────────────────────────── */
export function AddToCart({ product }: { product: Product }) {
  const { variants, availableForSale } = product;
  const { addCartItem } = useCart();
  const { selectedVariant: ctxVariant, quantity, setQuantity } = useProductOptions();
  const [message, formAction] = useActionState(addItem, null);
  const { t } = useLanguage();
  const tp = t.product;

  // Use context-selected variant (instant) falling back to single-variant default
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantId = ctxVariant?.id || defaultVariantId;
  const addItemAction = formAction.bind(null, { variantId: selectedVariantId, quantity });
  // Drop the non-null assertion — `find` legitimately returns undefined when
  // the user hasn't picked an option yet, and the optimistic-update branch
  // below already null-checks before calling addCartItem.
  const finalVariant = variants.find((v: ProductVariant) => v.id === selectedVariantId);

  // Pre-order = the resolved variant has zero stock but "Continue selling
  // when out of stock" is on. When no variant is picked yet, only show
  // pre-order if every variant is in that state — otherwise the customer
  // might think a normal in-stock variant is back-ordered.
  const isPreOrder = finalVariant
    ? Boolean(finalVariant.currentlyNotInStock)
    : availableForSale &&
      variants.length > 0 &&
      variants.every((v) => v.currentlyNotInStock);

  // Persistent context line right under the CTA — explains *why* the label
  // is "Pre-order" vs "Add to Cart" so a label flip doesn't confuse the
  // customer. Aria-live so screen-reader users hear the change.
  const ctaContextLine = !availableForSale
    ? null
    : !selectedVariantId
      ? null
      : isPreOrder
        ? `${tp.preOrder}: ${tp.preOrderShipsIn}`
        : `${tp.inStockShort} · ${tp.dispatchTime}`;

  return (
    <div className="space-y-3">
      {/* Quantity stepper */}
      <QuantityStepper quantity={quantity} onChange={setQuantity} />

      <form
        action={async () => {
          if (finalVariant) addCartItem(finalVariant, product, quantity);
          await addItemAction();
        }}
      >
        <SubmitButton
          availableForSale={availableForSale}
          selectedVariantId={selectedVariantId}
          isPreOrder={isPreOrder}
        />
        {ctaContextLine && (
          <p
            aria-live="polite"
            role="status"
            className={clsx(
              "mt-1.5 text-center text-[11px] font-medium",
              isPreOrder ? "text-amber-700" : "text-emerald-700",
            )}
          >
            {ctaContextLine}
          </p>
        )}
        <p aria-live="polite" className="sr-only" role="status">
          {message}
        </p>
      </form>
    </div>
  );
}
