"use server";

import { TAGS } from "lib/constants";
import {
  addToCart,
  applyDiscountCode,
  createCart,
  getCart,
  getCheckoutUrl,
  removeFromCart,
  updateCart,
  updateCartAttributes,
} from "lib/woocommerce";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function addItem(
  prevState: any,
  payload: { variantId: string | undefined; quantity?: number } | undefined
) {
  const variantId = payload?.variantId;
  const quantity = Math.min(Math.max(1, payload?.quantity ?? 1), 50);

  if (!variantId) {
    return "Error adding item to cart";
  }

  try {
    await addToCart([{ merchandiseId: variantId, quantity }]);
    updateTag(TAGS.cart);
  } catch (e) {
    return "Error adding item to cart";
  }
}

export async function removeItem(prevState: any, merchandiseId: string) {
  try {
    const cart = await getCart();

    if (!cart) {
      return "Error fetching cart";
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId
    );

    if (lineItem && lineItem.id) {
      await removeFromCart([lineItem.id]);
      updateTag(TAGS.cart);
    } else {
      return "Item not found in cart";
    }
  } catch (e) {
    return "Error removing item from cart";
  }
}

export async function updateItemQuantity(
  prevState: any,
  payload: {
    merchandiseId: string;
    quantity: number;
  }
) {
  const { merchandiseId, quantity } = payload;

  try {
    const cart = await getCart();

    if (!cart) {
      return "Error fetching cart";
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId
    );

    if (lineItem && lineItem.id) {
      if (quantity === 0) {
        await removeFromCart([lineItem.id]);
      } else {
        await updateCart([
          {
            id: lineItem.id,
            merchandiseId,
            quantity,
          },
        ]);
      }
    } else if (quantity > 0) {
      // If the item doesn't exist in the cart and quantity > 0, add it
      await addToCart([{ merchandiseId, quantity }]);
    }

    updateTag(TAGS.cart);
  } catch (e) {
    console.error(e);
    return "Error updating item quantity";
  }
}

export async function redirectToCheckout() {
  // Build a signed WooCommerce checkout URL with cart items pre-filled,
  // then redirect the user's browser directly to the WordPress checkout page.
  const checkoutUrl = await getCheckoutUrl();
  // Clear the wc_cart cookie so a fresh cart is ready when the user returns
  (await cookies()).delete("wc_cart");
  redirect(checkoutUrl);
}

export async function createCartAndSetCookie() {
  // WooCommerce cart is stored in the wc_cart cookie automatically — no
  // separate cartId cookie needed. We just ensure the cart exists.
  await createCart();
}

export async function setCartAttributes(
  prevState: any,
  attributes: { key: string; value: string }[],
): Promise<{ success: boolean; message?: string }> {
  if (!attributes?.length) return { success: true };

  try {
    const { userErrors } = await updateCartAttributes(attributes);
    if (userErrors?.length) {
      return { success: false, message: userErrors[0]?.message ?? "Error saving preference." };
    }
    updateTag(TAGS.cart);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Error saving preference." };
  }
}

export async function applyDiscount(
  prevState: any,
  code: string
): Promise<{ success: boolean; message: string }> {
  if (!code || !code.trim()) {
    return { success: false, message: "Please enter a discount code." };
  }

  try {
    const { cart, userErrors } = await applyDiscountCode([code.trim().toUpperCase()]);

    if (userErrors?.length) {
      return { success: false, message: userErrors[0]?.message ?? "Invalid code." };
    }

    const applied = cart.discountCodes?.find(
      (d) => d.code.toUpperCase() === code.trim().toUpperCase() && d.applicable
    );

    if (!applied) {
      return { success: false, message: "This code is not applicable to your cart." };
    }

    updateTag(TAGS.cart);
    return { success: true, message: `Discount code "${code.toUpperCase()}" applied!` };
  } catch {
    return { success: false, message: "Error applying discount code. Please try again." };
  }
}

export async function removeDiscount(
  prevState: any,
  _formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    await applyDiscountCode([]);
    updateTag(TAGS.cart);
    return { success: true, message: "Discount removed." };
  } catch {
    return { success: false, message: "Error removing discount." };
  }
}

/**
 * Silent server action used by AffiliateTracker.
 *
 * Applies a referral / creator code (e.g. "hasan" from /?ref=hasan) to
 * the customer's Shopify cart so:
 *   - The cart drawer immediately shows the discount line
 *   - Both checkout paths (Shopify bank-transfer and PayGate card) see
 *     the discount as already applied to the cart
 *   - Shopify Collabs attributes the sale to the creator on completion
 *
 * Behaviour:
 *   - Creates a cart if the customer doesn't have one yet
 *   - No-ops if our code is already on the cart (idempotent)
 *   - No-ops if a DIFFERENT discount is already applied — we don't
 *     overwrite a code the customer manually entered
 *   - Failures are swallowed (logged server-side) — never bubble an
 *     error up to a page render for affiliate tracking
 */
export async function applyReferralDiscount(code: string): Promise<void> {
  const trimmed = code?.trim();
  if (!trimmed) return;
  const upper = trimmed.toUpperCase();

  try {
    let cart = await getCart();
    if (!cart) {
      await createCartAndSetCookie();
      cart = await getCart();
      if (!cart) return;
    }

    const existing = cart.discountCodes ?? [];
    if (existing.some((d) => d.code.toUpperCase() === upper && d.applicable)) {
      // Already applied — nothing to do.
      return;
    }
    if (existing.some((d) => d.applicable)) {
      // Customer (or a previous flow) already applied a different code —
      // don't clobber it.
      return;
    }

    const { userErrors } = await applyDiscountCode([upper]);
    if (userErrors?.length) {
      console.warn("[applyReferralDiscount] userErrors:", userErrors);
      return;
    }

    updateTag(TAGS.cart);
  } catch (e) {
    console.warn("[applyReferralDiscount] failed:", e);
  }
}
