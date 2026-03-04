export const promotionsQuery = `query GetPromotions($first: Int = 100) {
  promotions(first: $first) {
    nodes {
      databaseId
      slug
      title
      excerpt
      content
      promotionMeta {
        badge
        validUntil
        discountType
        discountValue
        couponCode
        categoryIds
        productIds
      }
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
    }
  }
}
`;
