"use client";

import { ProductOption, ProductVariant } from "lib/woocommerce/types";
import { ReactNode } from "react";
import { ProductOptionsProvider } from "./product-context";

export function ProductPageWrapper({
  options,
  variants,
  initialSelected,
  children,
}: {
  options: ProductOption[];
  variants: ProductVariant[];
  initialSelected: Record<string, string>;
  children: ReactNode;
}) {
  return (
    <ProductOptionsProvider
      options={options}
      variants={variants}
      initialSelected={initialSelected}
    >
      {children}
    </ProductOptionsProvider>
  );
}
