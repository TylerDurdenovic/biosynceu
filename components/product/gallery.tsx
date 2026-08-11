"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { GridTileImage } from "components/grid/tile";
import { useProductOptions } from "components/product/product-context";
import { ProductOption, ProductVariant } from "lib/woocommerce/types";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function Gallery({
  images,
  variants,
  options,
}: {
  images: { src: string; altText: string }[];
  variants?: ProductVariant[];
  options?: ProductOption[];
}) {
  const searchParams = useSearchParams();
  // Shared context — lets gallery selection instantly update variant picker & price
  const { setOption, clearOptions, selectedVariant } = useProductOptions();

  // Determine initial index from URL or selected variant.
  // Explicit ?image=N always wins so the URL is the source of truth.
  function resolveInitialIndex() {
    if (searchParams.has("image")) {
      const urlIdx = parseInt(searchParams.get("image")!);
      if (!isNaN(urlIdx))
        return Math.max(0, Math.min(urlIdx, images.length - 1));
    }
    const sv = variants?.find((v) =>
      v.selectedOptions.every(
        (opt) => searchParams.get(opt.name.toLowerCase()) === opt.value
      )
    );
    const variantIdx = sv?.image
      ? images.findIndex((img) => img.src === sv.image!.url)
      : -1;
    return variantIdx >= 0 ? variantIdx : 0;
  }

  const [currentIndex, setCurrentIndex] = useState(resolveInitialIndex);

  // Sync gallery when URL changes.
  // Rule: explicit ?image=N (set by thumbnail/arrow clicks) always wins.
  //       Only fall back to the variant's first image when there is no ?image
  //       param — that is the case after a variant chip click (handleSelect
  //       deletes ?image before calling router.replace).
  useEffect(() => {
    if (searchParams.has("image")) {
      const idx = parseInt(searchParams.get("image")!);
      if (!isNaN(idx)) {
        setCurrentIndex(Math.max(0, Math.min(idx, images.length - 1)));
        return;
      }
    }
    // No ?image → chip was clicked; jump to that variant's first image
    const sv = variants?.find((v) =>
      v.selectedOptions.every(
        (opt) => searchParams.get(opt.name.toLowerCase()) === opt.value
      )
    );
    if (sv?.image) {
      const idx = images.findIndex((img) => img.src === sv.image!.url);
      if (idx >= 0) setCurrentIndex(idx);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = useCallback(
    (index: number) => {
      const safe = Math.max(0, Math.min(index, images.length - 1));

      // 1. Update local state immediately — instant visual response
      setCurrentIndex(safe);

      // 2. Build new URL params
      const params = new URLSearchParams(searchParams.toString());
      params.set("image", safe.toString());

      // 3. Find which variant owns this image (primary or any Rubik extra image).
      const clickedSrc = images[safe]?.src;
      const matchingVariant = variants?.find(
        (v) =>
          v.image?.url === clickedSrc ||
          v.novaImages?.some((img) => img.url === clickedSrc)
      );

      if (matchingVariant && options) {
        // Select the matching variant chip and add its options to the URL.
        matchingVariant.selectedOptions.forEach((opt) => {
          setOption(opt.name.toLowerCase(), opt.value);
          params.set(opt.name.toLowerCase(), opt.value);
        });
      } else if (options?.length) {
        // No variant owns this image — clear any active variant selection
        // so dose/size chips go back to unselected state.
        clearOptions();
        options.forEach((opt) => params.delete(opt.name.toLowerCase()));
      }

      // 4. Sync URL with a shallow history update — NOT router.replace.
      //    router.replace would re-run the product page's Server Component
      //    (a fresh Shopify fetch) on every thumbnail/arrow tap. history
      //    .replaceState updates the URL + Next's useSearchParams without any
      //    navigation or network request; the gallery already drives its own
      //    state via setCurrentIndex above.
      try {
        const qs = params.toString();
        window.history.replaceState(
          null,
          "",
          qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
        );
      } catch {
        // Non-fatal — setCurrentIndex already updated the visible image.
      }
    },
    [images, variants, options, searchParams, setOption, clearOptions]
  );

  const goPrev = () =>
    goTo(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  const goNext = () =>
    goTo(currentIndex + 1 >= images.length ? 0 : currentIndex + 1);

  if (!images.length) return null;

  const activeImage = images[currentIndex];

  /* ── Touch swipe support ── */
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Guard against empty TouchList — Android Chrome can fire touchstart with
    // 0 touches when the system intercepts the gesture (e.g. while the user is
    // also tapping a variant button). Reading touches[0]!.clientX would throw
    // an uncaught TypeError that surfaces as a Next.js error overlay.
    const t = e.touches[0];
    if (!t) return;
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const t = e.changedTouches[0];
      if (!t) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }
      const dx = t.clientX - touchStartX.current;
      const dy = t.clientY - touchStartY.current;
      // Only trigger on horizontal swipe that's at least 40px and more horizontal than vertical
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) goNext();
        else goPrev();
      }
      touchStartX.current = null;
      touchStartY.current = null;
    },
    [goNext, goPrev]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* ── Main image ────────────────────────────────────────────── */}
      <div
        className="group relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: images.length > 1 ? "pan-y" : undefined }}
      >
        {activeImage && (
          <Image
            key={activeImage.src}
            className="object-contain p-4 transition-opacity duration-200"
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            alt={activeImage.altText ?? "Product image"}
            src={activeImage.src}
            priority
          />
        )}

        {images.length > 1 && (
          <>
            {/* Left arrow — visible on desktop hover, hidden on touch screens */}
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:text-slate-900 opacity-0 group-hover:opacity-100 md:flex"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>

            {/* Right arrow */}
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:text-slate-900 opacity-0 group-hover:opacity-100 md:flex"
            >
              <ArrowRightIcon className="h-4 w-4" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentIndex
                      ? "w-5 bg-slate-700"
                      : "w-1.5 bg-slate-300 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Thumbnail strip ───────────────────────────────────────── */}
      {images.length > 1 && (
        <div className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap">
          {images.map((image, index) => {
            // Find which variant this thumbnail belongs to (primary or Nova image)
            const thumbVariant = variants?.find(
              (v) =>
                v.image?.url === image.src ||
                v.novaImages?.some((img) => img.url === image.src)
            );
            const variantLabel = thumbVariant?.selectedOptions
              .map((o) => o.value)
              .join(" / ");

            return (
              <button
                key={image.src}
                type="button"
                onClick={() => goTo(index)}
                aria-label={
                  variantLabel
                    ? `View ${variantLabel} image`
                    : `View image ${index + 1}`
                }
                title={variantLabel}
                className={`h-16 w-16 shrink-0 snap-start overflow-hidden rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ${
                  index === currentIndex
                    ? "border-slate-900 shadow-sm"
                    : "border-transparent opacity-60 hover:opacity-100 hover:border-slate-300"
                }`}
              >
                <GridTileImage
                  alt={image.altText}
                  src={image.src}
                  width={64}
                  height={64}
                  active={index === currentIndex}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
