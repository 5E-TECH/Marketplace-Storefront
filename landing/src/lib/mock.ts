import type { CreateLandingClick, CreateLead, LandingClickCreated, LandingPage } from "./contract";

/**
 * Mock: backendsiz ishlash uchun (lokal va CI; BE-11 `dev` da, production backendda hali yo‘q). Qiymatlar BE-25 shartnomasidagi
 * misollardan (`LandingPageDto` example) va holat-matnlari.md «2. Sums», «Qisman (sukut)»
 * qatoridan: 262 000 / 30 000 / 50 000 so‘m (T01:98).
 */
export const MOCK_CODE = "k7Qm2x";

/** Faqat mock: shu kod server xatosini ko‘rsatadi (xato-1 holatini sinash uchun). */
export const MOCK_FAILING_CODE = "mockXato";

export const mockLanding: LandingPage = {
  code: MOCK_CODE,
  state: "OPEN",
  template: "STANDART",
  product: {
    id: "501",
    name: "Simsiz quloqchinlar",
    subtitle: "Bluetooth, quvvatlovchi g‘ilof bilan",
    images: ["/namuna/quloqchin.svg"],
    videoUrl: null,
    creatives: [],
    description: "Telefonga Bluetooth orqali ulanadi. Ixcham g‘ilofda saqlanadi.",
    highlights: ["Telefonga Bluetooth orqali ulanadi", "Ixcham g‘ilofda saqlanadi va quvvatlanadi"],
    boxContents: ["Quloqchinlar (juft)", "Quvvatlovchi g‘ilof", "Quvvat kabeli"],
    specs: [{ name: "Aloqa", value: "Bluetooth" }, { name: "Og‘irlik", value: "0.3 kg" }, { name: "Kategoriya", value: "Elektronika" }],
    isBad: false,
  },
  price: { salePrice: 262_000, centerDeliveryFee: 30_000, addressDeliveryFee: 50_000 },
  metaPixelId: null,
  tiktokPixelId: null,
};

/**
 * Boshqa holatlarni sinash uchun mock sahifalar (faqat MOCK_API=true). Summalar holat-matnlari.md
 * «2. Sums» dan: narx-4 (bepul 294 000), narx-5 (BAD 221 000 / 30 000 / 50 000); toxtatilgan-1 180 000.
 */
const withProduct = (product: Partial<LandingPage["product"]>, rest: Partial<LandingPage> = {}): LandingPage => ({
  ...mockLanding, ...rest, product: { ...mockLanding.product, ...product },
});

export const MOCK_PAGES: Readonly<Record<string, LandingPage>> = {
  [MOCK_CODE]: mockLanding,
  mockVideo: withProduct({ videoUrl: "/namuna/video.mp4" }, { code: "mockVideo", template: "VIDEO" }),
  mockBad: withProduct({ name: "Vitamin kompleksi", subtitle: "Biologik faol qo‘shimcha", isBad: true }, { code: "mockBad", price: { salePrice: 221_000, centerDeliveryFee: 30_000, addressDeliveryFee: 50_000 } }),
  mockBepul: withProduct({}, { code: "mockBepul", price: { salePrice: 294_000, centerDeliveryFee: 0, addressDeliveryFee: 0 } }),
  mockYoq: withProduct({ name: "Bolalar termos shishasi", subtitle: "Bolalar uchun", images: ["/namuna/termos.svg"] }, { code: "mockYoq", state: "OUT_OF_STOCK", price: { salePrice: 180_000, centerDeliveryFee: 30_000, addressDeliveryFee: 50_000 } }),
  mockHavola: withProduct({}, { code: "mockHavola", state: "NOT_ACCEPTED" }),
  mockOlingan: withProduct({}, { code: "mockOlingan", state: "WITHDRAWN" }),
};

export class MockBackendFailure extends Error {}

export function mockGetLanding(code: string): LandingPage | null {
  if (code === MOCK_FAILING_CODE) throw new MockBackendFailure("mock: server xatosi");
  return Object.hasOwn(MOCK_PAGES, code) ? MOCK_PAGES[code] : null;
}

export function mockCreateClick(body: CreateLandingClick): LandingClickCreated {
  return { clickId: `mock-${body.variant ?? "x"}-${crypto.randomUUID()}` };
}

/** Faqat mock: shu ism bilan yuborilgan forma server xatosini oladi (SF-02 TC2: «rahmat» va piksel yo‘q). */
export const MOCK_FAILING_NAME = "Xato Sinov";

/** Faqat mock: shu raqam bilan ariza dublikat bo‘ladi (rahmat-4). */
export const MOCK_DUPLICATE_PHONE = "+998901111111";

/**
 * Mock lid: ochiq sahifa — yangi lid (raqamli ID, BE-25 `LeadCreatedDto` misoli kabi), ochiq bo‘lmagani — 409
 * `LANDING_NOT_OPEN`, noma’lum kod — 404.
 */
export function mockCreateLead(body: CreateLead): { kind: "created"; leadId: string; duplicate: boolean } | { kind: "notFound" } | { kind: "notOpen" } {
  if (body.name.trim() === MOCK_FAILING_NAME) throw new MockBackendFailure("mock: server xatosi");
  const page = Object.hasOwn(MOCK_PAGES, body.code) ? MOCK_PAGES[body.code] : null;
  if (!page) return { kind: "notFound" };
  if (page.state !== "OPEN") return { kind: "notOpen" };
  return { kind: "created", leadId: String(7000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000)), duplicate: body.phone === MOCK_DUPLICATE_PHONE };
}
