import productFragment from "./product";

const cartFragment = /* GraphQL */ `
  fragment cart on Cart {
    id
    checkoutUrl
    attributes {
      key
      value
    }
    discountCodes {
      code
      applicable
    }
    discountAllocations {
      ... on CartCodeDiscountAllocation {
        discountedAmount {
          amount
          currencyCode
        }
      }
      ... on CartAutomaticDiscountAllocation {
        discountedAmount {
          amount
          currencyCode
        }
      }
      ... on CartCustomDiscountAllocation {
        discountedAmount {
          amount
          currencyCode
        }
      }
    }
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              selectedOptions {
                name
                value
              }
              product {
                ...product
              }
            }
          }
        }
      }
    }
    totalQuantity
  }
  ${productFragment}
`;

export default cartFragment;
