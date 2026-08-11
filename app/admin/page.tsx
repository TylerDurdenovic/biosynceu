import { OrdersDashboard } from "components/admin/orders-dashboard";
import { SESSION_COOKIE, verifySessionToken } from "lib/admin-auth";
import { getAdminOrders, type AdminOrder } from "lib/woocommerce";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin — Orders",
  robots: { index: false, follow: false },
};

const RANGE_DAYS: Record<string, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: 0,
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await verifySessionToken(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (!session) redirect("/admin/login");

  const sp = await searchParams;
  const range = sp.range && sp.range in RANGE_DAYS ? sp.range : "30d";
  const days = RANGE_DAYS[range]!;

  const after =
    days > 0
      ? new Date(Date.now() - days * 86_400_000).toISOString()
      : undefined;

  let orders: AdminOrder[] = [];
  let error = "";
  try {
    orders = await getAdminOrders({ first: 250, after });
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load orders";
  }

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const shipping = orders.reduce((s, o) => s + o.shipping, 0);
  const count = orders.length;
  const awaiting = orders.filter(
    (o) => o.fulfillmentStatus.toLowerCase() !== "fulfilled",
  ).length;

  const summary = {
    revenue,
    shipping,
    count,
    aov: count ? revenue / count : 0,
    awaiting,
    currency: orders[0]?.currency ?? "EUR",
  };

  const wpAdminBase = process.env.WP_URL?.replace("/wp-json/wp/v2", "") ?? "";

  return (
    <OrdersDashboard
      orders={orders}
      summary={summary}
      range={range}
      wpAdminBase={wpAdminBase}
      username={session.u}
      error={error}
    />
  );
}
