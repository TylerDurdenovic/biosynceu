/**
 * Shopify Admin API helpers.
 *
 * Uses OAuth 2.0 client-credentials grant (the same flow already wired up for
 * order-status lookups) — token is cached in-memory across requests in the
 * same process so we don't re-auth on every call.
 *
 * Required env vars:
 *   SHOPIFY_STORE_DOMAIN          e.g. yourstore.myshopify.com
 *   SHOPIFY_ADMIN_CLIENT_ID
 *   SHOPIFY_ADMIN_CLIENT_SECRET
 *
 * Required Admin API scopes (Dev Dashboard → app → Versions → Scopes):
 *   read_orders, write_orders
 *   read_draft_orders, write_draft_orders
 */

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const CLIENT_ID = process.env.SHOPIFY_ADMIN_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_ADMIN_CLIENT_SECRET;
const API_VERSION = "2026-04";

/* ── Token caching ────────────────────────────────────────────────── */
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getAdminToken(): Promise<string> {
  if (!DOMAIN || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Shopify Admin API is not configured. Set SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_CLIENT_ID, SHOPIFY_ADMIN_CLIENT_SECRET.",
    );
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const res = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify Admin token request failed ${res.status}: ${text}`);
  }

  const { access_token, expires_in } = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = access_token;
  tokenExpiresAt = Date.now() + expires_in * 1000;
  return access_token;
}

/* ── Generic GraphQL caller ───────────────────────────────────────── */
type AdminGraphQLResponse<T> = {
  data?: T;
  errors?: { message: string; extensions?: Record<string, unknown> }[];
};

export async function adminGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = await getAdminToken();
  const res = await fetch(
    `https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify Admin GraphQL failed ${res.status}: ${text}`);
  }

  const body: AdminGraphQLResponse<T> = await res.json();

  if (body.errors && body.errors.length > 0) {
    throw new Error(
      `Shopify Admin GraphQL errors: ${body.errors.map((e) => e.message).join("; ")}`,
    );
  }

  if (!body.data) {
    throw new Error("Shopify Admin GraphQL returned no data");
  }

  return body.data;
}

/* ── Draft order types ────────────────────────────────────────────── */
export type DraftOrderLineItem = {
  /** Shopify Storefront variant GID (e.g. gid://shopify/ProductVariant/123) */
  variantId: string;
  quantity: number;
};

export type DraftOrderAddress = {
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  country?: string;
  zip?: string;
  phone?: string;
};

export type CreateDraftOrderInput = {
  email: string;
  lineItems: DraftOrderLineItem[];
  shippingAddress?: DraftOrderAddress;
  /** Custom shipping line — title + price in the cart currency. */
  shippingLine?: { title: string; price: string };
  /**
   * Optional order-level discount. Use Shopify's lookupDiscountCode()
   * helper to convert a customer-typed code into a value before passing
   * it here.
   */
  appliedDiscount?: AppliedDiscount;
  /**
   * Order-level key/value attributes — used for things like Shopify
   * Collabs affiliate refs (key: "sca_ref", value: "11341630.oRwI3xX…").
   * They appear on the resulting Order's customAttributes / additional
   * details and are read by Shopify Collabs for sale attribution.
   */
  customAttributes?: { key: string; value: string }[];
  note?: string;
  tags?: string[];
};

export type AppliedDiscount = {
  title: string;
  description?: string;
  /** Numeric string — e.g. "10" for 10% or "5.00" for €5 off. */
  value: string;
  valueType: "PERCENTAGE" | "FIXED_AMOUNT";
};

export type CreatedDraftOrder = {
  id: string; // gid://shopify/DraftOrder/123
  name: string; // e.g. "#D1"
  invoiceUrl?: string | null;
  totalPrice: string;
  /** Shopify-authoritative subtotal (line items × catalog price, no shipping/tax). */
  subtotalPrice?: string;
};

/* ── Create draft order ───────────────────────────────────────────── */
const CREATE_DRAFT_ORDER = /* GraphQL */ `
  mutation draftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        name
        invoiceUrl
        totalPrice
        subtotalPrice
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type DraftOrderCreatePayload = {
  draftOrderCreate: {
    draftOrder: CreatedDraftOrder | null;
    userErrors: { field: string[]; message: string }[];
  };
};

export async function createDraftOrder(
  input: CreateDraftOrderInput,
): Promise<CreatedDraftOrder> {
  const data = await adminGraphQL<DraftOrderCreatePayload>(CREATE_DRAFT_ORDER, {
    input: {
      email: input.email,
      lineItems: input.lineItems.map((li) => ({
        variantId: li.variantId,
        quantity: li.quantity,
      })),
      shippingAddress: input.shippingAddress,
      shippingLine: input.shippingLine,
      appliedDiscount: input.appliedDiscount
        ? {
            title: input.appliedDiscount.title,
            description: input.appliedDiscount.description,
            value: parseFloat(input.appliedDiscount.value),
            valueType: input.appliedDiscount.valueType,
          }
        : undefined,
      customAttributes: input.customAttributes,
      note: input.note,
      tags: input.tags,
    },
  });

  const { draftOrder, userErrors } = data.draftOrderCreate;
  if (userErrors.length > 0 || !draftOrder) {
    throw new Error(
      `Shopify draftOrderCreate userErrors: ${userErrors
        .map((e) => `${e.field?.join(".") ?? ""}: ${e.message}`)
        .join("; ")}`,
    );
  }

  return draftOrder;
}

/* ── Fetch a draft order (for the customer-facing status page) ───── */
export type DraftOrderForCustomer = {
  id: string;
  name: string;
  email: string | null;
  totalPrice: string;
  subtotalPrice: string | null;
  currencyCode: string;
  tags: string[];
  status: string; // OPEN | INVOICE_SENT | COMPLETED
  /** Set once the draft has been completed by the merchant. */
  order: { id: string; name: string } | null;
  shippingAddress: {
    firstName: string | null;
    lastName: string | null;
    address1: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
    zip: string | null;
    phone: string | null;
  } | null;
  lineItems: {
    title: string;
    variantTitle: string | null;
    quantity: number;
    originalUnitPrice: string;
  }[];
};

const GET_DRAFT_ORDER = /* GraphQL */ `
  query getDraftOrder($id: ID!) {
    draftOrder(id: $id) {
      id
      name
      email
      totalPrice
      subtotalPrice
      currencyCode
      tags
      status
      order { id name }
      shippingAddress {
        firstName lastName address1 city province country zip phone
      }
      lineItems(first: 50) {
        edges {
          node {
            name
            variantTitle
            quantity
            originalUnitPrice
          }
        }
      }
    }
  }
`;

type GetDraftOrderPayload = {
  draftOrder: {
    id: string;
    name: string;
    email: string | null;
    totalPrice: string;
    subtotalPrice: string | null;
    currencyCode: string;
    tags: string[];
    status: string;
    order: { id: string; name: string } | null;
    shippingAddress: DraftOrderForCustomer["shippingAddress"];
    lineItems: {
      edges: {
        node: {
          name: string;
          variantTitle: string | null;
          quantity: number;
          originalUnitPrice: string;
        };
      }[];
    };
  } | null;
};

/**
 * Fetch a draft order by numeric ID (e.g. "779376486665"). Reconstructs the
 * Shopify GID internally so callers don't need to.
 */
export async function getDraftOrderById(
  numericId: string,
): Promise<DraftOrderForCustomer | null> {
  // Defensive: numericId should be digits only — anything else gets rejected
  // before we hit the Shopify API.
  if (!/^\d+$/.test(numericId)) return null;

  const gid = `gid://shopify/DraftOrder/${numericId}`;
  const data = await adminGraphQL<GetDraftOrderPayload>(GET_DRAFT_ORDER, { id: gid });
  const d = data.draftOrder;
  if (!d) return null;

  return {
    id: d.id,
    name: d.name,
    email: d.email,
    totalPrice: d.totalPrice,
    subtotalPrice: d.subtotalPrice,
    currencyCode: d.currencyCode,
    tags: d.tags,
    status: d.status,
    order: d.order,
    shippingAddress: d.shippingAddress,
    lineItems: d.lineItems.edges.map((e) => ({
      title: e.node.name,
      variantTitle: e.node.variantTitle,
      quantity: e.node.quantity,
      originalUnitPrice: e.node.originalUnitPrice,
    })),
  };
}

/* ── Update draft order (tags / note) ─────────────────────────────── */
const UPDATE_DRAFT_ORDER = /* GraphQL */ `
  mutation draftOrderUpdate($id: ID!, $input: DraftOrderInput!) {
    draftOrderUpdate(id: $id, input: $input) {
      draftOrder {
        id
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type DraftOrderUpdatePayload = {
  draftOrderUpdate: {
    draftOrder: { id: string; tags: string[] } | null;
    userErrors: { field: string[]; message: string }[];
  };
};

export async function updateDraftOrderTags(
  draftOrderId: string,
  tags: string[],
  note?: string,
): Promise<void> {
  const data = await adminGraphQL<DraftOrderUpdatePayload>(UPDATE_DRAFT_ORDER, {
    id: draftOrderId,
    input: note ? { tags, note } : { tags },
  });

  const { userErrors } = data.draftOrderUpdate;
  if (userErrors.length > 0) {
    throw new Error(
      `Shopify draftOrderUpdate userErrors: ${userErrors
        .map((e) => `${e.field?.join(".") ?? ""}: ${e.message}`)
        .join("; ")}`,
    );
  }
}

/* ── Complete draft → creates a real Order ──────────────────────────
   Setting paymentPending=true creates the order with
   financial_status = "pending" so it appears in the main Orders list
   (not the Drafts list) and the merchant can simply "Mark as paid"
   once they've verified the PayGate / on-chain payment. */

const COMPLETE_DRAFT_ORDER = /* GraphQL */ `
  mutation draftOrderComplete($id: ID!, $paymentPending: Boolean) {
    draftOrderComplete(id: $id, paymentPending: $paymentPending) {
      draftOrder {
        id
        order {
          id
          name
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type DraftOrderCompletePayload = {
  draftOrderComplete: {
    draftOrder: {
      id: string;
      order: { id: string; name: string } | null;
    } | null;
    userErrors: { field: string[]; message: string }[];
  };
};

export type CompletedOrder = {
  /** Real Shopify Order GID — gid://shopify/Order/123 */
  id: string;
  /** Display name like "#1090". */
  name: string;
};

export async function completeDraftOrder(
  draftOrderId: string,
  paymentPending = true,
): Promise<CompletedOrder> {
  const data = await adminGraphQL<DraftOrderCompletePayload>(
    COMPLETE_DRAFT_ORDER,
    { id: draftOrderId, paymentPending },
  );

  const { draftOrder, userErrors } = data.draftOrderComplete;
  if (userErrors.length > 0 || !draftOrder?.order) {
    throw new Error(
      `Shopify draftOrderComplete userErrors: ${userErrors
        .map((e) => `${e.field?.join(".") ?? ""}: ${e.message}`)
        .join("; ")}`,
    );
  }

  return { id: draftOrder.order.id, name: draftOrder.order.name };
}

/* ── Discount-code lookup ─────────────────────────────────────────
   Takes a customer-typed code (e.g. "SAVE10"), queries Shopify Admin for
   the corresponding discount, and returns the value/type in a shape we
   can stuff straight into a draft order's appliedDiscount.
   Requires the `read_discounts` scope on the custom app.

   Supported discount types (Shopify has more, these are the common ones):
   - DiscountCodeBasic with DiscountPercentage → PERCENTAGE
   - DiscountCodeBasic with DiscountAmount     → FIXED_AMOUNT
   Free-shipping / BXGY / app-managed codes return null (unsupported here).

   Returns null if:
   - code doesn't exist
   - discount is not ACTIVE
   - current date is outside startsAt..endsAt
   - discount type isn't a simple basic one */

const LOOKUP_DISCOUNT = /* GraphQL */ `
  query lookupDiscount($code: String!) {
    codeDiscountNodeByCode(code: $code) {
      codeDiscount {
        __typename
        ... on DiscountCodeBasic {
          title
          status
          startsAt
          endsAt
          customerGets {
            value {
              __typename
              ... on DiscountAmount {
                amount { amount currencyCode }
              }
              ... on DiscountPercentage {
                percentage
              }
            }
          }
        }
      }
    }
  }
`;

type LookupDiscountPayload = {
  codeDiscountNodeByCode: {
    codeDiscount: {
      __typename: string;
      title?: string;
      status?: string;
      startsAt?: string;
      endsAt?: string | null;
      customerGets?: {
        value: {
          __typename: string;
          amount?: { amount: string; currencyCode: string };
          percentage?: number;
        };
      };
    };
  } | null;
};

export async function lookupDiscountCode(
  code: string,
): Promise<AppliedDiscount | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;

  let data: LookupDiscountPayload;
  try {
    data = await adminGraphQL<LookupDiscountPayload>(LOOKUP_DISCOUNT, {
      code: trimmed,
    });
  } catch (err) {
    // Most likely missing read_discounts scope. Surface in logs but don't
    // crash the checkout — treat as invalid code.
    console.warn("[lookupDiscountCode] Shopify lookup failed:", err);
    return null;
  }

  const node = data.codeDiscountNodeByCode;
  if (!node) return null;

  const d = node.codeDiscount;
  if (d.__typename !== "DiscountCodeBasic") return null;
  if (d.status !== "ACTIVE") return null;

  // Validity window
  const now = new Date();
  if (d.startsAt && new Date(d.startsAt) > now) return null;
  if (d.endsAt && new Date(d.endsAt) < now) return null;

  const v = d.customerGets?.value;
  if (!v) return null;

  if (v.__typename === "DiscountPercentage" && v.percentage !== undefined) {
    return {
      title: d.title ?? trimmed.toUpperCase(),
      description: `Code: ${trimmed.toUpperCase()}`,
      // Shopify returns percentage as 0..1 (0.1 = 10%). Convert to a
      // whole-number percentage string for the draft order input.
      value: (v.percentage * 100).toFixed(2),
      valueType: "PERCENTAGE",
    };
  }

  if (v.__typename === "DiscountAmount" && v.amount?.amount) {
    return {
      title: d.title ?? trimmed.toUpperCase(),
      description: `Code: ${trimmed.toUpperCase()}`,
      value: parseFloat(v.amount.amount).toFixed(2),
      valueType: "FIXED_AMOUNT",
    };
  }

  return null;
}

/* ── Update a real Order (tags + note) ────────────────────────────── */
const UPDATE_ORDER = /* GraphQL */ `
  mutation orderUpdate($input: OrderInput!) {
    orderUpdate(input: $input) {
      order {
        id
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type OrderUpdatePayload = {
  orderUpdate: {
    order: { id: string; tags: string[] } | null;
    userErrors: { field: string[]; message: string }[];
  };
};

export async function updateOrderTagsAndNote(
  orderId: string,
  tags: string[],
  note?: string,
): Promise<void> {
  const data = await adminGraphQL<OrderUpdatePayload>(UPDATE_ORDER, {
    input: {
      id: orderId,
      tags,
      ...(note ? { note } : {}),
    },
  });

  const { userErrors } = data.orderUpdate;
  if (userErrors.length > 0) {
    throw new Error(
      `Shopify orderUpdate userErrors: ${userErrors
        .map((e) => `${e.field?.join(".") ?? ""}: ${e.message}`)
        .join("; ")}`,
    );
  }
}

/* ── Newsletter subscribe ─────────────────────────────────────────
   Creates (or no-ops on) a Shopify customer with email-marketing
   consent so the address shows up in Shopify Admin → Customers and can
   be emailed / sent the welcome discount. Requires the write_customers
   scope on the custom app.

   "Email has already been taken" is treated as success — the person is
   already on the list. */

const CUSTOMER_CREATE = /* GraphQL */ `
  mutation customerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

type CustomerCreatePayload = {
  customerCreate: {
    customer: { id: string } | null;
    userErrors: { field: string[]; message: string }[];
  };
};

export async function subscribeNewsletter(
  email: string,
): Promise<{ ok: boolean; alreadySubscribed?: boolean; error?: string }> {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { ok: false, error: "invalid email" };
  }

  let data: CustomerCreatePayload;
  try {
    data = await adminGraphQL<CustomerCreatePayload>(CUSTOMER_CREATE, {
      input: {
        email: clean,
        emailMarketingConsent: {
          marketingState: "SUBSCRIBED",
          marketingOptInLevel: "SINGLE_OPT_IN",
        },
        tags: ["newsletter"],
      },
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const { customer, userErrors } = data.customerCreate;
  if (customer) return { ok: true };

  const taken = userErrors.some((e) =>
    /taken|already/i.test(e.message),
  );
  if (taken) return { ok: true, alreadySubscribed: true };

  return {
    ok: false,
    error: userErrors.map((e) => e.message).join("; ") || "unknown error",
  };
}

/* ── Orders (read-only, for the /admin dashboard) ─────────────────────────
   Requires the read_orders scope (already granted). */

export type AdminOrder = {
  id: string; // numeric id, for the Shopify admin order URL
  name: string; // "#1001"
  createdAt: string; // ISO
  financialStatus: string;
  fulfillmentStatus: string;
  total: number;
  shipping: number;
  currency: string;
};

const GET_ORDERS = /* GraphQL */ `
  query AdminOrders($query: String, $first: Int!) {
    orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          name
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          currentTotalPriceSet { shopMoney { amount currencyCode } }
          totalShippingPriceSet { shopMoney { amount currencyCode } }
        }
      }
    }
  }
`;

type OrdersQueryResult = {
  orders: {
    edges: {
      node: {
        id: string;
        name: string;
        createdAt: string;
        displayFinancialStatus: string | null;
        displayFulfillmentStatus: string | null;
        currentTotalPriceSet: {
          shopMoney: { amount: string; currencyCode: string };
        } | null;
        totalShippingPriceSet: {
          shopMoney: { amount: string; currencyCode: string };
        } | null;
      };
    }[];
  };
};

export async function getAdminOrders(opts: {
  query?: string;
  first?: number;
}): Promise<AdminOrder[]> {
  const data = await adminGraphQL<OrdersQueryResult>(GET_ORDERS, {
    query: opts.query ?? null,
    first: Math.min(opts.first ?? 100, 250),
  });

  return (data.orders?.edges ?? []).map(({ node }) => ({
    id: node.id.split("/").pop() ?? node.id,
    name: node.name,
    createdAt: node.createdAt,
    financialStatus: node.displayFinancialStatus ?? "—",
    fulfillmentStatus: node.displayFulfillmentStatus ?? "—",
    total: parseFloat(node.currentTotalPriceSet?.shopMoney.amount ?? "0"),
    shipping: parseFloat(node.totalShippingPriceSet?.shopMoney.amount ?? "0"),
    currency: node.currentTotalPriceSet?.shopMoney.currencyCode ?? "EUR",
  }));
}

/* ── V2 pen waiting list ──────────────────────────────────────────────────
   Signups are stored in a shop metafield (waitlist.emails, a JSON list) so the
   displayed size = WAITLIST_BASE + the number of unique emails — it starts at
   132 and only moves on a genuinely new signup. We ALSO try to create a
   marketing-subscribed Shopify customer tagged "v2-pen-waitlist" (best-effort);
   that populates the Customers / mailing list but needs the app's
   `write_customers` scope. Until that scope is granted the email is still
   safely captured in the metafield list, so the popup works and no lead is
   lost. */
export const WAITLIST_TAG = "v2-pen-waitlist";
export const WAITLIST_BASE = 132;
const WAITLIST_MF = { namespace: "waitlist", key: "emails" };

let cachedShopGid: string | null = null;
async function getShopGid(): Promise<string> {
  if (cachedShopGid) return cachedShopGid;
  const data = await adminGraphQL<{ shop: { id: string } }>(`{ shop { id } }`);
  cachedShopGid = data.shop.id;
  return cachedShopGid;
}

/** Stored signup emails (lowercased). Empty on any read/parse error. */
export async function readWaitlistEmails(): Promise<string[]> {
  try {
    const data = await adminGraphQL<{
      shop: { metafield: { value: string } | null };
    }>(
      `{ shop { metafield(namespace:"${WAITLIST_MF.namespace}", key:"${WAITLIST_MF.key}") { value } } }`,
    );
    const raw = data.shop.metafield?.value;
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((e): e is string => typeof e === "string")
      : [];
  } catch {
    return [];
  }
}

async function writeWaitlistEmails(emails: string[]): Promise<void> {
  const ownerId = await getShopGid();
  await adminGraphQL(
    `mutation($m:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$m){ userErrors{ message } } }`,
    {
      m: [
        {
          ownerId,
          namespace: WAITLIST_MF.namespace,
          key: WAITLIST_MF.key,
          type: "json",
          value: JSON.stringify(emails),
        },
      ],
    },
  );
}

/** Best-effort add to Shopify Customers (no-op until write_customers is granted). */
async function tryCreateCustomer(email: string): Promise<void> {
  try {
    await adminGraphQL<CustomerCreatePayload>(CUSTOMER_CREATE, {
      input: {
        email,
        emailMarketingConsent: {
          marketingState: "SUBSCRIBED",
          marketingOptInLevel: "SINGLE_OPT_IN",
        },
        tags: [WAITLIST_TAG],
      },
    });
  } catch {
    // Scope not granted yet — the email is still captured in the metafield list.
  }
}

/** Total displayed waiting-list size (base + unique signups). */
export async function waitlistCount(): Promise<number> {
  return WAITLIST_BASE + (await readWaitlistEmails()).length;
}

/**
 * Join the V2 pen waiting list: capture the email (metafield list + best-effort
 * Shopify customer) and return the up-to-date displayed count. A genuinely new
 * email moves the counter; a repeat doesn't.
 */
export async function joinWaitlist(
  email: string,
): Promise<{ ok: boolean; count: number; error?: string }> {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { ok: false, count: WAITLIST_BASE, error: "invalid email" };
  }

  let emails: string[];
  try {
    emails = await readWaitlistEmails();
  } catch (err) {
    return {
      ok: false,
      count: WAITLIST_BASE,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Repeat signup → no counter change, but still (re)attempt the customer.
  if (emails.includes(clean)) {
    await tryCreateCustomer(clean);
    return { ok: true, count: WAITLIST_BASE + emails.length };
  }

  const next = [...emails, clean];
  try {
    await writeWaitlistEmails(next);
  } catch (err) {
    return {
      ok: false,
      count: WAITLIST_BASE + emails.length,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  await tryCreateCustomer(clean);
  return { ok: true, count: WAITLIST_BASE + next.length };
}
