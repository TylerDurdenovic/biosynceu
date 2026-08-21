"use client";

import { ProductOption, ProductVariant } from "lib/woocommerce/types";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface ProductOptionsContextValue {
  selected: Record<string, string>;
  setOption: (name: string, value: string) => void;
  clearOptions: () => void;
  selectedVariant: ProductVariant | undefined;
  quantity: number;
  setQuantity: (q: number) => void;
}

const ProductOptionsContext = createContext<ProductOptionsContextValue | null>(
  null
);

export function ProductOptionsProvider({
  options,
  variants,
  initialSelected,
  children,
}: {
  options: ProductOption[];
  variants: ProductVariant[];
  /** Pre-selected values from URL search params (server-resolved) */
  initialSelected: Record<string, string>;
  children: ReactNode;
}) {
  const [selected, setSelected] =
    useState<Record<string, string>>(initialSelected);
  const [quantity, setQuantity] = useState(1);

  // Apply a variant pre-selection from the URL (e.g. ?dose=10mg) on the CLIENT.
  // Doing this here — instead of reading searchParams on the server — lets the
  // product page render fully static and cache at the edge, so it loads
  // instantly instead of hitting the slow backend on every visit.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const preset: Record<string, string> = {};
      options.forEach((opt) => {
        const val = params.get(opt.name.toLowerCase());
        if (val) preset[opt.name.toLowerCase()] = val;
      });
      if (Object.keys(preset).length) {
        setSelected((prev) => ({ ...prev, ...preset }));
      }
    } catch {
      /* no-op */
    }
  }, [options]);

  const setOption = (name: string, value: string) => {
    setSelected((prev) => ({ ...prev, [name.toLowerCase()]: value }));
  };

  const clearOptions = () => setSelected({});

  const selectedVariant = useMemo(
    () =>
      variants.find((v) =>
        v.selectedOptions.every(
          (opt) => selected[opt.name.toLowerCase()] === opt.value
        )
      ),
    [variants, selected]
  );

  return (
    <ProductOptionsContext.Provider
      value={{ selected, setOption, clearOptions, selectedVariant, quantity, setQuantity }}
    >
      {children}
    </ProductOptionsContext.Provider>
  );
}

export function useProductOptions() {
  const ctx = useContext(ProductOptionsContext);
  if (!ctx)
    throw new Error(
      "useProductOptions must be used inside ProductOptionsProvider"
    );
  return ctx;
}
