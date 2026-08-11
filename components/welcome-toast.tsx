"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function WelcomeToast() {
  useEffect(() => {
    // ignore if screen height is too small
    if (window.innerHeight < 650) return;
    // Cookie access throws in sandboxed iframes (translator widgets, preview
    // tools). Wrap so the toast — and the rest of the page — keep working.
    let alreadyDismissed = false;
    try {
      alreadyDismissed = document.cookie.includes("welcome-toast=2");
    } catch {
      // can't read cookies — assume not dismissed, but don't try to set them later either
      alreadyDismissed = true;
    }
    if (!alreadyDismissed) {
      toast("🛍️ Welcome to Next.js Commerce!", {
        id: "welcome-toast",
        duration: Infinity,
        onDismiss: () => {
          try {
            document.cookie = "welcome-toast=2; max-age=31536000; path=/";
          } catch {
            // sandboxed cookies — toast won't reappear this session anyway
          }
        },
        description: (
          <>
            This is a high-performance, SSR storefront powered by Shopify,
            Next.js, and Vercel.{" "}
            <a
              href="https://vercel.com/templates/next.js/nextjs-commerce"
              className="text-blue-600 hover:underline"
              target="_blank"
            >
              Deploy your own
            </a>
            .
          </>
        ),
      });
    }
  }, []);

  return null;
}
