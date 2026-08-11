import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

/**
 * POST /api/back-in-stock
 * Body: { email: string; handle: string }
 *
 * Uses the Shopify Storefront API `customerCreate` mutation to register the
 * email as a customer with a tag indicating which product they want restocked.
 * If the customer already exists the request still resolves gracefully.
 */
export async function POST(req: NextRequest) {
  let email: string;
  let handle: string;

  try {
    const body = await req.json();
    email = (body.email ?? "").trim().toLowerCase();
    handle = (body.handle ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 422 });
  }

  const mutation = /* GraphQL */ `
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
        }
        customerUserErrors {
          code
          message
        }
      }
    }
  `;

  const tag = `back-in-stock:${handle}`;

  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            email,
            acceptsMarketing: true,
            tags: [tag],
          },
        },
      }),
    },
  );

  const data = await res.json();
  const errors = data?.data?.customerCreate?.customerUserErrors ?? [];

  // Code CUSTOMER_DISABLED / TAKEN means already exists — treat as success
  const isTaken = errors.some((e: { code: string }) =>
    ["TAKEN", "CUSTOMER_DISABLED"].includes(e.code),
  );

  if (errors.length && !isTaken) {
    console.error("[back-in-stock]", errors);
    return NextResponse.json({ error: errors[0].message }, { status: 422 });
  }

  return NextResponse.json({ ok: true });
}
