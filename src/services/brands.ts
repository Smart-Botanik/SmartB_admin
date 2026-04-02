import type { Brand } from "@/types/brand";
import { graphqlClient } from "@/services/graphql";

export interface BrandsListParams {
  limit?: number;
  offset?: number;
  query?: string;
  category?: string;
}

interface BrandsQueryResponse {
  brands: {
    total: number;
    items: Brand[];
  };
}

const BRANDS_QUERY = `
  query Brands($limit: Int, $offset: Int, $query: String, $category: String) {
    brands(limit: $limit, offset: $offset, query: $query, category: $category) {
      total
      items {
        id
        name
        category
        avatar { id url }
        createdAt
        updatedAt
      }
    }
  }
`;

class BrandsService {
  async list(params: BrandsListParams = {}) {
    const data = await graphqlClient.request<BrandsQueryResponse, BrandsListParams>({
      query: BRANDS_QUERY,
      variables: {
        limit: params.limit,
        offset: params.offset,
        query: params.query,
        category: params.category,
      },
      operationName: "Brands",
    });

    return data.brands;
  }
}

export const brandsService = new BrandsService();
