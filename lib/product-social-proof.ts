// Deterministic pseudo-random values from a product handle string.
// Same handle always produces the same numbers — consistent across SSR and client.
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export interface ProductSocialProof {
  /** e.g. 4.8 */
  rating: number;
  /** e.g. 34 individual reviews */
  reviewCount: number;
  /** e.g. 712 — "bought by 712+ researchers" */
  purchasedCount: number;
}

export function getProductSocialProof(handle: string): ProductSocialProof {
  const h = hashStr(handle);
  const h2 = hashStr(handle + "x");

  // Rating: 4.7 | 4.8 | 4.9 | 5.0
  const ratingOptions = [47, 48, 49, 50];
  const rating = ratingOptions[h % ratingOptions.length]! / 10;

  // Review count: 18–96
  const reviewCount = 18 + (h2 % 79);

  // Purchased count: 500–999
  const purchasedCount = 500 + (h % 500);

  return { rating, reviewCount, purchasedCount };
}
