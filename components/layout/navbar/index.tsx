import CartModal from "components/cart/modal";
import OpenCart from "components/cart/open-cart";
import { LanguageToggle, LanguageToggleMini } from "components/language-toggle";
import { getMenu, getProduct, getProducts } from "lib/woocommerce";
import { Menu } from "lib/woocommerce/types";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import type { ShopMenuProduct } from "lib/shop-groups";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import LegalDropdown from "./legal-dropdown";
import MobileMenu from "./mobile-menu";
import { NavLinks } from "./nav-links";
import { NavbarBars } from "./navbar-bars";
import Search, { SearchSkeleton } from "./search";
import { ThemeToggle } from "./theme-toggle";

const { SITE_NAME } = process.env;

export const PRIMARY_NAV = [
  { title: "Home", path: "/" },
  { title: "Shop", path: "/shop" },
  { title: "Lab Results", path: "/lab-results" },
  { title: "Contact Us", path: "/contact" },
];

// Paths intentionally kept OUT of the primary nav (they still live in the
// footer). About Us, FAQ and Track Order cluttered the top bar; removing them
// keeps the nav focused on the buying path.
const NAV_EXCLUDE = new Set(["/about", "/faq", "/track"]);
const CONTACT_PATH = "/contact";

export async function Navbar() {
  // Defensive catches — the navbar renders on every route, so a single
  // transient Shopify error must not take down the entire site.
  const [menu, upsellProduct, allProducts] = await Promise.all([
    getMenu("next-js-frontend-header-menu").catch(() => [] as Menu[]),
    getProduct("bacteriostatic-water-bac-water").catch(() => undefined),
    // Powers the desktop Shop mega-menu (products grouped by theme).
    // Cached for hours, so this is cheap on subsequent renders.
    getProducts({}).catch(() => []),
  ]);

  // Lightweight product list for the Shop mega-menu — strip to just what the
  // menu needs and drop hidden products. getProducts() already returns vials
  // only (pens, HGH, anabolics and accessories are filtered out in
  // lib/woocommerce), so the menu never links to an unlisted product.
  const shopProducts: ShopMenuProduct[] = allProducts
    .filter((p) => !p.tags.includes(HIDDEN_PRODUCT_TAG))
    .map((p) => ({
      handle: p.handle,
      title: p.title,
      available: p.availableForSale,
    }));
  const rawLinks: Menu[] = menu.length > 0 ? menu : (PRIMARY_NAV as Menu[]);

  // Normalise whatever source we got (Shopify menu OR the fallback) to the
  // desired top-bar set: drop the excluded paths.
  const navLinks: Menu[] = rawLinks.filter(
    (l) => !NAV_EXCLUDE.has(l.path),
  );
  // Force the desired top-bar order so Shopify menu drift can't move the
  // entries around: Home → Shop → Lab Results → Contact.
  const order = [
    "/",
    "/shop",
    "/lab-results",
    CONTACT_PATH,
  ];
  navLinks.sort((a, b) => {
    const ia = order.indexOf(a.path);
    const ib = order.indexOf(b.path);
    // Items NOT in the explicit list keep their relative order, slotted in
    // before the items that ARE listed (i.e. they appear in the middle if
    // any sneaks through). Listed items follow `order`.
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return -1;
    if (ib === -1) return 1;
    return ia - ib;
  });

  return (
    <>
      {/* ── Promo bar: scrolls away ───────────────────────────────────────── */}
      <NavbarBars />

      {/* ── Main sticky nav ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 xl:h-[72px] xl:px-6 2xl:px-8">

          {/* < xl: hamburger */}
          <div className="shrink-0 xl:hidden">
            <Suspense fallback={null}>
              <MobileMenu menu={navLinks} />
            </Suspense>
          </div>

          {/* Logo */}
          <div className="flex flex-1 justify-center xl:flex-none xl:justify-start xl:mr-3 2xl:mr-4">
            <Link
              href="/"
              prefetch={true}
              aria-label={SITE_NAME ?? "BioSyncLabs — home"}
              className="flex items-center"
            >
              <div className="relative h-12 w-[170px] sm:w-[200px] xl:w-[180px] 2xl:w-[200px]">
                <Image
                  src="/logo2.png"
                  alt={SITE_NAME ?? "BioSyncLabs"}
                  fill
                  sizes="(min-width: 1536px) 200px, (min-width: 1280px) 180px, (min-width: 640px) 200px, 170px"
                  className="object-contain object-center xl:object-left"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* >= xl: nav links */}
          <div className="hidden min-w-0 shrink xl:flex">
            <Suspense fallback={null}>
              <NavLinks links={navLinks} shopProducts={shopProducts} />
            </Suspense>
          </div>

          <div className="hidden flex-1 xl:block" />

          {/* Right cluster */}
          <div className="flex shrink-0 items-center gap-1.5">
            <div className="hidden items-center gap-1 xl:flex">
              <div className="hidden 2xl:block">
                <ThemeToggle />
              </div>
              <LanguageToggle />
              <div className="mx-1 hidden h-5 w-px bg-slate-200 dark:bg-slate-700 2xl:block" />
              <div className="hidden 2xl:block">
                <LegalDropdown />
              </div>
              <div className="hidden 2xl:block">
                <Suspense fallback={<SearchSkeleton />}>
                  <Search />
                </Suspense>
              </div>
            </div>
            <div className="xl:hidden">
              <LanguageToggleMini />
            </div>
            <Suspense fallback={<OpenCart />}>
              <CartModal upsellProduct={upsellProduct} />
            </Suspense>
          </div>

        </div>
      </header>
    </>
  );
}
