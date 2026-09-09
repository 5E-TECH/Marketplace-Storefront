import { apiRequest } from "@/lib/api";
import { validateMyProductsPageDto, validateProductDto, validateProductVariantDto, validateStorefrontProductsPageDto } from "@/generated/api-validators";
import type { ID, ProductQuery } from "@/types/commerce";
import type {
  ProductVariantInput,
  ProductVariantUpdateInput,
  ProductCreateInput,
  ProductUpdateInput,
  ProductManagementDto,
  MyProductsResponse,
  StorefrontProductsResponse,
  StorefrontVariantDto,
} from "@/types/storefront-api";

const PRODUCTS_PATH = "/products";

export type MyProductsQuery = ProductQuery & { status?: string };

const authorization = (accessToken: string): HeadersInit => {
  if (!accessToken.trim()) throw new Error("Product management API uchun access token kerak");
  return { Authorization: `Bearer ${accessToken}` };
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
  list(query: ProductQuery, accessToken: string): Promise<StorefrontProductsResponse> {
    return apiRequest(PRODUCTS_PATH, { params: queryParams(query), headers: authorization(accessToken), cache: "no-store", validate: validateStorefrontProductsPageDto });
  },

  listMine(query: MyProductsQuery, accessToken: string): Promise<MyProductsResponse> {
    return apiRequest(`${PRODUCTS_PATH}/my`, { params: queryParams(query), headers: authorization(accessToken), cache: "no-store", validate: validateMyProductsPageDto });
  },

  async create(input: ProductCreateInput, accessToken: string): Promise<ProductManagementDto> {
    const response = await apiRequest<ProductManagementDto>(PRODUCTS_PATH, {
      method: "POST",
      body: input,
      headers: authorization(accessToken),
      cache: "no-store",
      validate: validateProductDto,
    });
    return response;
  },

  async getById(productId: ID, accessToken: string): Promise<ProductManagementDto> {
    const response = await apiRequest<ProductManagementDto>(`${PRODUCTS_PATH}/${encodeURIComponent(String(productId))}`, {
      headers: authorization(accessToken),
      cache: "no-store",
      validate: validateProductDto,
    });
    return response;
  },

  async update(productId: ID, input: ProductUpdateInput, accessToken: string): Promise<ProductManagementDto> {
    const response = await apiRequest<ProductManagementDto>(`${PRODUCTS_PATH}/${encodeURIComponent(String(productId))}`, {
      method: "PATCH",
      body: input,
      headers: authorization(accessToken),
      cache: "no-store",
      validate: validateProductDto,
    });
    return response;
  },

  async delete(productId: ID, accessToken: string): Promise<void> {
    await apiRequest(`${PRODUCTS_PATH}/${encodeURIComponent(String(productId))}`, {
      method: "DELETE",
      headers: authorization(accessToken),
      cache: "no-store",
    });
  },

  async createVariant(productId: ID, input: ProductVariantInput, accessToken: string): Promise<StorefrontVariantDto> {
    const response = await apiRequest<StorefrontVariantDto>(`${PRODUCTS_PATH}/${encodeURIComponent(String(productId))}/variants`, {
      method: "POST",
      body: input,
      headers: authorization(accessToken),
      cache: "no-store",
      validate: validateProductVariantDto,
    });
    return response;
  },

  async listVariants(productId: ID, accessToken: string): Promise<StorefrontVariantDto[]> {
    const response = await apiRequest<StorefrontVariantDto[]>(`${PRODUCTS_PATH}/${encodeURIComponent(String(productId))}/variants`, {
      headers: authorization(accessToken),
      cache: "no-store",
      validate: (value): value is StorefrontVariantDto[] => Array.isArray(value) && value.every(validateProductVariantDto),
    });
    return response;
  },

  async getVariant(productId: ID, variantId: ID, accessToken: string): Promise<StorefrontVariantDto> {
    const response = await apiRequest<StorefrontVariantDto>(`${PRODUCTS_PATH}/${encodeURIComponent(String(productId))}/variants/${encodeURIComponent(String(variantId))}`, {
      headers: authorization(accessToken),
      cache: "no-store",
      validate: validateProductVariantDto,
    });
    return response;
  },

  async updateVariant(productId: ID, variantId: ID, input: ProductVariantUpdateInput, accessToken: string): Promise<StorefrontVariantDto> {
    const response = await apiRequest<StorefrontVariantDto>(`${PRODUCTS_PATH}/${encodeURIComponent(String(productId))}/variants/${encodeURIComponent(String(variantId))}`, {
      method: "PATCH",
      body: input,
      headers: authorization(accessToken),
      cache: "no-store",
      validate: validateProductVariantDto,
    });
    return response;
  },

  async deleteVariant(productId: ID, variantId: ID, accessToken: string): Promise<void> {
    await apiRequest(`${PRODUCTS_PATH}/${encodeURIComponent(String(productId))}/variants/${encodeURIComponent(String(variantId))}`, {
      method: "DELETE",
      headers: authorization(accessToken),
      cache: "no-store",
    });
  },
};

export type { ProductManagementDto } from "@/types/storefront-api";
