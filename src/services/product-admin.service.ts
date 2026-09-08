import { apiClient } from "@/lib/api-client";
import type { ID, ProductQuery } from "@/types/commerce";
import type {
  ProductVariantInput,
  ProductVariantUpdateInput,
  ProductCreateInput,
  ProductUpdateInput,
  StorefrontProductDto,
  StorefrontProductEnvelope,
  StorefrontProductsEnvelope,
  StorefrontVariantDto,
  StorefrontVariantEnvelope,
  StorefrontVariantsEnvelope,
} from "@/types/storefront-api";

const PRODUCTS_PATH = "/products";

export type MyProductsQuery = ProductQuery & { status?: string };

const authorization = (accessToken: string): HeadersInit => {
  if (!accessToken.trim()) throw new Error("Product management API uchun access token kerak");
  return { Authorization: `Bearer ${accessToken}` };
};

const unwrapVariant = (response: StorefrontVariantEnvelope): StorefrontVariantDto => {
  const data = (response as { data?: unknown }).data;
  return data && typeof data === "object" ? data as StorefrontVariantDto : response as StorefrontVariantDto;
};

const unwrapProduct = (response: StorefrontProductEnvelope): StorefrontProductDto => {
  const data = (response as { data?: unknown }).data;
  return data && typeof data === "object" ? data as StorefrontProductDto : response as StorefrontProductDto;
};

const unwrapVariants = (response: StorefrontVariantsEnvelope): StorefrontVariantDto[] => {
  if (Array.isArray(response)) return response;
  const value = "data" in response ? response.data : response;
  if (Array.isArray(value)) return value;
  return Array.isArray(value.items) ? value.items : [];
};

const queryParams = (query: MyProductsQuery) => ({
  page: query.page,
  limit: query.limit,
  search: query.search,
  categoryId: query.categoryId,
  minPrice: query.minPrice,
  maxPrice: query.maxPrice,
  sort: query.sort,
  status: query.status,
});

// Seller/admin endpointlari. Token auth service ulangach UI qatlamidan beriladi.
export const productAdminService = {
  list(query: ProductQuery, accessToken: string): Promise<StorefrontProductsEnvelope> {
    return apiClient(PRODUCTS_PATH, { params: queryParams(query), headers: authorization(accessToken), cache: "no-store" });
  },

  listMine(query: MyProductsQuery, accessToken: string): Promise<StorefrontProductsEnvelope> {
    return apiClient(`${PRODUCTS_PATH}/my`, { params: queryParams(query), headers: authorization(accessToken), cache: "no-store" });
  },

  async create(input: ProductCreateInput, accessToken: string): Promise<StorefrontProductDto> {
    const response = await apiClient<StorefrontProductEnvelope>(PRODUCTS_PATH, {
      method: "POST",
      body: input,
      headers: authorization(accessToken),
      cache: "no-store",
    });
    return unwrapProduct(response);
  },

  async getById(productId: ID, accessToken: string): Promise<StorefrontProductDto> {
    const response = await apiClient<StorefrontProductEnvelope>(`${PRODUCTS_PATH}/${encodeURIComponent(String(productId))}`, {
      headers: authorization(accessToken),
      cache: "no-store",
    });
    return unwrapProduct(response);
  },

  async update(productId: ID, input: ProductUpdateInput, accessToken: string): Promise<StorefrontProductDto> {
    const response = await apiClient<StorefrontProductEnvelope>(`${PRODUCTS_PATH}/${encodeURIComponent(String(productId))}`, {
      method: "PATCH",
      body: input,
      headers: authorization(accessToken),
      cache: "no-store",
    });
    return unwrapProduct(response);
  },

  async delete(productId: ID, accessToken: string): Promise<void> {
    await apiClient(`${PRODUCTS_PATH}/${encodeURIComponent(String(productId))}`, {
      method: "DELETE",
      headers: authorization(accessToken),
      cache: "no-store",
    });
  },

  async createVariant(productId: ID, input: ProductVariantInput, accessToken: string): Promise<StorefrontVariantDto> {
    const response = await apiClient<StorefrontVariantEnvelope>(`${PRODUCTS_PATH}/${encodeURIComponent(String(productId))}/variants`, {
      method: "POST",
      body: input,
      headers: authorization(accessToken),
      cache: "no-store",
    });
    return unwrapVariant(response);
  },

  async listVariants(productId: ID, accessToken: string): Promise<StorefrontVariantDto[]> {
    const response = await apiClient<StorefrontVariantsEnvelope>(`${PRODUCTS_PATH}/${encodeURIComponent(String(productId))}/variants`, {
      headers: authorization(accessToken),
      cache: "no-store",
    });
    return unwrapVariants(response);
  },

  async getVariant(productId: ID, variantId: ID, accessToken: string): Promise<StorefrontVariantDto> {
    const response = await apiClient<StorefrontVariantEnvelope>(`${PRODUCTS_PATH}/${encodeURIComponent(String(productId))}/variants/${encodeURIComponent(String(variantId))}`, {
      headers: authorization(accessToken),
      cache: "no-store",
    });
    return unwrapVariant(response);
  },

  async updateVariant(productId: ID, variantId: ID, input: ProductVariantUpdateInput, accessToken: string): Promise<StorefrontVariantDto> {
    const response = await apiClient<StorefrontVariantEnvelope>(`${PRODUCTS_PATH}/${encodeURIComponent(String(productId))}/variants/${encodeURIComponent(String(variantId))}`, {
      method: "PATCH",
      body: input,
      headers: authorization(accessToken),
      cache: "no-store",
    });
    return unwrapVariant(response);
  },

  async deleteVariant(productId: ID, variantId: ID, accessToken: string): Promise<void> {
    await apiClient(`${PRODUCTS_PATH}/${encodeURIComponent(String(productId))}/variants/${encodeURIComponent(String(variantId))}`, {
      method: "DELETE",
      headers: authorization(accessToken),
      cache: "no-store",
    });
  },
};

export type ProductManagementDto = StorefrontProductDto;
