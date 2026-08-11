"use client";

import type { OrderDetail } from "lib/woocommerce";
import Link from "next/link";
import { useState } from "react";

type Bank = { holder: string; iban: string; bic: string; name: string };

function fmt(amount: string, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency || "EUR",
  }).format(parseFloat(amount) || 0);
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-700">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="truncate font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
      <button
        type="button"
        onClick={() =>
          navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
        }
        className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
      >
        {copied ? "✓" : "Copy"}
      </button>
    </div>
  );
}

export default function OrderConfirmedContent({
  order,
  bank,
}: {
  order: OrderDetail | null;
  bank?: Bank;
}) {
  const hasBank = Boolean(bank?.iban || bank?.holder);
  const cur = order?.currency ?? "EUR";

  return (
    <div className="flex min-h-[70vh] flex-col items-center bg-[#f6f7f9] px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-lg space-y-4">

        {/* ── Success header ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {order ? `Order #${order.number} confirmed!` : "Order received!"}
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {order
              ? `A confirmation has been sent to ${order.billing.email}.`
              : "Thank you for your order."}
          </p>
        </div>

        {/* ── Order summary (items) ── */}
        {order && order.items.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-white">Order summary</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                    {fmt(item.total, cur)}
                  </span>
                </div>
              ))}
            </div>
            <div className="divide-y divide-slate-100 border-t border-slate-100 px-6 dark:divide-slate-700 dark:border-slate-700">
              {parseFloat(order.discount) > 0 && (
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-slate-500">Discount</span>
                  <span className="text-green-600">−{fmt(order.discount, cur)}</span>
                </div>
              )}
              {parseFloat(order.shipping) > 0 && (
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-slate-500">Shipping</span>
                  <span className="text-slate-700 dark:text-slate-300">{fmt(order.shipping, cur)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 font-bold">
                <span className="text-slate-900 dark:text-white">Total</span>
                <span className="text-lg text-slate-900 dark:text-white">{fmt(order.total, cur)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── ACTION REQUIRED: bank transfer ── */}
        <div className="overflow-hidden rounded-2xl border-2 border-amber-300 bg-amber-50 shadow-sm dark:border-amber-500/40 dark:bg-amber-900/10">
          <div className="bg-amber-100 px-6 py-4 dark:bg-amber-900/20">
            <h2 className="text-lg font-extrabold leading-tight text-amber-900 dark:text-amber-300">
              Action required — complete your payment
            </h2>
            <p className="mt-1 text-sm leading-snug text-amber-800 dark:text-amber-400">
              Transfer the exact amount below using the order number as the payment reference.
            </p>
          </div>

          <div className="space-y-4 p-6">
            {/* Order reference */}
            <div className="rounded-xl border-2 border-amber-400 bg-white p-4 dark:bg-slate-900">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Payment reference</p>
              <p className="mt-1 font-mono text-2xl font-extrabold tracking-wide text-slate-900 dark:text-white">
                #{order?.number ?? "—"}
              </p>
              <p className="mt-1.5 text-xs font-medium leading-snug text-amber-700 dark:text-amber-400">
                Include this reference so we can match your transfer to your order.
              </p>
            </div>

            {/* Amount */}
            {order && (
              <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-amber-200 dark:bg-slate-900 dark:ring-amber-500/30">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Amount to transfer</span>
                <span className="text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">
                  {fmt(order.total, cur)}
                </span>
              </div>
            )}

            {/* Bank details */}
            {hasBank ? (
              <div className="rounded-xl bg-white px-4 py-1 ring-1 ring-amber-200 dark:bg-slate-900 dark:ring-amber-500/30">
                <CopyRow label="Account holder" value={bank!.holder} />
                <CopyRow label="IBAN" value={bank!.iban} />
                <CopyRow label="BIC / SWIFT" value={bank!.bic} />
                <CopyRow label="Bank name" value={bank!.name} />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-amber-300 bg-white px-4 py-3 text-xs text-amber-700 dark:bg-slate-900">
                Bank details will be emailed to you shortly.
              </div>
            )}

            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-400">
              Orders are dispatched once payment is confirmed (typically 1–2 business days). You will receive a shipping confirmation email.
            </p>
          </div>
        </div>

        {/* ── Billing info ── */}
        {order && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Delivery to</h3>
            <p className="text-sm text-slate-900 dark:text-slate-100">{order.billing.name}</p>
            <p className="text-sm text-slate-500">{order.billing.address}</p>
            <p className="text-sm text-slate-500">{order.billing.postcode} {order.billing.city}</p>
            <p className="text-sm text-slate-500">{order.billing.country}</p>
            <p className="mt-2 text-sm text-slate-500">{order.billing.email}</p>
          </div>
        )}

        {/* ── CTAs ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/shop"
            className="rounded-xl bg-slate-900 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Continue shopping
          </Link>
          <Link
            href="/contact"
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            Contact support
          </Link>
        </div>

      </div>
    </div>
  );
}
