import { isAnabolic } from "lib/departments";
import { GUIDES } from "lib/guides-data";
import { isHgh } from "lib/product-category";
import { getPages, getProducts } from "lib/woocommerce";
import { baseUrl, validateEnvironmentVariables } from "lib/utils";
import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  validateEnvironmentVariables();

  const now = new Date().toISOString();

  const benefitCollections = [
    "longevity-and-anti-aging-research",
    "weight-loss-research",
    "sleep-enhancement-research",
    "immunity-enhancement-research",
    "muscle-growth-research",
    "cognitive-enhancement-research",
    "healing-and-regeneration-research",
    // Synthetic "pens" research-area category
    "pens",
  ];

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    // Benefit research area category pages
    ...benefitCollections.map((handle) => ({
      url: `${baseUrl}/shop?collection=${handle}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    {
      url: `${baseUrl}/guides`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...GUIDES.map((guide) => ({
      url: `${baseUrl}/guides/${guide.slug}`,
      lastModified: guide.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${baseUrl}/lab-results`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-returns`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const productsPromise = getProducts({}).then((products) =>
    products
      // Keep HGH/somatropin (and any anabolic-tagged item) out of the sitemap —
      // they're excluded from the storefront Google sees.
      .filter((product) => !isHgh(product) && !isAnabolic(product))
      .map((product) => ({
      url: `${baseUrl}/product/${product.handle}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      // Image sitemap data — lets Google Images index the product photo.
      // Guard against products without a featured image so a single bad
      // record can't break the whole sitemap.
      ...(product.featuredImage?.url
        ? { images: [product.featuredImage.url] }
        : {}),
    })),
  );

  const pagesPromise = getPages().then((pages) =>
    pages.map((page) => ({
      url: `${baseUrl}/${page.handle}`,
      lastModified: page.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  );

  let fetchedRoutes: MetadataRoute.Sitemap = [];

  try {
    fetchedRoutes = (await Promise.all([productsPromise, pagesPromise])).flat();
  } catch (error) {
    // If Shopify is unreachable or returns malformed data, don't throw — a
    // failed sitemap response is worse for crawlers than a partial one.
    // Fall back to the static routes so home/shop/categories/guides stay
    // indexable.
    console.error("sitemap: failed to fetch products/pages, falling back to static routes", error);
    fetchedRoutes = [];
  }

  return [...staticRoutes, ...fetchedRoutes];
}
