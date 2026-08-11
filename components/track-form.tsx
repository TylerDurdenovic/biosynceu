"use client";

import { useLanguage } from "contexts/language-context";
import { useState } from "react";
import type { OrderItem } from "app/api/order-status/route";

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function fmtDate(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtPrice(amount: string, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(parseFloat(amount));
}

/* ── Single order card ────────────────────────────────────────────────────── */
function OrderCard({ order }: { order: OrderItem }) {
  const { t, lang } = useLanguage();
  const fulfillmentMap = t.track.fulfillment as Record<string, string>;
  const badge = {
    label: fulfillmentMap[order.fulfillmentStatus] ?? order.fulfillmentStatus,
    cls: (() => {
      const map: Record<string, string> = {
        FULFILLED:   "bg-emerald-100 text-emerald-700",
        PARTIAL:     "bg-amber-100 text-amber-700",
        UNFULFILLED: "bg-blue-100 text-blue-700",
        RESTOCKED:   "bg-slate-100 text-slate-600",
        IN_PROGRESS: "bg-blue-100 text-blue-700",
        ON_HOLD:     "bg-amber-100 text-amber-700",
        OPEN:        "bg-blue-100 text-blue-700",
        PENDING:     "bg-slate-100 text-slate-500",
        SCHEDULED:   "bg-slate-100 text-slate-500",
      };
      return map[order.fulfillmentStatus] ?? "bg-slate-100 text-slate-600";
    })(),
  };

  const tracking = order.fulfillments.flatMap((f) =>
    f.trackingInfo.filter((ti) => ti.number)
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div>
          <p className="text-lg font-bold text-slate-900">{order.name}</p>
          <p className="mt-0.5 text-xs text-slate-400">{fmtDate(order.processedAt, lang)}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Items */}
      <div className="px-5 py-4">
        <ul className="space-y-1.5">
          {order.lineItems.slice(0, 4).map((item, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">
                {item.title}
                {item.variantTitle && item.variantTitle !== "Default Title" && (
                  <span className="ml-1 text-slate-400">({item.variantTitle})</span>
                )}
              </span>
              <span className="ml-3 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                ×{item.quantity}
              </span>
            </li>
          ))}
          {order.lineItems.length > 4 && (
            <li className="text-xs text-slate-400">
              {t.track.moreItems(order.lineItems.length - 4)}
            </li>
          )}
        </ul>

        {/* Tracking numbers */}
        {tracking.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {t.track.tracking}
            </p>
            {tracking.map((tr, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2">
                <span className="font-mono text-sm text-slate-600">{tr.number}</span>
                {tr.url && (
                  <a
                    href={tr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
                  >
                    {t.track.trackArrow}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
        <p className="text-sm font-bold text-slate-900">
          {fmtPrice(
            order.totalPriceSet.shopMoney.amount,
            order.totalPriceSet.shopMoney.currencyCode
          )}
        </p>
        <a
          href={order.statusPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-[.98]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          {t.track.viewOrder}
        </a>
      </div>
    </div>
  );
}

/* ── Main form ────────────────────────────────────────────────────────────── */
export function TrackForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [orders, setOrders] = useState<OrderItem[] | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOrders(null);
    setErrorMsg("");
    setStatus("loading");

    try {
      const res = await fetch("/api/order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.status === 503) {
        setErrorMsg(t.track.notEnabled);
        setStatus("error");
        return;
      }

      if (!res.ok || !data.orders?.length) {
        setErrorMsg(data.error ?? t.track.noOrdersFound);
        setStatus("error");
        return;
      }

      setOrders(data.orders);
      setStatus("idle");
    } catch {
      setErrorMsg(t.track.somethingWrong);
      setStatus("error");
    }
  }

  return (
    <div>
      {/* Search form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="track-email" className="mb-1.5 block text-sm font-semibold text-slate-800">
            {t.track.emailLabel}
          </label>
          <input
            id="track-email"
            type="email"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setOrders(null); setErrorMsg(""); }}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1.5 text-[11px] text-slate-400">{t.track.emailHint}</p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[.98] disabled:opacity-60"
        >
          {status === "loading" ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              {t.track.lookingUp}
            </span>
          ) : (
            t.track.findOrders
          )}
        </button>
      </form>

      {/* Results */}
      {orders && orders.length > 0 && (
        <div className="mt-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            {t.track.ordersFound(orders.length)}
          </p>
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Carrier fallback */}
      {!orders && (
        <div className="mt-6">
          <p className="mb-3 text-center text-xs text-slate-400">
            {t.track.orTrackWith}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="https://www.dhl.com/de-en/home/tracking.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-lg border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-400"
            >
              DHL tracking →
            </a>
            <a
              href="https://tracking.dpd.de/status/en_DE/parcel/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-lg border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-400"
            >
              DPD tracking →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
