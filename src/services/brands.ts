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
        description
        avatar { id url }
        createdAt
        updatedAt
      }
    }
  }
`;

const BRAND_QUERY = `
  query Brand($id: ID!) {
    brand(id: $id) {
      id
      name
      category
      description
      avatar { id url }
      createdAt
      updatedAt
    }
  }
`;

const CREATE_BRAND_MUTATION = `
  mutation CreateBrand($input: CreateBrandInput!) {
    createBrand(input: $input) {
      id
      name
      category
      description
      avatar { id url }
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_BRAND_MUTATION = `
  mutation UpdateBrand($id: ID!, $input: UpdateBrandInput!) {
    updateBrand(id: $id, input: $input) {
      id
      name
      category
      description
      avatar { id url }
      createdAt
      updatedAt
    }
  }
`;

export interface CreateBrandInput {
  name: string;
  category: string;
  description?: string | null;
  avatarMediaId?: string | null;
}

export interface UpdateBrandInput {
  name?: string | null;
  category?: string | null;
  description?: string | null;
  /** Передайте null, чтобы сбросить аватар; опустите поле, чтобы не менять. */
  avatarMediaId?: string | null;
}

interface CreateBrandResponse {
  createBrand: Brand;
}

interface BrandQueryResponse {
  brand: Brand | null;
}

interface UpdateBrandResponse {
  updateBrand: Brand;
}

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

  async getById(id: string) {
    const data = await graphqlClient.request<BrandQueryResponse, { id: string }>({
      query: BRAND_QUERY,
      variables: { id },
      operationName: "Brand",
    });
    return data.brand;
  }

  async create(input: CreateBrandInput) {
    const data = await graphqlClient.request<
      CreateBrandResponse,
      { input: CreateBrandInput }
    >({
      query: CREATE_BRAND_MUTATION,
      variables: { input },
      operationName: "CreateBrand",
    });
    return data.createBrand;
  }

  async update(id: string, input: UpdateBrandInput) {
    const data = await graphqlClient.request<
      UpdateBrandResponse,
      { id: string; input: UpdateBrandInput }
    >({
      query: UPDATE_BRAND_MUTATION,
      variables: { id, input },
      operationName: "UpdateBrand",
    });
    return data.updateBrand;
  }
}

export const brandsService = new BrandsService();
