import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// NOTE: no `export const runtime` — this repo enables experimental.useCache,
// which forbids the route-segment runtime config. Route handlers already run
// on the Node.js runtime by default, so `crypto` / `Buffer` work here.

function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!hmacHeader || !secret) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader);
  // timingSafeEqual throws when the buffers differ in length — guard first so a
  // malformed header returns 401 instead of crashing the route (500).
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const hmac = req.headers.get("x-shopify-hmac-sha256");

  if (!verifyShopifyWebhook(rawBody, hmac)) {
    // Safe diagnostics (no secret/HMAC values) so the cause is visible in the
    // Vercel logs. hasSecret=false  -> env var missing / deploy didn't pick it
    // up (set it in Vercel + REDEPLOY). hasSecret=true but still here -> the
    // secret value is wrong (use Settings → Notifications → Webhooks secret,
    // NOT the Admin API client secret).
    console.warn("[order-created] HMAC verification failed", {
      hasSecret: Boolean(process.env.SHOPIFY_WEBHOOK_SECRET),
      secretLen: process.env.SHOPIFY_WEBHOOK_SECRET?.length ?? 0,
      hasHmacHeader: Boolean(hmac),
      hmacHeaderLen: hmac?.length ?? 0,
      bodyLen: rawBody.length,
    });
    return NextResponse.json({ error: "Invalid webhook" }, { status: 401 });
  }

  const order = JSON.parse(rawBody);

  const items = order.line_items
    ?.map((item: any) => `- ${item.title} x${item.quantity}`)
    .join("\n");

  const message = `
🛒 New Shopify Order

Order: #${order.order_number}
Customer: ${order.customer?.first_name || ""} ${order.customer?.last_name || ""}
Email: ${order.email || "N/A"}
Total: ${order.total_price} ${order.currency}

Items:
${items}

Admin:
https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/orders/${order.id}
`;

  try {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
        }),
      },
    );
  } catch (err) {
    // Never 500 on a Telegram failure — Shopify would retry the webhook and
    // double-notify once Telegram recovers. Log and acknowledge instead.
    console.error("[order-created] Telegram notification failed:", err);
  }

  return NextResponse.json({ ok: true });
}
