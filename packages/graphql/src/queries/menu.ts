export const menuQuery = `query GetMenuItems($first: Int = 100) {
  products(first: $first) {
    nodes {
      databaseId
      slug
      name
      description
      shortDescription
      price
      regularPrice
      image {
        sourceUrl
        altText
      }
      productCategories {
        nodes {
          slug
          name
        }
      }
      variations {
        nodes {
          databaseId
          name
          price
        }
      }
      metaData {
        promotion_ids
      }
    }
  }
}
`;
