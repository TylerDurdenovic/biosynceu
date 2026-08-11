"use client";

import { addItem } from "components/cart/actions";
import { useCart } from "components/cart/cart-context";
import clsx from "clsx";
import { useLanguage } from "contexts/language-context";
import { Product, ProductVariant } from "lib/woocommerce/types";
import { useActionState } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Combination = {
  id: string;
  availableForSale: boolean;
  currentlyNotInStock: boolean;
  [key: string]: string | boolean;
};

export function StickyCartBar({ product }: { product: Product }) {
  const [visible, setVisible] = useState(false);
  const searchParams = useSearchParams();
  const { addCartItem } = useCart();
  const [message, formAction] = useActionState(addItem, null);
  const { t } = useLanguage();

  useEffect(() => {
    const sentinel = document.getElementById("add-to-cart-sentinel");
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry!.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const combinations: Combination[] = product.variants.map((v: ProductVariant) => ({
    id: v.id,
    availableForSale: v.availableForSale,
    currentlyNotInStock: Boolean(v.currentlyNotInStock),
    ...v.selectedOptions.reduce(
      (acc, opt) => ({ ...acc, [opt.name.toLowerCase()]: opt.value }),
      {} as Record<string, string>,
    ),
  }));

  const variant = product.variants.find((v: ProductVariant) =>
    v.selectedOptions.every(
      (opt) => opt.value === searchParams.get(opt.name.toLowerCase()),
    ),
  );
  const defaultVariantId =
    product.variants.length === 1 ? product.variants[0]?.id : undefined;
  const selectedVariantId = variant?.id || defaultVariantId;
  const finalVariant = product.variants.find((v) => v.id === selectedVariantId);

  // Mirror the AddToCart pre-order rule so the sticky bar's button label
  // and color match the main CTA.
  const isPreOrder = finalVariant
    ? Boolean(finalVariant.currentlyNotInStock)
    : product.availableForSale &&
      product.variants.length > 0 &&
      product.variants.every((v) => v.currentlyNotInStock);

  const currencyCode = product.priceRange.minVariantPrice.currencyCode;
  const fmt = (amount: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(parseFloat(amount));

  const displayPrice = finalVariant
    ? fmt(finalVariant.price.amount)
    : (() => {
        const min = parseFloat(product.priceRange.minVariantPrice.amount);
        const max = parseFloat(product.priceRange.maxVariantPrice.amount);
        return min === max
          ? fmt(product.priceRange.minVariantPrice.amount)
          : `${fmt(product.priceRange.minVariantPrice.amount)} – ${fmt(product.priceRange.maxVariantPrice.amount)}`;
      })();

  const hasOptions =
    product.options.length > 1 ||
    (product.options.length === 1 && (product.options[0]?.values.length ?? 0) > 1);

  const updateOption = (name: string, value: string) => {
    // Shallow URL update — see variant-selector for the full rationale. Using
    // router.replace here would re-run the product Server Component (another
    // Shopify fetch) on every sticky-bar chip tap; history.replaceState keeps
    // the URL + useSearchParams in sync with no navigation or network call.
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      const qs = params.toString();
      window.history.replaceState(
        null,
        "",
        qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
      );
    } catch {
      // non-fatal
    }
  };

  const addItemAction = formAction.bind(null, { variantId: selectedVariantId, quantity: 1 });

  return (
    <div
      className={clsx(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.10)] transition-transform duration-300 ease-in-out",
        visible ? "translate-y-0" : "translate-y-full",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-2 py-2.5 sm:gap-3 sm:px-4 sm:py-3 lg:gap-5 lg:px-8">

        {/*
          LEFT — title (where it fits) + selected variant + price.
          On mobile this is a tight stacked column; on md+ everything sits
          on one line and the pill switcher takes over.
        */}
        <div className="min-w-0 flex-1">
          {/* Title only shows on sm+ — on phones we let the price + button win */}
          <p className="hidden truncate text-sm font-semibold text-slate-900 sm:block">
            {product.title}
            {finalVariant && finalVariant.title !== "Default Title" && (
              <span className="ml-1.5 text-xs font-normal text-slate-500">
                · {finalVariant.title}
              </span>
            )}
          </p>

          {/* On phones we show only "Title — variant" in one line above price */}
          <p className="block truncate text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:hidden">
            {finalVariant && finalVariant.title !== "Default Title"
              ? finalVariant.title
              : product.title}
          </p>

          <div className="flex items-baseline gap-1.5">
            <p className="text-base font-bold tabular-nums text-slate-900 sm:text-base">
              {displayPrice}
            </p>
          </div>
        </div>

        {/*
          MIDDLE — pill switcher. Hidden on mobile (the sticky bar can't fit
          pills + price + button at <640px). Customers change variants by
          tapping in the main product panel above; this sticky bar is only
          a "buy now" reminder. Restored at md+.
        */}
        {hasOptions && (
          <div className="hidden min-w-0 flex-wrap items-center gap-1.5 md:flex">
            {product.options.map((option) => (
              <div key={option.id} className="flex items-center gap-1.5">
                <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-slate-400 lg:block">
                  {option.name}
                </span>
                {option.values.map((value) => {
                  const key = option.name.toLowerCase();
                  const isActive = searchParams.get(key) === value;

                  // Mirror VariantSelector availability split: distinguish
                  // truly out-of-stock (disabled, strikethrough) from
                  // pre-orderable (amber, still clickable) so the sticky
                  // bar tells the same story as the main panel above.
                  const matchingCombos = combinations.filter(
                    (c) => c[key] === value,
                  );
                  const inStockCombos = matchingCombos.filter(
                    (c) => c.availableForSale && !c.currentlyNotInStock,
                  );
                  const preOrderCombos = matchingCombos.filter(
                    (c) => c.availableForSale && c.currentlyNotInStock,
                  );
                  const isInStock = inStockCombos.length > 0;
                  const isPreOrderable =
                    !isInStock && preOrderCombos.length > 0;
                  const isOutOfStock = !isInStock && !isPreOrderable;

                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => updateOption(key, value)}
                      title={`${option.name} ${value}${
                        isOutOfStock
                          ? ` (${t.product.outOfStock})`
                          : isPreOrderable
                            ? ` (${t.product.preOrder} — ${t.product.preOrderShipsIn})`
                            : ""
                      }`}
                      className={clsx(
                        "rounded-lg border-2 px-2.5 py-1 text-xs font-semibold transition-all",
                        isActive
                          ? "border-[#06B6D4] bg-[#06B6D4] text-white shadow-md ring-2 ring-cyan-300 ring-offset-1"
                          : isInStock
                            ? "border-slate-200 bg-white text-slate-700 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700"
                            : isPreOrderable
                              ? "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-500 hover:bg-amber-100"
                              : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 line-through",
                      )}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* RIGHT — add to cart / pre-order button.
            Three distinct states so the customer always knows what to do:
              1. Product is OOS                → grey "Out of Stock"
              2. No variant picked yet          → cyan "Select a dose" + mobile hint
              3. Variant picked, in-stock/pre-order → blue/amber CTA */}
        <form
          className="flex shrink-0 flex-col items-stretch"
          action={async () => {
            if (finalVariant) addCartItem(finalVariant, product);
            addItemAction();
          }}
        >
          {(() => {
            const productUnavailable = !product.availableForSale;
            const needsVariant = !productUnavailable && !selectedVariantId;

            const label = productUnavailable
              ? t.product.stickyBar.outOfStock
              : needsVariant
                ? t.product.stickyBar.selectDose
                : isPreOrder
                  ? t.product.stickyBar.preOrder
                  : t.product.stickyBar.addToCart;

            const className = clsx(
              "whitespace-nowrap rounded-xl border-2 px-2.5 py-2 text-[10px] font-semibold shadow-sm transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 sm:px-5 sm:py-2.5 sm:text-sm",
              productUnavailable
                ? "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500"
                : needsVariant
                  ? "animate-pulse cursor-pointer border-cyan-400 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
                  : isPreOrder
                    ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
                    : "border-blue-600 bg-blue-600 text-white hover:bg-blue-700",
            );

            const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
              // When no dose is selected, the button shouldn't actually
              // submit the form. Instead, scroll the customer up to the
              // variant selector and don't fire the cart action.
              if (needsVariant) {
                e.preventDefault();
                const target =
                  document.getElementById("add-to-cart-sentinel") ??
                  document.querySelector("[aria-pressed]");
                target?.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            };

            return (
              <>
                <button
                  type={needsVariant ? "button" : "submit"}
                  disabled={productUnavailable}
                  aria-disabled={productUnavailable || needsVariant}
                  onClick={needsVariant ? handleClick : undefined}
                  className={className}
                >
                  {label}
                </button>
                {needsVariant && (
                  <span className="mt-0.5 hidden text-center text-[10px] font-medium text-cyan-700 sm:block">
                    {t.product.stickyBar.tapToSelect}
                  </span>
                )}
              </>
            );
          })()}
        </form>
      </div>

      <p aria-live="polite" className="sr-only" role="status">
        {message}
      </p>
    </div>
  );
}
