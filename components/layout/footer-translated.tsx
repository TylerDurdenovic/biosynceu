"use client";

import { useLanguage } from "contexts/language-context";
import Link from "next/link";

const FOOTER_LINK_PATHS = {
  shop: {
    allProducts: "/shop",
    collections: "/shop",
    newArrivals: "/search?sort=latest-desc",
    bestSellers: "/search?sort=trending-desc",
  },
  company: {
    about: "/about",
    labResults: "/lab-results",
    faq: "/faq",
    contact: "/contact",
  },
  legal: {
    terms: "/terms-of-service",
    refunds: "/refund-returns",
    shipping: "/shipping-policy",
    privacy: "/privacy-policy",
  },
};

export function FooterLinks() {
  const { t } = useLanguage();

  const groups = [
    {
      heading: t.footer.shop.heading,
      links: [
        { label: t.footer.shop.allProducts, href: FOOTER_LINK_PATHS.shop.allProducts },
        { label: t.footer.shop.collections, href: FOOTER_LINK_PATHS.shop.collections },
        { label: t.footer.shop.newArrivals, href: FOOTER_LINK_PATHS.shop.newArrivals },
        { label: t.footer.shop.bestSellers, href: FOOTER_LINK_PATHS.shop.bestSellers },
      ],
    },
    {
      heading: t.footer.company.heading,
      links: [
        { label: t.footer.company.about, href: FOOTER_LINK_PATHS.company.about },
        { label: t.footer.company.labResults, href: FOOTER_LINK_PATHS.company.labResults },
        { label: t.footer.company.faq, href: FOOTER_LINK_PATHS.company.faq },
        { label: t.footer.company.contact, href: FOOTER_LINK_PATHS.company.contact },
        { label: t.footer.company.researchGuides, href: "/guides" },
        { label: t.calculator.title, href: "/peptide-calculator" },
        { label: t.penCalculator.title, href: "/pen-calculator" },
        { label: t.footer.company.trackOrder, href: "/track" },
        { label: t.footer.company.wishlist, href: "/wishlist" },
      ],
    },
    {
      heading: t.footer.legal.heading,
      links: [
        { label: t.footer.legal.terms, href: FOOTER_LINK_PATHS.legal.terms },
        { label: t.footer.legal.refunds, href: FOOTER_LINK_PATHS.legal.refunds },
        { label: t.footer.legal.shipping, href: FOOTER_LINK_PATHS.legal.shipping },
        { label: t.footer.legal.privacy, href: FOOTER_LINK_PATHS.legal.privacy },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-8 lg:col-span-3 lg:grid-cols-3">
      {groups.map((group) => (
        <div key={group.heading}>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-800">
            {group.heading}
          </h3>
          <ul className="space-y-3">
            {group.links.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function FooterTagline() {
  const { t } = useLanguage();
  return (
    <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
      {t.footer.tagline}
    </p>
  );
}

export function FooterContactLabel() {
  const { t } = useLanguage();
  return (
    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
      {t.common.contact}
    </p>
  );
}

export function FooterLocationLabel() {
  const { t } = useLanguage();
  return (
    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
      {t.common.location}
    </p>
  );
}

export function FooterBottomLinks() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-wrap justify-center gap-4 md:justify-end">
      {[
        { label: t.footer.legal.privacy, href: "/privacy-policy" },
        { label: t.footer.legal.terms, href: "/terms-of-service" },
        { label: t.footer.legal.refunds, href: "/refund-returns" },
        { label: t.footer.legal.shipping, href: "/shipping-policy" },
      ].map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="transition-colors hover:text-white"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function FooterCopyright({ copyrightDate }: { copyrightDate: string | number }) {
  const { t } = useLanguage();
  return (
    <p>
      &copy; {copyrightDate} BiosyncLabs. {t.common.allRightsReserved}
    </p>
  );
}
