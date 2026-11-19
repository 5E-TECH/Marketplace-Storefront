import type { CreateLandingClick, LandingClickCreated, LandingPage } from "./contract";

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
    images: [],
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

export class MockBackendFailure extends Error {}

export function mockGetLanding(code: string): LandingPage | null {
  if (code === MOCK_FAILING_CODE) throw new MockBackendFailure("mock: server xatosi");
  return code === MOCK_CODE ? mockLanding : null;
}

export function mockCreateClick(body: CreateLandingClick): LandingClickCreated {
  return { clickId: `mock-${body.variant ?? "x"}-${crypto.randomUUID()}` };
}
