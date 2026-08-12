"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Top-of-page loading bar (YouTube / NProgress style) for App Router route
 * changes. Zero dependencies.
 *
 * How it works:
 *  - A capture-phase click listener starts the bar the instant a user clicks an
 *    internal link — so there's immediate feedback even before the next route's
 *    data resolves.
 *  - When usePathname()/useSearchParams() change (navigation actually
 *    completed) the bar animates to 100% and fades out.
 *  - A safety timeout guarantees the bar never hangs on screen if a navigation
 *    is cancelled or a click doesn't lead anywhere.
 *
 * Must be rendered inside a <Suspense> boundary because it uses
 * useSearchParams() (Next.js requirement for static/PPR builds).
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  const loading = useRef(false);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearFinish = useCallback(() => {
    finishTimers.current.forEach(clearTimeout);
    finishTimers.current = [];
  }, []);

  const stopTrickle = useCallback(() => {
    if (trickle.current) {
      clearInterval(trickle.current);
      trickle.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (loading.current) return;
    loading.current = true;
    clearFinish();
    setVisible(true);
    setWidth(10);
    stopTrickle();
    // Ease toward 90% and wait there until the route actually resolves.
    trickle.current = setInterval(() => {
      setWidth((w) => (w < 90 ? w + Math.max(0.4, (90 - w) * 0.08) : w));
    }, 180);
  }, [clearFinish, stopTrickle]);

  const done = useCallback(() => {
    if (!loading.current) return;
    loading.current = false;
    stopTrickle();
    clearFinish();
    setWidth(100);
    finishTimers.current.push(setTimeout(() => setVisible(false), 250));
    finishTimers.current.push(setTimeout(() => setWidth(0), 450));
  }, [clearFinish, stopTrickle]);

  // ── Start the bar on internal link clicks ──
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Ignore non-primary / modified clicks (open-in-new-tab etc.)
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;

      const anchor = (e.target as HTMLElement | null)?.closest?.("a") as
        | HTMLAnchorElement
        | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const target = anchor.getAttribute("target");
      if (!href || href.startsWith("#")) return;
      if (target && target !== "_self") return; // new tab / frame
      if (anchor.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return; // external
      // Same page → no navigation happens, don't flash the bar.
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      )
        return;

      start();
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [start]);

  // ── Complete when the route (path or query) actually changes ──
  useEffect(() => {
    done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // ── Safety net: never let the bar hang on screen ──
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => done(), 10000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, pathname, searchParams]);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      stopTrickle();
      clearFinish();
    };
  }, [stopTrickle, clearFinish]);

  if (!visible && width === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]"
    >
      <div
        className="h-full rounded-r-full bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-400 transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${width}%`,
          opacity: visible ? 1 : 0,
          boxShadow:
            "0 0 10px rgba(59,130,246,0.7), 0 0 4px rgba(56,189,248,0.6)",
        }}
      />
    </div>
  );
}
