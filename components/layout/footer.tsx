import FooterMenu from "components/layout/footer-menu";
import {
  FooterBottomLinks,
  FooterContactLabel,
  FooterCopyright,
  FooterLinks,
  FooterLocationLabel,
  FooterTagline,
} from "components/layout/footer-translated";
import { FooterNewsletter } from "components/footer-newsletter";
import { getMenu } from "lib/woocommerce";
import { Menu } from "lib/woocommerce/types";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

const { SITE_NAME } = process.env;

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  const copyrightDate = 2025 + (currentYear > 2025 ? `–${currentYear}` : "");
  // Footer renders on every page; never let a transient Shopify error here
  // turn into a site-wide 500.
  const menu = await getMenu("next-js-frontend-footer-menu").catch(() => [] as Menu[]);
  const siteName = SITE_NAME ?? "BioSyncLabs";

  return (
    <footer className="border-t border-blue-100 bg-[#f6f7f9] dark:border-slate-800 dark:bg-slate-900">
      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <div className="relative" style={{ height: "100px", width: "100%", maxWidth: "260px" }}>
                <Image
                  src="/logo2.png"
                  alt={siteName}
                  fill
                  sizes="(max-width: 640px) 100vw, 260px"
                  className="object-contain object-left"
                />
              </div>
            </Link>
            <FooterTagline />

            {/* Contact */}
            <div className="mt-5">
              <FooterContactLabel />
              <a
                href="mailto:research@biosynclabs.to"
                className="inline-flex items-center gap-2 text-sm text-blue-700 transition-colors hover:text-blue-900"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                research@biosynclabs.to
              </a>
            </div>

            {/* Address */}
            <div className="mt-4">
              <FooterLocationLabel />
              <address className="not-italic text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                ul. Stanisława Leszczyńskiego 4/25<br />
                50-078 Wrocław, Poland
              </address>
            </div>
          </div>

          {/* Links columns */}
          <FooterLinks />
        </div>

        {/* Newsletter strip */}
        <div className="mt-10 border-t border-blue-100 pt-10 dark:border-slate-700">
          <FooterNewsletter />
        </div>

        {/* Dynamic Shopify footer menu */}
        {menu.length > 0 && (
          <div className="mt-12 border-t border-blue-100 pt-8">
            <Suspense fallback={null}>
              <FooterMenu menu={menu} />
            </Suspense>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-blue-100 bg-blue-900 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 py-5 text-xs text-blue-300 md:flex-row md:justify-between">
          <FooterCopyright copyrightDate={copyrightDate} />
          <FooterBottomLinks />
        </div>
      </div>
    </footer>
  );
}
