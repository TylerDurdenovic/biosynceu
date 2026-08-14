import AffiliateTracker from "components/affiliate-tracker";
import { DiscountPopup } from "components/discount-popup";
import RouteProgress from "components/route-progress";
import { CartProvider } from "components/cart/cart-context";
import { Navbar } from "components/layout/navbar";
import { HideOnAdmin } from "components/layout/hide-on-admin";
import { SupportButton } from "components/support-button";
import { WaitlistPopup } from "components/waitlist-popup";
import { LanguageProvider } from "contexts/language-context";
import { ThemeProvider } from "contexts/theme-context";
import { WishlistProvider } from "contexts/wishlist-context";
import { getCart } from "lib/woocommerce";
import { baseUrl } from "lib/utils";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import type { Lang } from "lib/i18n/translations";
import { ReactNode, Suspense } from "react";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const { SITE_NAME } = process.env;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "BioSyncLabs | Buy Research Peptides in Germany & EU — ≥99% Purity",
    template: `%s | ${SITE_NAME ?? "BioSyncLabs"}`,
  },
  description:
    "BioSyncLabs — Germany's trusted EU research peptide supplier. Buy BPC-157, TB-500, GHK-Cu, Retatrutide and more. Every batch third-party HPLC tested to ≥99% purity. Certificate of Analysis available online. Fast EU shipping, no customs delays.",
  keywords: [
    // Brand
    "BioSyncLabs",
    "biosynclabs.de",
    "BioSyncLabs peptides",
    "BioSyncLabs review",
    // Core product — EN
    "buy peptides Germany",
    "peptides for research Germany",
    "research peptides EU",
    "peptide research chemicals Europe",
    "high purity peptides online",
    "research grade peptides",
    "lab grade peptides",
    "peptide supplier Germany",
    "peptide shop EU",
    "lyophilized peptides buy",
    "buy peptides Europe fast shipping",
    "EU peptide supplier no prescription",
    "best peptide supplier EU",
    "peptide company Germany",
    "Germany peptide lab",
    // Peptide names
    "BPC-157",
    "BPC-157 buy",
    "BPC-157 Germany",
    "TB-500",
    "TB-500 buy EU",
    "Thymosin Beta-4",
    "GHK-Cu",
    "copper peptide GHK",
    "Retatrutide",
    "Retatrutide EU",
    "CJC-1295",
    "Ipamorelin",
    "Selank peptide",
    "Semax peptide",
    "DSIP peptide",
    "Epithalon peptide",
    "AOD-9604",
    "GHRP-6",
    "GHRP-2",
    "PT-141",
    "Melanotan 2 EU",
    "Hexarelin",
    "Tesamorelin",
    "Kisspeptin",
    "Follistatin 344",
    "SS-31 peptide",
    "NAD+",
    // Informational
    "what are research peptides",
    "how do peptides work",
    "peptide research guide",
    "BPC-157 effects mechanism",
    "peptide reconstitution guide",
    "bacteriostatic water peptides",
    "peptide purity HPLC",
    "are peptides legal in Germany",
    "peptide research legal EU",
    "peptide certificate of analysis",
    // German — Transactional
    "Peptide kaufen Deutschland",
    "Peptide bestellen EU",
    "Forschungspeptide kaufen",
    "Peptide Onlineshop Deutschland",
    "legale Forschungspeptide",
    "Peptide legal Deutschland",
    "wo Peptide kaufen in Deutschland",
    "Peptide kaufen ohne Zoll",
    "Peptide aus Europa",
    "Peptide aus Deutschland",
    "günstige Peptide",
    "seriöse Peptide Anbieter",
    // German — Per peptide kaufen
    "BPC-157 kaufen",
    "TB-500 kaufen",
    "TB-500 kaufen Deutschland",
    "GHK-Cu kaufen",
    "Kupferpeptid kaufen",
    "Retatrutide kaufen",
    "CJC-1295 kaufen",
    "Ipamorelin kaufen",
    "Selank kaufen",
    "Semax kaufen",
    "DSIP kaufen",
    "Epithalon kaufen",
    "AOD-9604 kaufen",
    "GHRP-6 kaufen",
    "GHRP-2 kaufen",
    "PT-141 kaufen",
    "Melanotan 2 kaufen",
    "Hexarelin kaufen",
    "Tesamorelin kaufen",
    "Kisspeptin kaufen",
    "Follistatin 344 kaufen",
    "SS-31 kaufen",
    "NAD+ kaufen",
    // German — informational
    "Peptide für Haut",
    "Peptide für Schlaf",
    "Peptide für Regeneration",
    "Peptide Erfahrung",
    "was sind die besten Peptide",
    // General
    "RUO compounds",
    "research use only",
  ],
  authors: [{ name: "BioSyncLabs", url: baseUrl }],
  creator: "BioSyncLabs",
  publisher: "BioSyncLabs",
  robots: {
    follow: true,
    index: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Site-ownership verification tokens. Read from env vars so secrets
  // aren't committed. To set up:
  //  1. In Google Search Console → Add property → choose "URL prefix" →
  //     pick "HTML tag" verification → copy the `content="..."` value.
  //  2. Add it to .env / Vercel env as NEXT_PUBLIC_GSC_VERIFICATION.
  //  3. Redeploy. GSC will detect the meta tag on the next refresh.
  verification: {
    ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
      : {}),
    ...(process.env.NEXT_PUBLIC_BING_VERIFICATION
      ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION } }
      : {}),
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      "en": baseUrl,
      "de": baseUrl,
      "x-default": baseUrl,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_EU",
    alternateLocale: ["de_DE"],
    url: baseUrl,
    siteName: "BioSyncLabs",
    title: "BioSyncLabs | Buy Research Peptides Germany & EU — ≥99% Purity",
    description:
      "Germany-based EU research peptide supplier. Buy BPC-157, TB-500, GHK-Cu, Retatrutide and more. HPLC-verified ≥99% purity. CoA available online. Fast intra-EU shipping.",
    images: [
      {
        url: "/logo2.png",
        width: 1200,
        height: 630,
        alt: "BioSyncLabs — EU Research Peptides, Germany",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BioSyncLabs | EU Research Peptides — Buy in Germany",
    description:
      "Germany-based supplier of research-grade peptides. HPLC-verified ≥99% purity. CoA available online. Fast EU shipping.",
    images: ["/logo2.png"],
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
  },
};

