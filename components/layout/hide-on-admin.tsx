"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Hides storefront chrome (sale banner, navbar, support button) on /admin so
 * the admin area renders as a standalone app. Server components can be passed
 * as children — they still render server-side but aren't shown on /admin.
 */
export function HideOnAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
