import { baseUrl } from "lib/utils";
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/cart",
          "/checkout",
          "/order-confirmed",
          "/track",
          "/wishlist",
          "/_next/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/cart",
          "/checkout",
          "/order-confirmed",
          "/track",
          "/wishlist",
        ],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: [
          "/api/",
          "/cart",
          "/checkout",
          "/order-confirmed",
          "/track",
          "/wishlist",
        ],
      },
      // AdsBot ignores the generic "*" rules unless named explicitly. Keep the
      // advertised product/shop landing pages crawlable — blocking those causes
      // "destination not crawlable" ad disapprovals.
      { userAgent: "AdsBot-Google", allow: "/" },
      { userAgent: "AdsBot-Google-Mobile", allow: "/" },
      // Block AI training crawlers that don't respect llms.txt opt-outs
      { userAgent: "GPTBot", disallow: ["/"] },
      { userAgent: "ChatGPT-User", disallow: ["/"] },
      { userAgent: "CCBot", disallow: ["/"] },
      { userAgent: "anthropic-ai", disallow: ["/"] },
      { userAgent: "Claude-Web", disallow: ["/"] },
      { userAgent: "cohere-ai", disallow: ["/"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