/**
 * Site-wide structured data graph.
 *
 * Why each block matters for SEO ranking on branded queries:
 *
 *  - Organization: builds the Google Knowledge Panel that shows on the right
 *    side of branded searches. `alternateName` ensures shortened brand
 *    queries ("BioSync") still resolve to us. `sameAs` and `contactPoint`
 *    feed the Knowledge Panel.
 *  - WebSite + SearchAction: enables the inline "Search this site" sitelink.
 *  - SiteNavigationElement: the *single most important* signal for Google
 *    sitelinks — a machine-readable list of our top pages. Sitelinks are
 *    auto-generated by Google but appear ~3–5× faster when this schema is
 *    present and the pages have unique titles + healthy internal linking.
 */
const siteNav = [
  { name: "Shop Peptides", path: "/shop" },
  { name: "Lab Results", path: "/lab-results" },
  { name: "Research Guides", path: "/guides" },
  { name: "About Us", path: "/about" },
  { name: "Contact", path: "/contact" },
  { name: "FAQ", path: "/faq" },
];

/**
 * Shop research-area categories. Exposed both as individual
 * SiteNavigationElement entities (so Google can surface them as sitelinks
 * under a "BioSyncLabs" branded search) and as a single ItemList that
 * describes the shop taxonomy. Friendly names are intentionally short so
 * they read well as sitelink labels.
 */
