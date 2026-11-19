/**
 * Backend shartnomasi: `5E-TECH/marketplace` `docs/openapi.json` (`dev`): `LandingPageDto`,
 * `LandingPageCreativeDto`, `CreateLandingClickDto`, `LandingClickCreatedDto`.
 * Haqiqiy kod — BE-11 (PR 101), 2026-11-17 dan `dev` da; production backend (`main`) da hali yo‘q.
 * Shuning uchun lokal va CI da mock ishlaydi (`MOCK_API=true`), backend bilan — `MOCK_API=false`.
 */
import type { Variant } from "./variant";

export type LandingState = "OPEN" | "OUT_OF_STOCK" | "NOT_ACCEPTED" | "WITHDRAWN";
export type LandingTemplate = "STANDART" | "VIDEO";

export interface LandingPageSpec { name: string; value: string }

/** Sotuvchi tanlagan reklama rasmi yoki videosi (BE-11 offer kreativlari). Shablonda ishlatilishi — SF-02. */
export interface LandingPageCreative { id: string; type: "IMAGE" | "VIDEO"; url: string }

export interface LandingPageProduct {
  id: string;
  name: string;
  subtitle: string | null;
  images: string[];
  videoUrl: string | null;
  creatives: LandingPageCreative[];
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
