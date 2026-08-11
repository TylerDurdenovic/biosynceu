"use client";

import type { AdminOrder } from "lib/woocommerce";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Summary = {
  revenue: number;
  shipping: number;
  count: number;
  aov: number;
  awaiting: number;
  currency: string;
};

/**
 * Revenue split. Each order's NET = total − shipping; the net is divided
 * between the partners by `share`. Change the shares (or names) here if the
 * split isn't 50/50 — they must add up to 1.
 */
const PARTNERS = [
  { key: "RA", share: 0.5 },
  { key: "AL", share: 0.5 },
] as const;

const RANGES = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "all", label: "All" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function money(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

// Deterministic UTC format so server and client render identically (no
// hydration mismatch). Times are UTC.
function fmtDate(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

function statusClass(s: string, kind: "fin" | "ful") {
  const v = s.toLowerCase();
  if (kind === "fin") {
    if (v.includes("paid")) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    if (v.includes("pending") || v.includes("partial")) return "bg-amber-50 text-amber-700 ring-amber-200";
    if (v.includes("refund")) return "bg-red-50 text-red-700 ring-red-200";
    return "bg-slate-100 text-slate-600 ring-slate-200";
  }
  if (v === "fulfilled") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (v.includes("progress") || v.includes("partial")) return "bg-blue-50 text-blue-700 ring-blue-200";
  return "bg-amber-50 text-amber-700 ring-amber-200"; // unfulfilled / on hold
}

function csvCell(v: string) {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function OrdersDashboard({
  orders,
  summary,
  range,
  wpAdminBase,
  username,
  error,
}: {
  orders: AdminOrder[];
  summary: Summary;
  range: string;
  wpAdminBase: string;
  username: string;
  error?: string;
}) {
  const router = useRouter();
  const cur = summary.currency;

  // Net = total − shipping, split between partners.
  const net = summary.revenue - summary.shipping;
  const partnerTotals = PARTNERS.map((p) => ({ key: p.key, amount: net * p.share }));
  const splitLabel = PARTNERS.map((p) => Math.round(p.share * 100)).join("/");

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  function exportCsv() {
    const header = [
      "Order", "Date (UTC)", "Total", "Shipping", "Net (excl. shipping)",
      ...PARTNERS.map((p) => p.key), "Payment", "Fulfillment",
    ];
    const rows = orders.map((o) => {
      const n = o.total - o.shipping;
      return [
        o.name, o.createdAt,
        o.total.toFixed(2), o.shipping.toFixed(2), n.toFixed(2),
        ...PARTNERS.map((p) => (n * p.share).toFixed(2)),
        o.financialStatus, o.fulfillmentStatus,
      ];
    });
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cards = [
    { label: "Revenue (paid)", value: money(summary.revenue, cur) },
    { label: "Orders", value: String(summary.count) },
    { label: "Avg order value", value: money(summary.aov, cur) },
    { label: "Shipping charged", value: money(summary.shipping, cur) },
    { label: "Awaiting fulfilment", value: String(summary.awaiting) },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="text-sm font-bold text-slate-900">BioSyncLabs · Orders</p>
            <p className="text-[11px] text-slate-400">Paid orders · signed in as {username}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              disabled={orders.length === 0}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Export CSV
            </button>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Range filter */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Range</span>
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/admin?range=${r.key}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                range === r.key
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Couldn&apos;t load orders: {error}
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {cards.map((c) => (
                <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{c.label}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{c.value}</p>
                </div>
              ))}
            </div>

            {/* Settlement split band */}
            <div className="mb-6 overflow-hidden rounded-xl border border-slate-900 bg-[#0B1929] text-white">
              <div className="flex flex-col divide-y divide-white/10 sm:flex-row sm:divide-x sm:divide-y-0">
                <div className="flex-1 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Net to split · total − shipping
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{money(net, cur)}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {money(summary.revenue, cur)} − {money(summary.shipping, cur)} shipping
                  </p>
                </div>
                {partnerTotals.map((p) => (
                  <div key={p.key} className="flex-1 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                      {p.key} · {Math.round((net ? p.amount / net : 0.5) * 100)}%
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-cyan-300">{money(p.amount, cur)}</p>
                  </div>
                ))}
                <div className="flex-1 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Shipping · set aside
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-amber-300">{money(summary.shipping, cur)}</p>
                </div>
              </div>
            </div>

            {/* Orders table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-right">Shipping</th>
                      <th className="px-4 py-3 text-right">Net</th>
                      {PARTNERS.map((p) => (
                        <th key={p.key} className="bg-cyan-50/60 px-4 py-3 text-right text-cyan-700">{p.key}</th>
                      ))}
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Fulfilment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6 + PARTNERS.length} className="px-4 py-12 text-center text-sm text-slate-400">
                          No paid orders in this range.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => {
                        const n = o.total - o.shipping;
                        return (
                          <tr key={o.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              <a
                                href={`${wpAdminBase}/wp-admin/admin.php?page=wc-orders&action=edit&id=${o.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {o.name}
                              </a>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtDate(o.createdAt)}</td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{money(o.total, o.currency)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-amber-600">{money(o.shipping, o.currency)}</td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{money(n, o.currency)}</td>
                            {PARTNERS.map((p) => (
                              <td key={p.key} className="bg-cyan-50/40 px-4 py-3 text-right tabular-nums font-semibold text-cyan-800">
                                {money(n * p.share, o.currency)}
                              </td>
                            ))}
                            <td className="px-4 py-3">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusClass(o.financialStatus, "fin")}`}>
                                {o.financialStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusClass(o.fulfillmentStatus, "ful")}`}>
                                {o.fulfillmentStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              Net = total − shipping, split {splitLabel} between {PARTNERS.map((p) => p.key).join(" / ")} ·
              up to 250 paid orders · times in UTC.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
