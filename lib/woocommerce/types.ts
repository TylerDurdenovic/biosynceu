// ── Raw WooCommerce REST API types ──────────────────────────────────────────

export type WCProductImage = {
  id: number;
  src: string;
  name: string;
  alt: string;
};

export type WCProductAttribute = {
  id: number;
  name: string;
  options: string[];
  variation: boolean;
  visible: boolean;
};

export type WCProductVariation = {
  id: number;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_status: "instock" | "outofstock" | "onbackorder";
  stock_quantity: number | null;
  manage_stock: boolean;
  purchasable: boolean;
  attributes: { id: number; name: string; option: string }[];
  image?: WCProductImage;
};

export type WCProduct = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  status: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  stock_status: "instock" | "outofstock" | "onbackorder";
  manage_stock: boolean;
  stock_quantity: number | null;
  featured: boolean;
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  images: WCProductImage[];
  attributes: WCProductAttribute[];
  variations: number[];
  type: "simple" | "variable" | "grouped" | "external";
  date_created: string;
  date_modified: string;
  meta_data: { id: number; key: string; value: string | object }[];
};

export type WCCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  image?: WCProductImage;
  parent: number;
};

export type WCPage = {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  slug: string;
  status: string;
  date: string;
  modified: string;
};

export type WCCoupon = {
  id: number;
  code: string;
  amount: string;
  discount_type: "percent" | "fixed_cart" | "fixed_product";
  date_expires: string | null;
  usage_count: number;
  usage_limit: number | null;
};

// ── Shared types (same shape as lib/shopify/types.ts) ───────────────────────

export type Money = {
  amount: string;
  currencyCode: string;
};

export type Image = {
  url: string;
  altText: string;
  width: number;
  height: number;
};

export type SEO = {
  title: string;
  description: string;
};

export type ProductOption = {
  id: string;
  name: string;
  values: string[];
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  currentlyNotInStock?: boolean;
  selectedOptions: { name: string; value: string }[];
  price: Money;
  compareAtPrice?: Money | null;
  image?: Image;
  novaImages?: Image[];
};

export type Product = {
  id: string;
  handle: string;
  availableForSale: boolean;
  title: string;
  description: string;
  descriptionHtml: string;
  options: ProductOption[];
  priceRange: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  // Original ("was") price range when the product is on sale — used to render
  // the struck-through old price + sale badge. Null when nothing is discounted.
  compareAtPriceRange?: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  } | null;
  variants: ProductVariant[];
  featuredImage: Image;
  images: Image[];
  seo: SEO;
  tags: string[];
  updatedAt: string;
};

export type Collection = {
  handle: string;
  title: string;
  description: string;
  seo: SEO;
  path: string;
  updatedAt: string;
};

export type Menu = {
  title: string;
  path: string;
};

export type Page = {
  id: string;
  title: string;
  handle: string;
  body: string;
  bodySummary: string;
  seo?: SEO;
  createdAt: string;
  updatedAt: string;
};

export type CartProduct = {
  id: string;
  handle: string;
  title: string;
  featuredImage: Image;
};

export type CartItem = {
  id: string | undefined;
  quantity: number;
  cost: { totalAmount: Money };
  merchandise: {
    id: string;
    title: string;
    selectedOptions: { name: string; value: string }[];
    product: CartProduct;
  };
};

export type DiscountCode = {
  code: string;
  applicable: boolean;
};

export type DiscountAllocation = {
  discountedAmount: Money;
};

export type Cart = {
  id: string | undefined;
  checkoutUrl: string;
  attributes?: { key: string; value: string }[];
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount: Money;
  };
  lines: CartItem[];
  totalQuantity: number;
  discountCodes?: DiscountCode[];
  discountAllocations?: DiscountAllocation[];
};

// ── Internal cart storage (serialised into the wc_cart cookie) ───────────────

/** Stored coupon — includes type+amount so we can calculate offline */
export type StoredDiscount = {
  code: string;
  applicable: boolean;
  discountType: "percent" | "fixed_cart" | "fixed_product";
  amount: string;
};

export type StoredCartItem = {
  key: string;
  productId: number;
  variationId: number;
  quantity: number;
  name: string;
  variantTitle: string;
  price: string;
  currency: string;
  image: Image;
  handle: string;
  selectedOptions: { name: string; value: string }[];
};

export type StoredCart = {
  id: string;
  items: StoredCartItem[];
  discounts: StoredDiscount[];
  attributes: { key: string; value: string }[];
};
