import { ApiError, apiRequest } from "@/lib/api";

export type CheckoutRegion = { id: string; name: string };
export type CheckoutDistrict = { id: string; regionId: string; name: string };

const record = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const validId = (value: unknown): value is string | number => (typeof value === "string" && value.trim().length > 0) || (typeof value === "number" && Number.isSafeInteger(value) && value >= 0);
const validName = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value.trim().length <= 150;
const validRegions = (value: unknown): value is { id: string | number; name: string }[] => Array.isArray(value) && value.every((item) => {
  const row = record(item);
  return Boolean(row && validId(row.id) && validName(row.name));
});
const validDistricts = (value: unknown): value is { id: string | number; regionId: string | number; name: string }[] => Array.isArray(value) && value.every((item) => {
  const row = record(item);
  return Boolean(row && validId(row.id) && validId(row.regionId) && validName(row.name));
});
const uniqueById = <T extends { id: string }>(items: T[]): T[] => [...new Map(items.map((item) => [item.id, item])).values()];

export const locationService = {
  async listRegions(signal?: AbortSignal): Promise<CheckoutRegion[]> {
    const rows = await apiRequest("/regions", { signal, validate: validRegions });
    return uniqueById(rows.map((item) => ({ id: String(item.id), name: item.name.trim() })));
  },

  async listDistricts(regionId: string, signal?: AbortSignal): Promise<CheckoutDistrict[]> {
    if (!regionId.trim() || /[\\/]/.test(regionId)) throw new ApiError(0, "Viloyat IDsi noto‘g‘ri", undefined, "configuration");
    const rows = await apiRequest(`/regions/${encodeURIComponent(regionId)}/districts`, { signal, validate: validDistricts });
    const districts = rows.map((item) => ({ id: String(item.id), regionId: String(item.regionId), name: item.name.trim() }));
    if (districts.some((item) => item.regionId !== regionId)) throw new ApiError(200, "Backend boshqa viloyat tumanlarini qaytardi", undefined, "invalid_response");
    return uniqueById(districts);
  },
};
