export default {
  experimental: {
    ppr: true,
    inlineCss: true,
    useCache: true,
  },
  async redirects() {
    return [
      {
        source: "/search/:collection",
        destination: "/shop?collection=:collection",
        permanent: false,
      },
      // Anabolics section removed — send any old links to the shop.
      { source: "/anabolics", destination: "/shop", permanent: false },
      { source: "/steroids", destination: "/shop", permanent: false },
      { source: "/injectables", destination: "/shop", permanent: false },
      { source: "/pct", destination: "/shop", permanent: false },
      { source: "/ai", destination: "/shop", permanent: false },
      // Calculator + pen guide removed — redirect old links.
      { source: "/peptide-calculator", destination: "/", permanent: false },
      { source: "/guides/pen-guide", destination: "/guides", permanent: false },
    ];
  },
  images: {
    // loaderFile is not supported by Turbopack (dev uses --turbopack).
    // unoptimized bypasses the /_next/image proxy entirely — images are
    // served directly from their source URL (Shopify CDN / public/).
    // Shopify CDN already handles WebP, AVIF, and resizing natively.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
    ],
  },
};
