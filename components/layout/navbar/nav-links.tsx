"use client";

import { useLanguage } from "contexts/language-context";
import { Menu } from "lib/woocommerce/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ShopDropdown from "./shop-dropdown";

type NavKey = keyof ReturnType<typeof useLanguage>["t"]["nav"];

const PATH_NAV_KEY: Record<string, NavKey> = {
  "/": "home",
  "/shop": "shop",
  "/about": "about",
  "/contact": "contact",
  "/faq": "faq",
  "/lab-results": "labResults",
  "/peptide-calculator": "calculator",
  "/track": "trackOrder",
};

export function NavLinks({
  links,
  shopProducts,
}: {
  links: Menu[];
  shopProducts?: import("lib/shop-groups").ShopMenuProduct[];
}) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <div className="flex items-center">
      {links.map((item) => {
        const isActive =
          item.path === "/"
            ? pathname === "/"
            : pathname === item.path || pathname.startsWith(item.path + "/");

        // Shop gets its own dropdown
        if (item.path === "/shop") {
          return (
            <ShopDropdown
              key={item.path}
              isActive={isActive}
              products={shopProducts}
            />
          );
        }

        const key = PATH_NAV_KEY[item.path];
        const label = key ? (t.nav[key] as string) : item.title;

        return (
          <Link
            key={item.path}
            href={item.path}
            prefetch={true}
            // Tight padding at xl (1280px = 13" laptop) so all 8 items fit
            // alongside the right cluster; comfortable padding at 2xl+.
            className={`group relative whitespace-nowrap px-1.5 py-2 text-[12px] font-medium transition-colors duration-150 2xl:px-2.5 2xl:text-[13px] ${
              isActive
                ? "text-[#06B6D4] dark:text-cyan-400"
                : "text-slate-600 hover:text-[#06B6D4] dark:text-slate-300 dark:hover:text-cyan-400"
            }`}
          >
            {label}

            <span
              className={`absolute bottom-0 left-1.5 right-1.5 h-0.5 origin-left rounded-full bg-[#06B6D4] transition-transform duration-200 dark:bg-cyan-400 2xl:left-2.5 2xl:right-2.5 ${
                isActive
                  ? "scale-x-100"
                  : "scale-x-0 group-hover:scale-x-100"
              }`}
            />
          </Link>
        );
      })}
    </div>
  );
}
