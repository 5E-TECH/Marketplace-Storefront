import { apiRequest } from "@/lib/api";

export interface RegionOption { id: string; name: string }
export interface DistrictOption extends RegionOption { regionId: string }

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const isRegion = (value: unknown): value is RegionOption => isRecord(value) && typeof value.id === "string" && typeof value.name === "string";
const isDistrict = (value: unknown): value is DistrictOption => isRecord(value) && isRegion(value) && typeof value.regionId === "string";
const isRegions = (value: unknown): value is RegionOption[] => Array.isArray(value) && value.every(isRegion);
const isDistricts = (value: unknown): value is DistrictOption[] => Array.isArray(value) && value.every(isDistrict);

export const locationService = {
  regions: (signal?: AbortSignal) => apiRequest<RegionOption[]>("/regions", { method: "GET", signal, validate: isRegions }),
  districts: (regionId: string, signal?: AbortSignal) => apiRequest<DistrictOption[]>(`/regions/${encodeURIComponent(regionId)}/districts`, { method: "GET", signal, validate: isDistricts }),
};
