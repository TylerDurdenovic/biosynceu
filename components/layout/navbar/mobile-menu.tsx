"use client";

import { Dialog, Transition } from "@headlessui/react";
import {
    Bars3Icon,
    BeakerIcon,
    BoltIcon,
    ChevronDownIcon,
    LightBulbIcon,
    MoonIcon,
    ShieldCheckIcon,
    SparklesIcon,
    TrophyIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { LanguageToggleFull } from "components/language-toggle";
import { useLanguage } from "contexts/language-context";
import { useTheme } from "contexts/theme-context";
import { Menu } from "lib/woocommerce/types";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ComponentType, Fragment, SVGProps, Suspense, useEffect, useState } from "react";
import Search, { SearchSkeleton } from "./search";

type BenefitKey = "longevity" | "weightLoss" | "sleep" | "immunity" | "muscleGrowth" | "cognitive" | "healing";
const BENEFIT_CATEGORIES: { key: BenefitKey; handle: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { key: "longevity",          handle: "longevity-and-anti-aging-research",  icon: SparklesIcon },
  { key: "weightLoss",         handle: "weight-loss-research",           icon: BoltIcon },
  { key: "sleep",              handle: "sleep-enhancement-research",     icon: MoonIcon },
  { key: "immunity",           handle: "immunity-enhancement-research",  icon: ShieldCheckIcon },
  { key: "muscleGrowth",       handle: "muscle-growth-research",         icon: TrophyIcon },
  { key: "cognitive",          handle: "cognitive-enhancement-research", icon: LightBulbIcon },
  { key: "healing",            handle: "healing-and-regeneration-research",  icon: BeakerIcon },
];

const PATH_NAV_KEY: Record<string, "home" | "shop" | "about" | "contact" | "faq" | "labResults" | "calculator" | "trackOrder"> = {
  "/": "home",
  "/shop": "shop",
  "/about": "about",
  "/contact": "contact",
  "/faq": "faq",
  "/lab-results": "labResults",
  "/peptide-calculator": "calculator",
  "/track": "trackOrder",
};

export default function MobileMenu({ menu }: { menu: Menu[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      <Transition show={isOpen}>
        <Dialog onClose={() => setIsOpen(false)} className="relative z-50">
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-in-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in-out duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          </Transition.Child>

          {/* Drawer */}
          <Transition.Child
            as={Fragment}
            enter="transition-transform ease-in-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="fixed bottom-0 left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
                <span className="text-sm font-bold tracking-tight text-slate-900">BioSyncLabs</span>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-3 py-4">
                {/* Search */}
                <div className="mb-4">
                  <Suspense fallback={<SearchSkeleton />}>
                    <Search />
                  </Suspense>
                </div>

                {/* Primary nav links */}
                {menu.length > 0 && (
                  <ul className="space-y-0.5">
                    {menu.map((item) => {
                      const isActive =
                        item.path === "/"
                          ? pathname === "/"
                          : pathname === item.path || pathname.startsWith(item.path + "/");
                      const navKey = PATH_NAV_KEY[item.path];
                      const label = navKey ? (t.nav[navKey] as string) : item.title;

                      // Shop gets an expandable accordion
                      if (item.path === "/shop") {
                        const tr = t.nav.shopCategories;
                        return (
                          <li key={item.path}>
                            <button
                              type="button"
                              onClick={() => setShopOpen((v) => !v)}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                isActive
                                  ? "bg-slate-900 text-white"
                                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                            >
                              {label}
                              <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${shopOpen ? "rotate-180" : ""}`} />
                            </button>

                            {shopOpen && (
                              <div className="mt-0.5 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                                {/* Department: Peptides (Shop All) */}
                                <Link
                                  href="/shop"
                                  onClick={() => setIsOpen(false)}
                                  className="flex items-center gap-3 border-b border-slate-100 px-3 py-2.5"
                                >
                                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#1D4ED8] text-white">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                  </span>
                                  <span className="text-sm font-semibold text-slate-800">{t.shop.deptPeptides}</span>
                                </Link>

                                {/* Pens — first-class so they're never missed */}
                                <Link
                                  href="/shop?collection=pens"
                                  onClick={() => setIsOpen(false)}
                                  className="flex items-center gap-3 border-b border-slate-100 px-3 py-2.5 transition-colors hover:bg-slate-100"
                                >
                                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 text-white">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                    </svg>
                                  </span>
                                  <span className="text-sm font-semibold text-slate-800">{tr.pens}</span>
                                </Link>

                                {/* Benefit categories */}
                                {BENEFIT_CATEGORIES.map((cat) => {
                                  const Icon = cat.icon;
                                  return (
                                    <Link
                                      key={cat.handle}
                                      href={`/shop?collection=${cat.handle}`}
                                      onClick={() => setIsOpen(false)}
                                      className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-slate-100"
                                    >
                                      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                                      <span className="text-sm text-slate-600">{tr[cat.key]}</span>
                                    </Link>
                                  );
                                })}

                                {/* Anabolics & PCT — its own department, kept
                                    separate from the research peptides. */}
                                <Link
                                  href="/shop?collection=steroids"
                                  onClick={() => setIsOpen(false)}
                                  className="flex items-center gap-3 border-t border-slate-100 px-3 py-2.5 transition-colors hover:bg-slate-100"
                                >
                                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                                    </svg>
                                  </span>
                                  <span className="text-sm font-semibold text-slate-800">{tr.groups.anabolics}</span>
                                </Link>
                              </div>
                            )}
                          </li>
                        );
                      }

                      return (
                        <li key={item.path}>
                          <Link
                            href={item.path}
                            prefetch={true}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                              isActive
                                ? "bg-slate-900 text-white"
                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            {label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Utilities */}
                <div className="mt-5 border-t border-slate-100 pt-4 space-y-2">
                  {/* Language toggle */}
                  <LanguageToggleFull />

                  {/* Theme toggle */}
                  <button
                    onClick={toggleTheme}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      {theme === "dark" ? (
                        <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-13H20m-16 0H3m15.07 10.07-.707-.707M6.343 6.343l-.707-.707m12.728 0-.707.707M6.343 17.657l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                        </svg>
                      )}
                      {theme === "dark" ? t.common.lightMode : t.common.darkMode}
                    </span>
                    <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${theme === "dark" ? "bg-blue-600" : "bg-slate-200"}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${theme === "dark" ? "translate-x-4" : "translate-x-1"}`} />
                    </span>
                  </button>
                </div>
              </div>

              {/* Footer — minimal RUO notice */}
              <div className="border-t border-slate-100 px-4 py-3">
                <p className="text-[10px] leading-snug text-slate-400">
                  RUO — {t.common.ruo.subtext}
                </p>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}
