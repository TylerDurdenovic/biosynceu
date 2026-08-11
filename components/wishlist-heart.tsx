"use client";

import { useWishlist, WishlistItem } from "contexts/wishlist-context";

type Props = {
  item: WishlistItem;
  className?: string;
};

export function WishlistHeart({ item, className = "" }: Props) {
  const { toggle, isWishlisted } = useWishlist();
  const active = isWishlisted(item.handle);

  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(item);
      }}
      className={`flex items-center justify-center rounded-full bg-white/90 shadow-sm transition-all hover:scale-110 active:scale-95 ${className}`}
    >
      <svg
        className={`h-4 w-4 transition-colors ${active ? "fill-red-500 stroke-red-500" : "fill-transparent stroke-slate-400 hover:stroke-red-400"}`}
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}
