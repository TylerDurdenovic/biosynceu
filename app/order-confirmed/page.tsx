import Footer from "components/layout/footer";
import OrderConfirmedContent from "components/pages/order-confirmed-content";
import { getOrderByKey } from "lib/woocommerce";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Thank you for your order.",
  robots: { index: false, follow: false },
};

export default async function OrderConfirmedPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const orderId = typeof sp.order_id === "string" ? sp.order_id : null;
  const key = typeof sp.key === "string" ? sp.key : null;

  const order = orderId && key ? await getOrderByKey(orderId, key) : null;

  const bank = {
    holder: process.env.NEXT_PUBLIC_BANK_HOLDER ?? "",
    iban: process.env.NEXT_PUBLIC_BANK_IBAN ?? "",
    bic: process.env.NEXT_PUBLIC_BANK_BIC ?? "",
    name: process.env.NEXT_PUBLIC_BANK_NAME ?? "",
  };

  return (
    <>
      <OrderConfirmedContent order={order} bank={bank} />
      <Footer />
    </>
  );
}
