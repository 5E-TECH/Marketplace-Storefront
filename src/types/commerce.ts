export type ID = string | number;

export type ProductVariant = { id: ID; name?: string; sku?: string; price: number; oldPrice?: number; stock?: number; color?: string; size?: string; image?: string; attributes: Record<string, string | number | boolean> };

export type Product = {
  id: ID;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  images: string[];
  badge?: string;
  description: string;
  colors: string[];
  status?: string;
  shop?: { id: ID; name: string; slug: string; logoUrl?: string; status?: string };
  categoryInfo?: { id: ID; name: string; slug?: string };
  variants?: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
};

export type CartItem = {
  id: string;
  productId: ID;
  variantId?: ID;
  shopId: ID;
  product: Product;
  quantity: number;
  color: string;
};

export type Cart = { id?: string; items: CartItem[] };
export type AddCartInput = { product: Product; quantity: number; color: string; variantId?: ID };
export type Customer = { name: string; phone: string; email?: string; address: string };
export type OrderStatus = "Qabul qilindi" | "Yig‘ilmoqda" | "Yo‘lda" | "Yetkazildi" | "Bekor qilindi" | "Qaytarildi";
export type TrackingPackage = { id: string; shopId?: ID; shopName?: string; status: OrderStatus; trackingUrl?: string; updatedAt?: string };
export type OrderTracking = { orderId: string; status: OrderStatus; estimatedDeliveryAt?: string; updatedAt?: string; packages: TrackingPackage[] };
export type Order = { id: string; createdAt: string; status: OrderStatus; customer: Customer; items: CartItem[]; subtotal: number; delivery: number; total: number; payment: "cash" | "card"; warning?: string };
export type CheckoutAddress = { recipientName: string; phone: string; address: string; regionId: string; districtId: string };
export type DeliveryPackage = { shopId?: ID; shopName?: string; deliveryFee?: number; [key: string]: unknown };
export type DeliveryPreview = { subtotal: number; deliveryFee: number; totalAmount: number; packages: DeliveryPackage[] };
export type ProductSort = "createdAt:asc" | "createdAt:desc" | "price:asc" | "price:desc" | "name:asc" | "name:desc";
export type ProductQuery = { search?: string; categoryId?: ID; minPrice?: number; maxPrice?: number; sort?: ProductSort; page?: number; limit?: number };
export type Paginated<T> = { data: T[]; total: number; page: number; limit: number };
export type CatalogResult = Paginated<Product> & { totalPages: number; source: "api" | "unavailable"; error?: string };
export type ProductReview = { id: string; rating: number; comment?: string; createdAt: string; authorName: string };
export type ProductReviewsResult = { items: ProductReview[]; rating: number; total: number; page: number; limit: number; totalPages: number; error?: string };
export type ReviewableOrderItem = { orderItemId: string; orderId: string };
export type CatalogCategory = { id: ID; name: string; slug: string; parentId?: ID | null; iconUrl?: string; icon: string; children: CatalogCategory[] };
export type CategoryResult = { data: CatalogCategory[]; source: "api" | "unavailable"; error?: string };
export type StorefrontShop = { id: ID; name: string; slug: string; description?: string; logoUrl?: string; bannerUrl?: string; address?: string; rating: number };
export type ShopResult = { shop: StorefrontShop; catalog: CatalogResult };
