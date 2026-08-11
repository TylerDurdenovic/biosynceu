"use client";

import { applyReferralDiscount } from "components/cart/actions";
import { REF_CODE_PARAM, writeRefCodeCookie } from "lib/affiliate";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Renders nothing. On mount, reads ?ref=CODE from the URL, writes a 30-day
 * cookie, and auto-applies the code as a WooCommerce coupon on the cart.
 */
export default function AffiliateTracker() {
  const router = useRouter();

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const ref = url.searchParams.get(REF_CODE_PARAM);
      if (!ref || ref.length > 200) return;

      writeRefCodeCookie(ref);

      const sessionKey = `ref_applied:${ref}`;
      let alreadyTried = false;
      try {
        alreadyTried = sessionStorage.getItem(sessionKey) === "1";
      } catch { /* sandboxed */ }

      if (!alreadyTried) {
        applyReferralDiscount(ref)
          .then(() => {
            try { sessionStorage.setItem(sessionKey, "1"); } catch { /* ignore */ }
            router.refresh();
          })
          .catch(() => { /* server logged it */ });
      }
    } catch { /* sandboxed iframe */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
