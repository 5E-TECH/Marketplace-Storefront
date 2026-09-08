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
  product: Product;
  quantity: number;
  color: string;
};

export type Cart = { id?: string; items: CartItem[] };
export type AddCartInput = { product: Product; quantity: number; color: string; variantId?: ID };
export type Customer = { name: string; phone: string; email?: string; address: string };
export type Order = { id: string; createdAt: string; status: "Yangi" | "Tayyorlanmoqda" | "Yetkazildi"; customer: Customer; items: CartItem[]; subtotal: number; delivery: number; total: number; payment: "cash" | "card"; warning?: string };
export type ProductQuery = { search?: string; categoryId?: ID; minPrice?: number; maxPrice?: number; sort?: `${string}:${"asc" | "desc"}`; page?: number; limit?: number };
export type Paginated<T> = { data: T[]; total: number; page: number; limit: number };
export type CatalogResult = Paginated<Product> & { totalPages: number; source: "api" | "mock" | "unavailable"; error?: string };
