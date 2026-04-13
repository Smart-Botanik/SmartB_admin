import type { Product } from "@/types/product";
import { graphqlClient } from "@/services/graphql";

export interface ProductsListParams {
  limit?: number;
  offset?: number;
  query?: string;
  category?: string;
  brandId?: string;
}

interface ProductsQueryResponse {
  products: {
    total: number;
    items: Product[];
  };
}

const PRODUCTS_QUERY = `
  query Products($limit: Int, $offset: Int, $query: String, $category: String, $brandId: ID) {
    products(limit: $limit, offset: $offset, query: $query, category: $category, brandId: $brandId) {
      total
      items {
        id
        name
        category
        brand {
          id
          name
          category
          avatar { id url }
        }
        avatar { id url }
        createdAt
        updatedAt
      }
    }
  }
`;

const PRODUCT_QUERY = `
  query Product($id: ID!) {
    product(id: $id) {
      id
      name
      category
      brand {
        id
        name
        category
        avatar { id url }
      }
      avatar { id url }
      createdAt
      updatedAt
    }
  }
`;

const CREATE_PRODUCT_MUTATION = `
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      category
      brand {
        id
        name
        category
        avatar { id url }
      }
      avatar { id url }
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_PRODUCT_MUTATION = `
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      category
      brand {
        id
        name
        category
        avatar { id url }
      }
      avatar { id url }
      createdAt
      updatedAt
    }
  }
`;

export interface CreateProductInput {
  name: string;
  category: string;
  brandId: string;
  avatarMediaId?: string | null;
}

export interface UpdateProductInput {
  name?: string | null;
  category?: string | null;
  brandId?: string | null;
  avatarMediaId?: string | null;
}

interface CreateProductResponse {
  createProduct: Product;
}

interface ProductQueryResponse {
  product: Product | null;
}

interface UpdateProductResponse {
  updateProduct: Product;
}

class ProductsService {
  async list(params: ProductsListParams = {}) {
    const data = await graphqlClient.request<
      ProductsQueryResponse,
      ProductsListParams
    >({
      query: PRODUCTS_QUERY,
      variables: {
        limit: params.limit,
        offset: params.offset,
        query: params.query,
        category: params.category,
        brandId: params.brandId,
      },
      operationName: "Products",
    });

    return data.products;
  }

  async getById(id: string) {
    const data = await graphqlClient.request<ProductQueryResponse, { id: string }>(
      {
        query: PRODUCT_QUERY,
        variables: { id },
        operationName: "Product",
      },
    );
    return data.product;
  }

  async create(input: CreateProductInput) {
    const data = await graphqlClient.request<
      CreateProductResponse,
      { input: CreateProductInput }
    >({
      query: CREATE_PRODUCT_MUTATION,
      variables: { input },
      operationName: "CreateProduct",
    });
    return data.createProduct;
  }

  async update(id: string, input: UpdateProductInput) {
    const data = await graphqlClient.request<
      UpdateProductResponse,
      { id: string; input: UpdateProductInput }
    >({
      query: UPDATE_PRODUCT_MUTATION,
      variables: { id, input },
      operationName: "UpdateProduct",
    });
    return data.updateProduct;
  }
}

export const productsService = new ProductsService();
