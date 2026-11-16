/**
 * Backend shartnomasi: `5E-TECH/marketplace` `docs/openapi.json`, `feat/be-25-lid-shartnoma`
 * (PR 98): `LandingPageDto`, `CreateLandingClickDto`, `LandingClickCreatedDto`.
 * Backend hozircha 501 qaytaradi (BE-11), shuning uchun lokal va CI da mock ishlaydi (`MOCK_API=true`).
 */
import type { Variant } from "./variant";

export type LandingState = "OPEN" | "OUT_OF_STOCK" | "NOT_ACCEPTED" | "WITHDRAWN";
export type LandingTemplate = "STANDART" | "VIDEO";

export interface LandingPageSpec { name: string; value: string }

export interface LandingPageProduct {
  id: string;
  name: string;
  subtitle: string | null;
  images: string[];
  videoUrl: string | null;
  description: string | null;
  highlights: string[];
  boxContents: string[];
  specs: LandingPageSpec[];
  isBad: boolean;
}

export interface LandingPagePrice {
  salePrice: number;
  centerDeliveryFee: number;
  addressDeliveryFee: number;
}

export interface LandingPage {
  code: string;
  state: LandingState;
  template: LandingTemplate;
  product: LandingPageProduct;
  price: LandingPagePrice;
  metaPixelId: string | null;
  tiktokPixelId: string | null;
}

/** Kuzatuv maydonlari: sotuvchining sub1–sub5, utm va fbclid (SF-02 TC4). */
export const TRACKING_FIELDS = [
  "sub1", "sub2", "sub3", "sub4", "sub5",
  "utmSource", "utmMedium", "utmCampaign", "utmContent", "utmTerm",
  "fbclid",
] as const;
export type TrackingField = (typeof TRACKING_FIELDS)[number];

export type CreateLandingClick = { code: string; variant?: Variant; fbp?: string; fbc?: string } & Partial<Record<TrackingField, string>>;

export interface LandingClickCreated { clickId: string }
