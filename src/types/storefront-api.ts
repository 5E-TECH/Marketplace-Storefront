import type { ID } from "./commerce";

export type StorefrontMediaDto = { url?: string; src?: string; path?: string; imageUrl?: string; fileUrl?: string };
export type StorefrontShopDto = { id: ID; name: string; slug: string; logoUrl?: string; status?: string };
export type StorefrontCategoryDto = { id: ID; name: string; slug?: string };
export type StorefrontVariantDto = {
  id: ID;
  name?: string;
  sku?: string;
  price?: number | string;
  oldPrice?: number | string;
  stock?: number;
  color?: string;
  size?: string;
  imageUrl?: string;
  images?: Array<string | StorefrontMediaDto>;
  attributes?: Record<string, string | number | boolean>;
};

export type StorefrontProductDto = {
  id: ID;
  name: string;
  description?: string;
  shortDescription?: string;
  price?: number | string;
  oldPrice?: number | string;
  salePrice?: number | string;
  status?: string;
  imageUrl?: string;
  images?: Array<string | StorefrontMediaDto>;
  media?: Array<string | StorefrontMediaDto>;
  colors?: Array<string | { hex?: string; value?: string }>;
  rating?: number;
  averageRating?: number;
  reviewsCount?: number;
  category?: StorefrontCategoryDto;
  shop?: StorefrontShopDto;
  variants?: StorefrontVariantDto[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type StorefrontProductsResponse = { items: StorefrontProductDto[]; total: number; page: number; limit: number; totalPages: number };
export type StorefrontProductsEnvelope = StorefrontProductsResponse | { data: StorefrontProductsResponse };
export type StorefrontProductEnvelope = StorefrontProductDto | { data: StorefrontProductDto };

export type ProductVariantInput = {
  name?: string;
  sku?: string;
  price: number;
  oldPrice?: number;
  stock?: number;
  color?: string;
  size?: string;
  imageUrl?: string;
  images?: Array<string | StorefrontMediaDto>;
  attributes?: Record<string, string | number | boolean>;
};

export type ProductVariantUpdateInput = Partial<ProductVariantInput>;
export type StorefrontVariantEnvelope = StorefrontVariantDto | { data: StorefrontVariantDto };
export type StorefrontVariantsEnvelope = StorefrontVariantDto[] | { data: StorefrontVariantDto[] } | { items: StorefrontVariantDto[] } | { data: { items: StorefrontVariantDto[] } };

export type ProductCreateInput = Omit<StorefrontProductDto, "id" | "createdAt" | "updatedAt">;
export type ProductUpdateInput = Partial<ProductCreateInput>;