const shopCategories = [
  { name: "Weight Loss", handle: "weight-loss-research" },
  { name: "Healing & Regeneration", handle: "healing-and-regeneration-research" },
  { name: "Longevity & Anti-aging", handle: "longevity-and-anti-aging-research" },
  { name: "Muscle Growth", handle: "muscle-growth-research" },
  { name: "Sleep", handle: "sleep-enhancement-research" },
  { name: "Immunity", handle: "immunity-enhancement-research" },
  { name: "Cognitive", handle: "cognitive-enhancement-research" },
  { name: "Pens", handle: "pens" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      // Dual-type: Organization for the Knowledge Panel + OnlineStore to make
      // the e-commerce nature explicit to Google.
      "@type": ["Organization", "OnlineStore"],
      "@id": `${baseUrl}/#organization`,
      name: "BioSyncLabs",
      alternateName: ["BioSync", "BioSync Labs", "biosynclabs.de"],
      legalName: "BioSyncLabs",
      url: baseUrl,
      email: "research@biosynclabs.to",
      foundingDate: "2024",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo2.png`,
        width: 1200,
        height: 630,
      },
      image: `${baseUrl}/logo2.png`,
      // Real social profiles — sameAs is one of the strongest signals Google
      // uses to attach a Knowledge Panel to a brand.
      sameAs: [
        "https://www.instagram.com/biosynclabseu/",
        "https://www.tiktok.com/@biosynclabseu",
      ],
      slogan: "Germany's trusted EU research peptide supplier",
      description:
        "BioSyncLabs is a Germany-based supplier of research-grade peptides and bioscience compounds for licensed laboratory and academic research. Every batch is third-party HPLC tested to ≥99% purity. All products sold strictly for Research Use Only (RUO).",
      knowsAbout: [
        "research peptides",
        "BPC-157",
        "TB-500",
        "GHK-Cu",
        "Retatrutide",
        "peptide reconstitution",
        "HPLC peptide purity testing",
      ],
      areaServed: [
        { "@type": "Country", name: "Germany" },
        { "@type": "Place", name: "European Union" },
      ],
      address: {
        "@type": "PostalAddress",
        addressCountry: "DE",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        url: `${baseUrl}/contact`,
        availableLanguage: ["English", "German"],
        areaServed: "EU",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: "BioSyncLabs",
      alternateName: "BioSync",
      inLanguage: ["en", "de"],
      publisher: { "@id": `${baseUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    // SiteNavigationElement: each top-nav link as its own entity. This is
    // what unlocks the multi-row sitelinks layout in branded SERPs.
    ...siteNav.map((item) => ({
      "@type": "SiteNavigationElement",
      name: item.name,
      url: `${baseUrl}${item.path}`,
    })),
    // Each shop research-area category as a SiteNavigationElement so Google
    // can surface them as category sitelinks under a branded search.
    ...shopCategories.map((cat) => ({
      "@type": "SiteNavigationElement",
      name: cat.name,
      url: `${baseUrl}/shop?collection=${cat.handle}`,
    })),
    // ItemList describing the shop taxonomy — gives Google a single
    // machine-readable map of our research-area categories.
    {
      "@type": "ItemList",
      "@id": `${baseUrl}/#shop-categories`,
      name: "Research Areas",
      description:
        "Browse BioSyncLabs research peptides by research area.",
      itemListElement: shopCategories.map((cat, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: cat.name,
        url: `${baseUrl}/shop?collection=${cat.handle}`,
      })),
    },
  ],
};

/**
 * Resolve the initial UI language on the server so the first paint is already
 * correct. Priority: an explicit `lang` cookie (set when the customer used the
 * toggle) → otherwise the browser's Accept-Language header. German-market
 * visitors (biosynclabs.de) now get German immediately instead of a flash of
 * English — the exact thing customers complained about.
 */
