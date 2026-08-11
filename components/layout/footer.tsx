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

            {/* Social links */}
            <div className="mt-6 flex gap-3">
              {[
                {
                  label: "Instagram",
                  href: "https://www.instagram.com/biosynclabseu/",
                  icon: (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  ),
                },
                {
                  label: "TikTok",
                  href: "https://www.tiktok.com/@biosynclabseu",
                  icon: (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
                    </svg>
                  ),
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-white text-blue-400 shadow-sm transition-all hover:border-blue-300 hover:text-blue-700"
                >
                  {social.icon}
                </a>
              ))}
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
