import imageFragment from "./image";
import seoFragment from "./seo";

const productFragment = /* GraphQL */ `
  fragment product on Product {
    id
    handle
    availableForSale
    title
    description
    descriptionHtml
    options {
      id
      name
      values
    }
    priceRange {
      maxVariantPrice {
        amount
        currencyCode
      }
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 250) {
      edges {
        node {
          id
          title
          availableForSale
          # currentlyNotInStock is true when the variant has zero inventory
          # but the merchant has Continue-selling-when-out-of-stock enabled.
          # We use this to flag pre-orders / backorders in the UI.
          # NOTE: do NOT add quantityAvailable here — it requires the
          # unauthenticated_read_product_inventory access scope on the
          # Storefront token and most stores don't grant it, which makes
          # the entire product query fail.
          currentlyNotInStock
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          image {
            ...image
          }
          # Rubik Variant Images — resolves list.file_reference metafield
          # into actual image URLs without a second round-trip.
          metafields(identifiers: [
            { namespace: "rubik", key: "variant_images" }
          ]) {
            namespace
            key
            references(first: 20) {
              nodes {
                ... on MediaImage {
                  image {
                    ...image
                  }
                }
              }
            }
          }
        }
      }
    }
    featuredImage {
      ...image
    }
    images(first: 50) {
      edges {
        node {
          ...image
        }
      }
    }
    seo {
      ...seo
    }
    tags
    updatedAt
  }
  ${imageFragment}
  ${seoFragment}
`;

export default productFragment;
