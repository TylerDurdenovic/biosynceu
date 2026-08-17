"use client";

import clsx from "clsx";
import { Dialog, Transition } from "@headlessui/react";
import {
  ShoppingCartIcon,
  XMarkIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  ChevronDownIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import LoadingDots from "components/loading-dots";
import Price from "components/price";
import { DEFAULT_OPTION } from "lib/constants";
import { createUrl } from "lib/utils";
import { CartItem, Product, ProductVariant } from "lib/woocommerce/types";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useActionState, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  addItem,
  applyDiscount,
  createCartAndSetCookie,
  redirectToCheckout,
  removeDiscount,
  setCartAttributes,
} from "./actions";
import { useCart } from "./cart-context";
import { DeleteItemButton } from "./delete-item-button";
import { EditItemQuantityButton } from "./edit-item-quantity-button";
import OpenCart from "./open-cart";
import { useLanguage } from "contexts/language-context";

type MerchandiseSearchParams = {
  [key: string]: string;
};

/* ─── Coupon Input ───────────────────────────────────────────────────────── */
function CouponInput({ appliedCodes }: { appliedCodes?: { code: string; applicable: boolean }[] }) {
  const [couponCode, setCouponCode] = useState("");
  const router = useRouter();
  const { t } = useLanguage();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [pending, setPending] = useState(false);

  const activeCode = appliedCodes?.find((d) => d.applicable);

  async function handleApply() {
    const code = couponCode.trim();
    if (!code || pending) return;
    setPending(true);
    try {
      const res = await applyDiscount(null, code);
      setResult(res);
      if (res.success) router.refresh();
    } catch {
      setResult({ success: false, message: "Error applying code. Please try again." });
    } finally {
      setPending(false);
    }
  }

  async function handleRemove() {
    setPending(true);
    try {
      await removeDiscount(null, new FormData());
      setCouponCode("");
      setResult(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="flex items-center justify-center gap-1.5 border-b border-blue-100 px-4 py-2.5">
        <TagIcon className="h-3.5 w-3.5 text-blue-500" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600">
          {t.cart.discountCode}
        </span>
      </div>

      <div className="px-4 py-3">
        {activeCode ? (
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-600" />
              <span className="text-sm font-bold text-green-800">{activeCode.code}</span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                {t.cart.applied}
              </span>
            </div>
            <button
              onClick={handleRemove}
              disabled={pending}
              className="ml-2 shrink-0 text-[11px] font-medium text-red-500 underline-offset-2 hover:underline disabled:opacity-50"
            >
              {t.cart.remove}
            </button>
          </div>
        ) : (
          <div className="flex items-stretch gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApply();
                }
              }}
              placeholder={t.cart.enterCode}
              // text-base (16px) on mobile keeps iOS Safari from zooming in
              // on focus; sm:text-xs restores the compact look on tablets+.
              className="min-w-0 flex-1 rounded-lg border border-blue-100 bg-white px-3 py-2.5 text-base font-semibold uppercase tracking-widest text-blue-900 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 sm:text-xs"
            />
            <button
              onClick={handleApply}
              disabled={pending || !couponCode.trim()}
              className="shrink-0 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? <LoadingDots className="bg-white" /> : t.cart.apply}
            </button>
          </div>
        )}

        {result && !activeCode && (
          <div
            className={clsx(
              "mt-2.5 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium",
              result.success
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            )}
          >
            {result.success ? (
              <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <XCircleIcon className="h-3.5 w-3.5 shrink-0" />
            )}
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── BAC-water relevance ─────────────────────────────────────────────────
   Only nudge bacteriostatic water when the cart actually holds a lyophilised
   peptide vial that must be reconstituted. Nagging someone buying the water
   itself, a pre-filled pen, syringes, or an oral compound reads as broken —
   so anything matching these keywords is treated as "doesn't need
   reconstitution". Checked against the product handle, product title, and the
   selected variant title (catches e.g. an "Oral" variant of an otherwise
   injectable peptide). */
const NON_RECONSTITUTION_KEYWORDS = [
  "water",
  "bacteriostatic",
  "syringe",
  "needle",
  "insulin",
  "pen", // pre-filled pens ship ready to use
  "oral",
  "capsule",
  "tablet",
  "softgel",
  "nasal",
  "spray",
  "cream",
  "gel",
];

function lineNeedsBacWater(line: CartItem): boolean {
  const hay =
    `${line.merchandise.product.handle} ${line.merchandise.product.title} ${line.merchandise.title}`.toLowerCase();
  return !NON_RECONSTITUTION_KEYWORDS.some((kw) => hay.includes(kw));
}

/** Show the BAC-water upsell only when (a) it isn't already in the cart and
 *  (b) at least one line is a reconstitution-needing vial. */
function cartNeedsBacWater(lines: CartItem[], upsellHandle: string): boolean {
  if (lines.some((l) => l.merchandise.product.handle === upsellHandle)) return false;
  return lines.some(lineNeedsBacWater);
}

/* ─── Upsell Banner ──────────────────────────────────────────────────────── */
/* The amber card, "required for reconstitution" heading and collapse control
   are provided by the <details> accordion that wraps this — here we render
   only the explanation + the BAC-water product row. */
function UpsellBanner({
  product,
  addCartItem,
}: {
  product: Product;
  addCartItem: (variant: ProductVariant, product: Product) => void;
}) {
  const { t } = useLanguage();
  // Always add the 3 ml variant. Normalise the option value (lowercase + strip
  // spaces) so "3ml", "3 ml", "3ML" all match — WooCommerce stores whatever the
  // owner typed. Only fall back to the first variant if there's no 3 ml option.
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");
  const targetVariant =
    product.variants.find((v) =>
      v.selectedOptions.some((o) => norm(o.value) === "3ml"),
    ) ??
    product.variants.find((v) =>
      v.selectedOptions.some((o) => norm(o.value).includes("3ml")),
    ) ??
    product.variants[0];

  const [message, formAction] = useActionState(addItem, null);
  const addItemAction = formAction.bind(null, { variantId: targetVariant?.id, quantity: 1 });

  if (!targetVariant) return null;

  return (
    <>
      {/* Explanation */}
      <p className="mb-3 text-[11px] leading-snug text-amber-800">
        {t.cart.reconstitutionDesc}
      </p>

      {/* Product row */}
      <div className="flex items-center gap-3">
        {product.featuredImage?.url && (
          <Link href={`/product/${product.handle}`} className="flex-none">
            <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-amber-100 bg-white shadow-sm">
              <Image
                src={product.featuredImage.url}
                alt={product.featuredImage.altText || product.title}
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            </div>
          </Link>
        )}
        <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <Link
              href={`/product/${product.handle}`}
              className="block truncate text-sm font-semibold leading-snug text-amber-900 hover:text-amber-700"
            >
              {product.title}{" "}
              <span className="text-xs font-normal text-amber-600">(3ml)</span>
            </Link>
            <Price
              className="text-xs text-amber-600"
              amount={targetVariant.price.amount}
              currencyCode={targetVariant.price.currencyCode}
            />
          </div>
          <form
            action={async () => {
              addCartItem(targetVariant, product);
              addItemAction();
            }}
          >
            <button
              type="submit"
              aria-label={`Add ${product.title} 3ml to cart`}
              className="flex flex-none items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700 active:scale-95"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {t.cart.addBacWater}
            </button>
          </form>
        </div>
      </div>
      <p aria-live="polite" className="sr-only" role="status">
        {message}
      </p>
    </>
  );
}

/* ─── Cart Modal ─────────────────────────────────────────────────────────── */
export default function CartModal({ upsellProduct }: { upsellProduct?: Product }) {
  const { cart, updateCartItem, addCartItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { t } = useLanguage();
  const quantityRef = useRef(cart?.totalQuantity ?? 0);
  const [prefs, setPrefs] = useState({
    saveInfo: true,
    emailOffers: true,
    smsOffers: true,
  });
  // Tracks whether an add animation is currently in flight, preventing
  // the optimistic-reconciliation flicker (qty 1→2→1) from re-triggering the open.
  const animatingRef = useRef(false);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  useEffect(() => {
    if (!cart) {
      createCartAndSetCookie();
    }
  }, [cart]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("biosync_cart_prefs");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<typeof prefs>;
      setPrefs((p) => ({
        saveInfo: typeof parsed.saveInfo === "boolean" ? parsed.saveInfo : p.saveInfo,
        emailOffers: typeof parsed.emailOffers === "boolean" ? parsed.emailOffers : p.emailOffers,
        smsOffers: typeof parsed.smsOffers === "boolean" ? parsed.smsOffers : p.smsOffers,
      }));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("biosync_cart_prefs", JSON.stringify(prefs));
    } catch {
      // ignore
    }

    // Best-effort: store preferences on the Shopify cart too.
    // These do NOT automatically toggle Shopify's native checkout marketing checkboxes,
    // but they persist server-side for later use (pixels/flows/checkout extensions).
    // Skip when there's no cart yet — otherwise the action fires with
    // cartId=undefined and Shopify rejects it (visible as an error in
    // Safari's web inspector on iPhone right before checkout).
    if (!cart?.id) return;
    setCartAttributes(null, [
      { key: "save_info_next_time", value: prefs.saveInfo ? "true" : "false" },
      { key: "marketing_email_opt_in", value: prefs.emailOffers ? "true" : "false" },
      { key: "marketing_sms_opt_in", value: prefs.smsOffers ? "true" : "false" },
    ]);
  }, [prefs, cart?.id]);

  useEffect(() => {
    const currQty = cart?.totalQuantity ?? 0;
    const prevQty = quantityRef.current;

    // Always keep ref in sync so re-adding after removal works correctly.
    quantityRef.current = currQty;

    if (currQty > prevQty && !animatingRef.current) {
      animatingRef.current = true;
      setIsAdding(true);

      // Clear the scale-up animation after 600 ms.
      const animTimer = setTimeout(() => setIsAdding(false), 600);

      // Open the cart drawer after the animation finishes.
      const openTimer = setTimeout(() => {
        animatingRef.current = false;
        if (!isOpen) setIsOpen(true);
      }, 750);

      return () => {
        clearTimeout(animTimer);
        clearTimeout(openTimer);
      };
    }
  }, [cart?.totalQuantity]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddCartItem = useCallback(
    (variant: ProductVariant, product: Product) => {
      addCartItem(variant, product);
    },
    [addCartItem],
  );

  return (
    <>
      <button aria-label="Open cart" onClick={openCart}>
        <OpenCart quantity={cart?.totalQuantity} isAdding={isAdding} />
      </button>

      <Transition show={isOpen}>
        <Dialog onClose={closeCart} className="relative z-50">
          {/* Overlay */}
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-100 backdrop-blur-[.5px]"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100 backdrop-blur-[.5px]"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-blue-900/20 backdrop-blur-sm" aria-hidden="true" />
          </Transition.Child>

          {/* Panel */}
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel
              className="fixed bottom-0 right-0 top-0 flex h-[100dvh] w-full sm:w-[88vw] max-w-[420px] flex-col border-l border-blue-100 bg-[#f6f7f9] px-3 pt-5 sm:px-5 text-blue-900 shadow-2xl"
              style={{
                // Reserve space for the iPhone home indicator so the checkout
                // button isn't hidden behind the bottom safe area on iOS.
                paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
              }}
            >
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCartIcon className="h-5 w-5 text-blue-700" />
                  <p className="text-base font-bold text-blue-900">{t.cart.title}</p>
                  {cart?.totalQuantity ? (
                    <span className="rounded-full bg-blue-700 px-2 py-0.5 text-xs font-bold text-white">
                      {cart.totalQuantity}
                    </span>
                  ) : null}
                </div>
                <button
                  aria-label="Close cart"
                  onClick={closeCart}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-100 bg-white text-blue-600 transition-colors hover:bg-blue-50"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Empty state */}
              {!cart || cart.lines.length === 0 ? (
                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex flex-1 flex-col items-center justify-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                      <ShoppingCartIcon className="h-10 w-10 text-blue-300" />
                    </div>
                    <p className="text-lg font-bold text-blue-900">{t.cart.empty}</p>
                    <p className="text-sm text-blue-400">
                      {t.cart.emptySub}
                    </p>
                    <button
                      onClick={closeCart}
                      className="rounded-full bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-800"
                    >
                      {t.cart.continueShopping}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-0 flex-col overflow-hidden">
                  {/* Single scrollable region wrapping BOTH the items list
                      AND the BAC-water upsell card. Keeping them in one
                      scroll container means the upsell never gets clipped
                      against the fixed-height totals/checkout footer below
                      — it just scrolls into view. */}
                  <div className="min-h-0 grow overflow-auto pr-1">
                  <ul>
                    {cart.lines
                      .sort((a, b) => {
                        const aIsBAC = a.merchandise.product.handle === upsellProduct?.handle;
                        const bIsBAC = b.merchandise.product.handle === upsellProduct?.handle;
                        if (aIsBAC && !bIsBAC) return -1;
                        if (!aIsBAC && bIsBAC) return 1;
                        return a.merchandise.product.title.localeCompare(b.merchandise.product.title);
                      })
                      .map((item, i) => {
                        const merchandiseSearchParams =
                          {} as MerchandiseSearchParams;

                        item.merchandise.selectedOptions.forEach(
                          ({ name, value }) => {
                            if (value !== DEFAULT_OPTION) {
                              merchandiseSearchParams[name.toLowerCase()] =
                                value;
                            }
                          }
                        );

                        const merchandiseUrl = createUrl(
                          `/product/${item.merchandise.product.handle}`,
                          new URLSearchParams(merchandiseSearchParams)
                        );

                        const isBAC = item.merchandise.product.handle === upsellProduct?.handle;

                        return (
                          <li
                            key={i}
                            // Tighter spacing between items so more fit at
                            // once on small screens. BAC ring trimmed to a
                            // single 1px amber border instead of the heavy
                            // 2-layer ring that used to dominate the drawer.
                            className={`mb-2 overflow-hidden rounded-xl border bg-white ${
                              isBAC ? "border-amber-300" : "border-blue-100"
                            }`}
                          >
                            {isBAC && (
                              <div className="flex items-center gap-1.5 border-b border-amber-200 bg-amber-50 px-3 py-1.5">
                                <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                                  {t.cart.requiredForReconstitution}
                                </span>
                              </div>
                            )}
                            {/* Top row: image + (title, variant, delete button) */}
                            <div className="flex w-full gap-2.5 p-2.5 pb-1.5">
                              {/* Product image — guard the empty-src case.
                                  next/image THROWS on src="" which crashed the
                                  whole cart (blank screen) on mobile whenever a
                                  product had no featuredImage or during the
                                  optimistic add before the image resolved. */}
                              <div className={`relative h-14 w-14 flex-none overflow-hidden rounded-lg border ${isBAC ? "border-amber-100 bg-amber-50" : "border-blue-50 bg-blue-50"}`}>
                                {item.merchandise.product.featuredImage?.url ? (
                                  <Image
                                    className="h-full w-full object-cover"
                                    width={56}
                                    height={56}
                                    alt={
                                      item.merchandise.product.featuredImage
                                        ?.altText ||
                                      item.merchandise.product.title
                                    }
                                    src={item.merchandise.product.featuredImage.url}
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <ShoppingCartIcon className="h-5 w-5 text-blue-200" />
                                  </div>
                                )}
                              </div>

                              {/* Title + variant + delete (delete now inline) */}
                              <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <Link
                                    href={merchandiseUrl}
                                    onClick={closeCart}
                                    className={`block break-words text-sm font-semibold leading-snug hover:opacity-80 ${isBAC ? "text-amber-900" : "text-blue-900 hover:text-blue-700"}`}
                                  >
                                    {item.merchandise.product.title}
                                  </Link>
                                  {item.merchandise.title !== DEFAULT_OPTION && (
                                    <p className={`mt-0.5 text-xs ${isBAC ? "text-amber-600" : "text-blue-400"}`}>
                                      {item.merchandise.title}
                                    </p>
                                  )}
                                </div>
                                <div className="-mt-0.5 -mr-0.5 shrink-0">
                                  <DeleteItemButton
                                    item={item}
                                    optimisticUpdate={updateCartItem}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Bottom row: qty controls + price — flex-wrap so it
                                stacks gracefully on very narrow screens (<360px) */}
                            <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 pb-2.5">
                              <div className={`flex h-11 sm:h-10 flex-row items-center overflow-hidden rounded-full border ${isBAC ? "border-amber-200 bg-amber-50" : "border-blue-100 bg-blue-50"}`}>
                                <EditItemQuantityButton
                                  item={item}
                                  type="minus"
                                  optimisticUpdate={updateCartItem}
                                />
                                <span className={`w-6 text-center text-xs font-semibold tabular-nums ${isBAC ? "text-amber-900" : "text-blue-900"}`}>
                                  {item.quantity}
                                </span>
                                <EditItemQuantityButton
                                  item={item}
                                  type="plus"
                                  optimisticUpdate={updateCartItem}
                                />
                              </div>
                              {/* Use Intl directly to avoid the redundant " EUR"
                                  suffix that the shared Price component appends —
                                  the symbol alone is plenty in a tight cart row. */}
                              <p className={`text-sm font-bold tabular-nums ${isBAC ? "text-amber-900" : "text-blue-900"}`}>
                                {new Intl.NumberFormat(undefined, {
                                  style: "currency",
                                  currency: item.cost.totalAmount.currencyCode,
                                  currencyDisplay: "narrowSymbol",
                                }).format(parseFloat(item.cost.totalAmount.amount))}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                  </ul>

                  {/* BAC-water nudge — INSIDE the scrollable region so it
                      scrolls with the items instead of crashing into the
                      fixed footer when expanded. Closed by default so it
                      doesn't push items out of sight on first view; the
                      summary line still surfaces the requirement clearly. */}
                  {upsellProduct &&
                    cartNeedsBacWater(cart.lines, upsellProduct.handle) && (
                      <details
                        open
                        className="group mt-3 overflow-hidden rounded-xl border-2 border-amber-300 bg-amber-50 shadow-sm"
                      >
                        <summary className="flex cursor-pointer list-none select-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-bold text-amber-900 [&::-webkit-details-marker]:hidden">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span aria-hidden>⚠️</span>
                            <span className="truncate">{t.cart.requiredForReconstitution}</span>
                          </span>
                          <ChevronDownIcon className="h-4 w-4 shrink-0 text-amber-600 transition-transform duration-200 group-open:rotate-180" />
                        </summary>
                        <div className="px-3 pb-3">
                          <UpsellBanner product={upsellProduct} addCartItem={handleAddCartItem} />
                        </div>
                      </details>
                    )}
                  </div>

                  {/* Bottom section — fixed footer, doesn't scroll */}
                  <div className="shrink-0 border-t border-blue-100 pt-4">
                    {/* Discount code + marketing preferences — one collapsible
                        panel at every breakpoint. It used to render expanded
                        inline on desktop/tablet, which made the drawer tall and
                        noisy; folding it keeps the cart focused on the items and
                        total, and the customer opens it only when they need it. */}
                    <details className="group mb-3 overflow-hidden rounded-xl border border-blue-100 bg-white">
                      <summary className="flex cursor-pointer list-none select-none items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-blue-900 [&::-webkit-details-marker]:hidden">
                        <span className="flex items-center gap-1.5">
                          <TagIcon className="h-4 w-4 text-blue-400" />
                          {t.cart.discountAndPrefs}
                        </span>
                        <ChevronDownIcon className="h-4 w-4 shrink-0 text-blue-400 transition-transform duration-200 group-open:rotate-180" />
                      </summary>
                      <div className="border-t border-blue-50 px-4 pb-4 pt-3">
                        <CouponInput appliedCodes={cart.discountCodes as any} />

                        <div className="rounded-xl border border-blue-100 bg-white p-4">
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-blue-600">
                            {t.cart.preferences}
                          </p>
                          <label className="flex cursor-pointer items-start gap-3 py-1.5">
                            <input
                              type="checkbox"
                              checked={prefs.saveInfo}
                              onChange={(e) =>
                                setPrefs((p) => ({ ...p, saveInfo: e.target.checked }))
                              }
                              className="mt-0.5 h-4 w-4 rounded border-blue-200 text-blue-700 focus:ring-blue-600"
                            />
                            <span className="text-sm text-blue-900">
                              {t.cart.saveInfo}
                            </span>
                          </label>
                          <label className="flex cursor-pointer items-start gap-3 py-1.5">
                            <input
                              type="checkbox"
                              checked={prefs.smsOffers}
                              onChange={(e) =>
                                setPrefs((p) => ({ ...p, smsOffers: e.target.checked }))
                              }
                              className="mt-0.5 h-4 w-4 rounded border-blue-200 text-blue-700 focus:ring-blue-600"
                            />
                            <span className="text-sm text-blue-900">
                              {t.cart.smsOffers}
                            </span>
                          </label>
                          <label className="flex cursor-pointer items-start gap-3 py-1.5">
                            <input
                              type="checkbox"
                              checked={prefs.emailOffers}
                              onChange={(e) =>
                                setPrefs((p) => ({ ...p, emailOffers: e.target.checked }))
                              }
                              className="mt-0.5 h-4 w-4 rounded border-blue-200 text-blue-700 focus:ring-blue-600"
                            />
                            <span className="text-sm text-blue-900">
                              {t.cart.emailOffers}
                            </span>
                          </label>
                          <p className="mt-2 text-xs text-blue-400">
                            {t.cart.prefsHint}
                          </p>
                        </div>
                      </div>
                    </details>

                    {/* Order summary — simplified for clarity.
                        The "idiot test": the customer should see at a glance
                        what they're about to pay. We drop the outer card
                        chrome and lead with a big TOTAL row; taxes / shipping
                        details remain available but tucked behind a small
                        details toggle so they never distract from the price. */}
                    {cart.discountAllocations &&
                      cart.discountAllocations.length > 0 && (
                        <div className="mb-1.5 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 ring-1 ring-emerald-200">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <TagIcon className="h-3.5 w-3.5" />
                            {t.cart.discount}
                          </span>
                          <span className="font-bold tabular-nums">
                            −
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency:
                                cart.discountAllocations[0]?.discountedAmount
                                  .currencyCode ?? "USD",
                            }).format(
                              cart.discountAllocations.reduce(
                                (sum, d) =>
                                  sum + Number(d.discountedAmount.amount),
                                0
                              )
                            )}
                          </span>
                        </div>
                      )}

                    {/* Tiny taxes/shipping disclosure — opens on tap, doesn't
                        compete with the total visually. */}
                    <details className="mb-2 px-1">
                      <summary className="cursor-pointer select-none text-xs text-blue-500">
                        ▸ {t.cart.taxesShipping ?? "Taxes & shipping"}
                      </summary>
                      <div className="mt-1.5 space-y-1 pl-3 text-xs text-blue-500">
                        <div className="flex items-center justify-between">
                          <span>{t.cart.taxesIncluded}</span>
                          <Price
                            className="text-blue-700"
                            amount={cart.cost.totalTaxAmount.amount}
                            currencyCode={cart.cost.totalTaxAmount.currencyCode}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{t.cart.shipping ?? "Shipping"}</span>
                          <span className="text-blue-700">
                            {t.cart.calculatedAtCheckout ?? "Calculated at checkout"}
                          </span>
                        </div>
                      </div>
                    </details>

                    {/* BIG, unambiguous total — the single most important number
                        in the drawer. Mobile customers complained the total
                        was lost in a sea of borders/labels. */}
                    <div className="flex items-baseline justify-between px-1 pb-2">
                      <span className="text-base font-bold text-blue-900">
                        {t.cart.total}
                      </span>
                      <Price
                        className="text-xl font-extrabold tabular-nums text-blue-900"
                        amount={cart.cost.totalAmount.amount}
                        currencyCode={cart.cost.totalAmount.currencyCode}
                      />
                    </div>

                    {/* How checkout works — 3-step explainer + video placeholder.
                        Sits directly above the Pay-by-Bank button so customers
                        know what's about to happen (and that they're about to
                        leave the site) before they click. Slate / blue palette
                        to match the rest of the drawer. */}
                    <details
                      className="group mt-3 overflow-hidden rounded-xl border border-blue-100 bg-white"
                    >
                      <summary className="flex cursor-pointer list-none select-none items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-blue-900 [&::-webkit-details-marker]:hidden">
                        <span className="flex items-center gap-1.5">
                          <InformationCircleIcon className="h-4 w-4 text-blue-500" />
                          {t.cart.howItWorks}
                        </span>
                        <ChevronDownIcon className="h-4 w-4 shrink-0 text-blue-400 transition-transform duration-200 group-open:rotate-180" />
                      </summary>

                      <div className="border-t border-blue-50 px-4 pb-4 pt-3">
                        <p className="mb-3 text-xs leading-snug text-blue-700">
                          {t.cart.howItWorksIntro}
                        </p>

                        {/* 3-step list — numbered, with title + sub */}
                        <ol className="mb-4 space-y-2.5">
                          {[
                            { n: 1, title: t.cart.step1Title, desc: t.cart.step1Desc },
                            { n: 2, title: t.cart.step2Title, desc: t.cart.step2Desc },
                            { n: 3, title: t.cart.step3Title, desc: t.cart.step3Desc },
                          ].map((step) => (
                            <li key={step.n} className="flex items-start gap-2.5">
                              <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-700 text-[11px] font-bold text-white">
                                {step.n}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold leading-snug text-blue-900">
                                  {step.title}
                                </p>
                                <p className="mt-0.5 text-xs leading-snug text-blue-500">
                                  {step.desc}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ol>

                        {/* "You're about to leave the site" warning — amber so
                            it visually pops without alarming. */}
                        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                          <ArrowTopRightOnSquareIcon className="mt-0.5 h-4 w-4 flex-none text-amber-600" />
                          <p className="text-[11px] leading-snug text-amber-900">
                            {t.cart.leavingSiteNotice}
                          </p>
                        </div>

                        {/* Link to the full payment FAQ. /checkout-help doesn't
                            exist yet, so we point at /faq which already covers
                            bank-transfer questions. */}
                        <Link
                          href="/faq"
                          onClick={closeCart}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 underline-offset-2 hover:underline"
                        >
                          {t.cart.checkoutHelpLink}
                          <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                        </Link>
                      </div>
                    </details>

                    <form action={redirectToCheckout} className="mt-3">
                      <button
                        type="submit"
                        disabled={!cart?.lines?.length}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition-all ${
                          cart?.lines?.length
                            ? "bg-blue-700 hover:bg-blue-800 hover:shadow-lg"
                            : "cursor-not-allowed bg-blue-300"
                        }`}
                      >
                        {t.cart.checkout}
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                    </form>

                    <p className="mt-2 text-center text-xs text-blue-400">
                      {t.cart.secureCheckout} · SSL encrypted
                    </p>
                  </div>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}

