import type { components } from "@/generated/api-types";

// Backend DTOs come only from the checked-in OpenAPI snapshot.
export type StorefrontProductDto = components["schemas"]["StorefrontProductDto"];
export type StorefrontProductsResponse = components["schemas"]["StorefrontProductsPageDto"];
export type StorefrontVariantDto = components["schemas"]["ProductVariantDto"];
export type StorefrontShopDto = components["schemas"]["SellerShopDto"];
export type StorefrontShopPageDto = components["schemas"]["StorefrontShopPageDto"];
export type StorefrontCategoryDto = components["schemas"]["StorefrontCategoryDto"];
export type CategoryTreeDto = components["schemas"]["CategoryTreeDto"];
export type ProductCreateInput = components["schemas"]["CreateProductDto"];
export type ProductUpdateInput = components["schemas"]["UpdateProductDto"];
export type ProductVariantInput = components["schemas"]["CreateProductVariantDto"];
export type ProductVariantUpdateInput = components["schemas"]["UpdateProductVariantDto"];
export type ProductManagementDto = components["schemas"]["ProductDto"];
export type MyProductsResponse = components["schemas"]["MyProductsPageDto"];
export type BuyerOrdersResponse = components["schemas"]["BuyerOrdersPageDto"];
export type OrderActionResultDto = components["schemas"]["OrderActionResultDto"];
export type ReturnRequestDto = components["schemas"]["ReturnRequestDto"];
export type ReturnRequestDetailsDto = components["schemas"]["ReturnRequestDetailsDto"];
export type ReturnRequestsPageDto = components["schemas"]["ReturnRequestsPageDto"];
export type CreateReturnRequestDto = components["schemas"]["CreateReturnRequestDto"];
export type CreateReturnRequestsResultDto = components["schemas"]["CreateReturnRequestsResultDto"];
export type NotificationDto = components["schemas"]["NotificationDto"];
export type NotificationsPageDto = components["schemas"]["NotificationsPageDto"];
export type FavoritesResponse = components["schemas"]["FavoritesPageDto"];
export type StorefrontBannerDto = components["schemas"]["StorefrontBannerDto"];
