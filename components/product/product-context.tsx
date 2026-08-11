"use client";

import { ProductOption, ProductVariant } from "lib/woocommerce/types";
import {
  createContext,
  useContext,
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