function resolveInitialLang(
  cookieLang: string | undefined,
  acceptLanguage: string,
): Lang {
  if (cookieLang === "de" || cookieLang === "en") return cookieLang;
  // Walk the Accept-Language tags in priority order; first de*/en* wins.
  const tags = acceptLanguage
    .split(",")
    .map((t) => t.trim().split(";")[0]?.toLowerCase() ?? "");
  for (const tag of tags) {
    if (tag.startsWith("de")) return "de";
    if (tag.startsWith("en")) return "en";
  }
  return "en";
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // The cart promise is unwrapped by `use()` inside CartProvider, which would
  // re-throw a rejection up to the global error boundary — meaning a transient
  // Shopify error here would crash *every* route. Catch into undefined so the
  // app falls back to the empty-cart state and createCartAndSetCookie() runs.
  const cart = getCart().catch(() => undefined);

  // Server-side language detection (cookie → Accept-Language). Guarded so a
  // header/cookie hiccup can never crash the root layout.
  let initialLang: Lang = "en";
  try {
    const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
    initialLang = resolveInitialLang(
      cookieStore.get("lang")?.value,
      headerStore.get("accept-language") ?? "",
    );
  } catch {
    // keep "en"
  }

  return (
    <html lang={initialLang} className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-18133261732"
          strategy="afterInteractive"
        />
        <Script
          id="gtag-aw-18133261732"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'AW-18133261732');
`.trim(),
          }}
        />
        {/* Smartsupp Live Chat script */}
        <Script
          id="smartsupp-live-chat"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
var _smartsupp = _smartsupp || {};
_smartsupp.key = 'e3a0bbae73e41db34d88866f40ae5aee14ab93f0';
// Ensure the widget is on the right side.
_smartsupp.orientation = 'right';
window.smartsupp||(function(d) {
  var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
  s=d.getElementsByTagName('script')[0];c=d.createElement('script');
  c.type='text/javascript';c.charset='utf-8';c.async=true;
  c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
})(document);

// If the widget is configured as "hidden" in dashboard,
// force it to show once the API becomes available.
(function () {
  var tries = 0;
  var id = setInterval(function () {
    tries++;
    if (window.smartsupp) {
      try { window.smartsupp('chat:show'); } catch (e) {}
      clearInterval(id);
    }
    if (tries > 40) clearInterval(id);
  }, 250);
})();
`.trim(),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#F8FAFC] text-[#0F172A] selection:bg-blue-100 selection:text-blue-900 antialiased">
        {/* Top loading bar on route changes — instant "it's loading" feedback */}
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <ThemeProvider>
          <LanguageProvider initialLang={initialLang}>
            <WishlistProvider>
              <CartProvider cartPromise={cart}>
                {/* Captures ?sca_ref from URL → stores 30-day cookie for
                    Shopify Collabs affiliate attribution. Renders nothing. */}
                <AffiliateTracker />
                <HideOnAdmin>
                  <Navbar />
                </HideOnAdmin>
                <main className="min-h-screen">{children}</main>
                <HideOnAdmin>
                  <SupportButton />
                </HideOnAdmin>
                {/* SHOP10 10%-off welcome popup — first visit only, and it
                    suppresses the waitlist popup so the two never stack. */}
                <HideOnAdmin>
                  <DiscountPopup />
                </HideOnAdmin>
                {/* V2 pen waiting-list popup. Kill-switch: set
                    NEXT_PUBLIC_WAITLIST_POPUP=off before pointing Google Ads at
                    the site — a promo popup + pen + giveaway is the ad-policy
                    risk the audit flagged. */}
                {process.env.NEXT_PUBLIC_WAITLIST_POPUP !== "off" && (
                  <HideOnAdmin>
                    <WaitlistPopup />
                  </HideOnAdmin>
                )}
                <Toaster
                  closeButton
                  toastOptions={{
                    style: {
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      color: "#0F172A",
                      fontFamily: "Inter, system-ui, sans-serif",
                    },
                  }}
                />
              </CartProvider>
            </WishlistProvider>
          </LanguageProvider>
        </ThemeProvider>
        <noscript>
          Powered by{" "}
          <a href="https://www.smartsupp.com" target="_blank" rel="noreferrer">
            Smartsupp
          </a>
        </noscript>
      </body>
    </html>
  );
}
