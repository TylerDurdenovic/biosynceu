"use client";

import { useLanguage } from "contexts/language-context";
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

function CopyRow({
  label,
  value,
  copyLabel,
}: {
  label: string;
  value: string;
  copyLabel: string;
}) {
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
        {copied ? "✓" : copyLabel}
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
  const { t } = useLanguage();
  const oc = t.orderConfirmed;
  const hasBank = Boolean(bank?.iban || bank?.holder);
  const cur = order?.currency ?? "EUR";

  const heading = order
    ? oc.confirmedHeading.replace("{n}", order.number)
    : oc.receivedHeading;
  const subheading = order
    ? oc.confirmationSentTo.replace("{email}", order.billing.email)
    : oc.thankYou;

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{heading}</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{subheading}</p>
        </div>

        {/* ── Order summary (items) ── */}
        {order && order.items.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-white">{oc.summaryTitle}</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-400">{oc.qty}: {item.quantity}</p>
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
                  <span className="text-slate-500">{oc.discountLabel}</span>
                  <span className="text-green-600">−{fmt(order.discount, cur)}</span>
                </div>
              )}
              {parseFloat(order.shipping) > 0 && (
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-slate-500">{oc.shippingLabel}</span>
                  <span className="text-slate-700 dark:text-slate-300">{fmt(order.shipping, cur)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 font-bold">
                <span className="text-slate-900 dark:text-white">{oc.totalLabel}</span>
                <span className="text-lg text-slate-900 dark:text-white">{fmt(order.total, cur)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Paid-by-card disclaimer (sits above the bank-transfer box) ── */}
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-900/15">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs font-medium leading-relaxed text-emerald-800 dark:text-emerald-300">
            {oc.cardPaidNote}
          </p>
        </div>

        {/* ── ACTION REQUIRED: bank transfer ── */}
        <div className="overflow-hidden rounded-2xl border-2 border-amber-300 bg-amber-50 shadow-sm dark:border-amber-500/40 dark:bg-amber-900/10">
          <div className="bg-amber-100 px-6 py-4 dark:bg-amber-900/20">
            <h2 className="text-lg font-extrabold leading-tight text-amber-900 dark:text-amber-300">
              {oc.actionTitle}
            </h2>
            <p className="mt-1 text-sm leading-snug text-amber-800 dark:text-amber-400">
              {oc.actionIntro}
            </p>
          </div>

          <div className="space-y-4 p-6">
            {/* Order reference */}
            <div className="rounded-xl border-2 border-amber-400 bg-white p-4 dark:bg-slate-900">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">{oc.refLabel}</p>
              <p className="mt-1 font-mono text-2xl font-extrabold tracking-wide text-slate-900 dark:text-white">
                #{order?.number ?? "—"}
              </p>
              <p className="mt-1.5 text-xs font-medium leading-snug text-amber-700 dark:text-amber-400">
                {oc.refHint}
              </p>
            </div>

            {/* Amount */}
            {order && (
              <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-amber-200 dark:bg-slate-900 dark:ring-amber-500/30">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{oc.amountLabel}</span>
                <span className="text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">
                  {fmt(order.total, cur)}
                </span>
              </div>
            )}

            {/* Bank details */}
            {hasBank ? (
              <div className="rounded-xl bg-white px-4 py-1 ring-1 ring-amber-200 dark:bg-slate-900 dark:ring-amber-500/30">
                <CopyRow label={oc.payHolder} value={bank!.holder} copyLabel={oc.copyBtn} />
                <CopyRow label={oc.payIban} value={bank!.iban} copyLabel={oc.copyBtn} />
                <CopyRow label={oc.payBic} value={bank!.bic} copyLabel={oc.copyBtn} />
                <CopyRow label={oc.bankName} value={bank!.name} copyLabel={oc.copyBtn} />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-amber-300 bg-white px-4 py-3 text-xs text-amber-700 dark:bg-slate-900">
                {oc.bankEmailed}
              </div>
            )}

            {/* Reassurance: IBAN / account-holder name mismatch is expected */}
            <div className="flex gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-500/30 dark:bg-blue-900/15">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300">
                {oc.ibanNotice}
              </p>
            </div>

            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-400">
              {oc.dispatchNote}
            </p>
          </div>
        </div>

        {/* ── Billing info ── */}
        {order && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{oc.deliveryTo}</h3>
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
            {oc.continueShopping}
          </Link>
          <Link
            href="/contact"
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            {oc.contactSupport}
          </Link>
        </div>

      </div>
    </div>
  );
}
