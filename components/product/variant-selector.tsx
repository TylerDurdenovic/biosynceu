"use client";

import { CheckIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useLanguage } from "contexts/language-context";
import { ProductOption, ProductVariant } from "lib/woocommerce/types";
import { useSearchParams } from "next/navigation";
import { useProductOptions } from "./product-context";

type Combination = {
  id: string;
  availableForSale: boolean;
  currentlyNotInStock: boolean;
  [key: string]: string | boolean;
};

export function VariantSelector({
  options,
  variants,
}: {
  options: ProductOption[];
  variants: ProductVariant[];
}) {
  const { selected, setOption } = useProductOptions();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const tp = t.product;

  const hasNoOptionsOrJustOneOption =
    !options.length ||
    (options.length === 1 && options[0]?.values.length === 1);

  if (hasNoOptionsOrJustOneOption) return null;

  const combinations: Combination[] = variants.map((variant) => ({
    id: variant.id,
    availableForSale: variant.availableForSale,
    currentlyNotInStock: Boolean(variant.currentlyNotInStock),
    ...variant.selectedOptions.reduce(
      (acc, opt) => ({ ...acc, [opt.name.toLowerCase()]: opt.value }),
      {}
    ),
  }));

  // Has the user already picked any option? Drives the "Select your dose"
  // pulse/arrow cue above the chips.
  const meaningfulOptions = options.filter(
    (o) => !(o.values.length === 1)
  );
  const anySelected = meaningfulOptions.some(
    (o) => selected[o.name.toLowerCase()] !== undefined
  );

  const handleSelect = (optionName: string, value: string) => {
    // Update context immediately — zero-latency button highlight.
    setOption(optionName, value);

    // Sync the URL with a *shallow* history update instead of router.replace.
    //
    // Why this matters: the product page is an async Server Component that
    // calls getProduct() from Shopify. router.replace('?dose=…') makes Next
    // re-render that Server Component — i.e. a fresh Shopify round-trip on
    // EVERY dose tap. On a flaky mobile connection that request can time out
    // or 5xx, and the customer gets the "something went wrong" error screen
    // right after picking a dose. window.history.replaceState updates the URL
    // (and Next's useSearchParams, since v14.1+) WITHOUT any navigation or
    // server fetch — the picker, price and gallery all run off React context,
    // so the UI stays in sync with zero network cost.
    //
    // It's also synchronous, so the try/catch actually catches the rare iOS
    // Safari SecurityError (router.replace deferred the history write, so the
    // old try/catch could never catch it).
    try {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set(optionName, value);
      params.delete("image");
      const qs = params.toString();
      window.history.replaceState(
        null,
        "",
        qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
      );
    } catch {
      // Context update above already gives the chip its instant highlight;
      // failing to sync the URL is non-fatal.
    }
  };

  return (
    <>
      {options.map((option) => {
        const optionKey = option.name.toLowerCase();
        const optionSelected = selected[optionKey] !== undefined;

        return (
          <div key={option.id} className="mb-6">
            {/* Header — clear label + required indicator. When nothing is
                selected we add a pulsing arrow + cyan "Select your dose"
                cue so the customer can't miss that picking a dose is the
                next step. */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-700">
                {option.name.toLowerCase() === "dose" ? tp.vialSizeLabel : option.name}
                <span
                  className="ml-1 font-bold text-rose-600"
                  aria-hidden="true"
                >
                  *
                </span>
                <span className="sr-only"> ({tp.doseRequired})</span>
              </p>
              {!optionSelected && (
                <span
                  className="inline-flex animate-pulse items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-700 ring-1 ring-cyan-200"
                  role="status"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                  {tp.selectYourDose}
                </span>
              )}
            </div>
            <div className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
              {option.values.map((value) => {
                const isActive = selected[optionKey] === value;

                // Availability check: only require the *currently selected*
                // options to match. If the user hasn't picked the other
                // option(s) yet, treat them as wildcards. The previous logic
                // demanded a full combo, which made every chip appear
                // out-of-stock until all options were picked — an apparent
                // "error" on phones where users tap one chip at a time.
                const hypothetical = { ...selected, [optionKey]: value };
                const matchingCombos = combinations.filter((combo) =>
                  Object.entries(hypothetical).every(
                    ([k, v]) => combo[k] === v
                  )
                );
                const inStockCombos = matchingCombos.filter(
                  (c) => c.availableForSale && !c.currentlyNotInStock
                );
                const preOrderCombos = matchingCombos.filter(
                  (c) => c.availableForSale && c.currentlyNotInStock
                );

                const isInStock = inStockCombos.length > 0;
                // Pre-order = available for sale but currently zero stock
                // (Shopify "Continue selling when out of stock"). Customers
                // can still order it; we just show a "ships in 1–3 weeks"
                // hint instead of treating it as out-of-stock.
                const isPreOrderable = !isInStock && preOrderCombos.length > 0;
                const isOutOfStock = !isInStock && !isPreOrderable;
                // Customer can click pre-order chips — only fully OOS chips
                // are interaction-disabled.
                const isClickable = !isOutOfStock;

                const titleStatus = isOutOfStock
                  ? ` (${tp.outOfStock})`
                  : isPreOrderable
                    ? ` (${tp.preOrder} — ${tp.preOrderShipsIn})`
                    : "";

                return (
                  <div
                    key={value}
                    className="flex shrink-0 snap-start flex-col items-stretch gap-1"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        isClickable && !isActive && handleSelect(optionKey, value)
                      }
                      aria-pressed={isActive}
                      aria-disabled={!isClickable}
                      title={`${option.name} ${value}${titleStatus}`}
                      style={{ touchAction: "manipulation" }}
                      className={clsx(
                        "relative flex min-h-[44px] min-w-[56px] items-center justify-center rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 sm:py-1.5",
                        {
                          // Selected — unmistakable: cyan fill + ring + shadow + checkmark
                          "border-[#06B6D4] bg-[#06B6D4] text-white shadow-lg shadow-cyan-200 ring-2 ring-cyan-300 ring-offset-2 scale-[1.06]":
                            isActive,
                          // In stock & not selected — clean hover affordance
                          "border-slate-200 bg-white text-slate-800 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700":
                            !isActive && isInStock,
                          // Pre-order chip — amber tint so customer sees at
                          // a glance it's orderable but not in stock yet.
                          "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-500 hover:bg-amber-100":
                            !isActive && isPreOrderable,
                          // Fully out of stock — strikethrough + gray, not clickable
                          "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 line-through":
                            isOutOfStock,
                        }
                      )}
                    >
                      {isActive && (
                        <CheckIcon
                          className="mr-1 h-4 w-4 shrink-0"
                          strokeWidth={3}
                          aria-hidden="true"
                        />
                      )}
                      {value}
                    </button>
                    {/* Per-chip hint — ships-in-X-weeks for pre-order so the
                        difference vs. in-stock is unmissable; out-of-stock
                        gets a small label so customers know it's not
                        coming back soon. */}
                    {isPreOrderable && (
                      <span className="text-center text-[10px] font-semibold leading-tight text-amber-700">
                        {tp.preOrderChipHint}
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="text-center text-[10px] font-medium leading-tight text-slate-400">
                        {tp.outOfStock}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {/* Screen-reader-only live region announces when a dose is picked
          so non-sighted users know the Add-to-Cart button is now active. */}
      <p className="sr-only" aria-live="polite" role="status">
        {anySelected ? tp.doseSelectedAnnounce : ""}
      </p>
    </>
  );
}
