import { NextRequest, NextResponse } from "next/server";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!; // "biosynclabs.myshopify.com"
const CLIENT_ID = process.env.SHOPIFY_ADMIN_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_ADMIN_CLIENT_SECRET;

/* ── Token cache (in-memory, reused across requests in the same process) ── */
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAdminToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const res = await fetch(
    `https://${DOMAIN}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed ${res.status}: ${text}`);
  }

  const { access_token, expires_in } = await res.json();
  cachedToken = access_token;
  tokenExpiresAt = Date.now() + expires_in * 1000;
  return access_token;
}

/* ── Types ────────────────────────────────────────────────────────────────── */
export type OrderItem = {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  lineItems: { title: string; quantity: number; variantTitle?: string | null }[];
  fulfillments: {
    status: string;
    trackingInfo: { number: string | null; url: string | null }[];
  }[];
  statusPageUrl: string;
};

/* ── GraphQL query ────────────────────────────────────────────────────────── */
const QUERY = /* GraphQL */ `
  query ordersByEmail($query: String!) {
    orders(first: 10, query: $query, sortKey: PROCESSED_AT, reverse: true) {
      edges {
        node {
          id
          name
          processedAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet {
            shopMoney { amount currencyCode }
          }
          lineItems(first: 10) {
            edges {
              node {
                title
                quantity
                variantTitle
              }
            }
          }
          fulfillments(first: 5) {
            status
            trackingInfo { number url }
          }
          statusPageUrl
        }
      }
    }
  }
`;

/* ── Route handler ────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Order lookup is not yet configured. Use the link in your confirmation email." },
      { status: 503 }
    );
  }

  let email: string;
  try {
    const body = await req.json();
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 422 });
  }

  let token: string;
  try {
    token = await getAdminToken();
  } catch (err) {
    console.error("[order-status] Token error:", err);
    return NextResponse.json(
      { error: "Could not authenticate with Shopify. Check your credentials." },
      { status: 502 }
    );
  }

  const res = await fetch(
    `https://${DOMAIN}/admin/api/2026-04/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query: QUERY, variables: { query: `email:${email}` } }),
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to reach Shopify." }, { status: 502 });
  }

  const data = await res.json();

  // Surface GraphQL-level errors (e.g. ACCESS_DENIED = missing scope)
  if (data?.errors?.length) {
    const err = data.errors[0];
    const msg = err?.message ?? "GraphQL error";
    console.error("[order-status] GraphQL errors:", data.errors);
    return NextResponse.json(
      { error: `Shopify API error: ${msg}` },
      { status: 403 }
    );
  }

  // orders field null = scope not granted (returns null instead of error in some API versions)
  if (data?.data?.orders === null || data?.data?.orders === undefined) {
    console.error("[order-status] orders field is null — likely missing read_orders scope");
    return NextResponse.json(
      { error: "Missing read_orders scope. Add it in Dev Dashboard → your app → Versions → Scopes → type read_orders → Save → reinstall the app." },
      { status: 403 }
    );
  }

  const edges = data?.data?.orders?.edges ?? [];

  if (!edges.length) {
    return NextResponse.json(
      { error: "No orders found for that email address. Make sure you use the same email as at checkout." },
      { status: 404 }
    );
  }

  const orders: OrderItem[] = edges.map((e: { node: Record<string, unknown> }) => {
    const n = e.node;
    return {
      id: n.id,
      name: n.name,
      processedAt: n.processedAt,
      financialStatus: n.displayFinancialStatus,
      fulfillmentStatus: n.displayFulfillmentStatus,
      totalPriceSet: n.totalPriceSet,
      lineItems: ((n.lineItems as { edges: { node: { title: string; quantity: number; variantTitle?: string | null } }[] }).edges ?? []).map(
        (li) => ({
          title: li.node.title,
          quantity: li.node.quantity,
          variantTitle: li.node.variantTitle ?? null,
        })
      ),
      fulfillments: (n.fulfillments as OrderItem["fulfillments"]) ?? [],
      statusPageUrl: n.statusPageUrl as string,
    };
  });

  return NextResponse.json({ orders });
}
