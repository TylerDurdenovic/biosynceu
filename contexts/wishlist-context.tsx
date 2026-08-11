"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type WishlistItem = {
  handle: string;
  title: string;
  imageUrl?: string;
  imageAlt?: string;
  price: string;
  currencyCode: string;
};

type WishlistCtx = {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  isWishlisted: (handle: string) => boolean;
};

const WishlistContext = createContext<WishlistCtx>({
  items: [],
  toggle: () => {},
  isWishlisted: () => false,
});

const STORAGE_KEY = "biosynclabs-wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
  }, []);

  const persist = useCallback((next: WishlistItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggle = useCallback(
    (item: WishlistItem) => {
      setItems((prev) => {
        const exists = prev.some((i) => i.handle === item.handle);
        const next = exists
          ? prev.filter((i) => i.handle !== item.handle)
          : [...prev, item];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const isWishlisted = useCallback(
    (handle: string) => items.some((i) => i.handle === handle),
    [items]
  );

  return (
    <WishlistContext.Provider value={{ items, toggle, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
