export type ID = string | number;

export type ProductVariant = { id: ID; name?: string; sku?: string; price: number; oldPrice?: number; stock?: number; color?: string; size?: string; image?: string; isActive?: boolean; attributes: Record<string, string | number | boolean> };

export type Shop = { id: ID; name: string; slug: string; logoUrl?: string; bannerUrl?: string; description?: string; status?: string; rating?: number; ordersCount?: number };

export type Product = {
  id: ID;
  slug?: string;
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
  shop?: Shop;
  categoryInfo?: { id: ID; name: string; slug?: string };
  variants?: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
};

export type CartItem = {
  id: string;
  productId: ID;
  variantId?: ID;
  product: Product;
  quantity: number;
  color: string;
};

export type Cart = { id?: string; items: CartItem[] };
export type AddCartInput = { product: Product; quantity: number; color: string; variantId?: ID };
export type Customer = { name: string; phone: string; email?: string; address: string };
export type Order = { id: string; createdAt: string; status: "Yangi" | "Tayyorlanmoqda" | "Yetkazildi"; customer: Customer; items: CartItem[]; subtotal: number; delivery: number; total: number; payment: "cash" | "card"; warning?: string };
export type ProductSort = "createdAt:asc" | "createdAt:desc" | "price:asc" | "price:desc" | "name:asc" | "name:desc";
export type ProductQuery = { search?: string; categoryId?: ID; minPrice?: number; maxPrice?: number; sort?: ProductSort; page?: number; limit?: number };
export type Paginated<T> = { data: T[]; total: number; page: number; limit: number };
export type CatalogResult = Paginated<Product> & { totalPages: number; source: "api" | "mock" | "unavailable"; error?: string };
export type CatalogCategory = { id: ID; name: string; slug: string; parentId?: ID | null; iconUrl?: string; icon: string; children: CatalogCategory[] };
export type CategoryResult = { data: CatalogCategory[]; source: "api" | "fallback"; error?: string };
export type ShopPageResult = { shop: Shop; products: CatalogResult };
