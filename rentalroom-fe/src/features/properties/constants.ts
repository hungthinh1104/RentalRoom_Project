import { PropertyType } from "@/types/enums";
import { getProvinceNames, getWardNamesByProvinceName } from "@/lib/data/vietnam-geo";

// Vietnamese labels for property types
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: "Căn hộ",
  [PropertyType.HOUSE]: "Nhà riêng",
  [PropertyType.STUDIO]: "Studio",
};

// Icons for property types
export const PROPERTY_TYPE_ICONS: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: "🏢",
  [PropertyType.HOUSE]: "🏠",
  [PropertyType.STUDIO]: "🏘️",
};

/**
 * Get danh sách tên tỉnh/thành phố (63 tỉnh/thành sau sắp nhập 2025)
 * Dữ liệu từ vn-geo - Synchronous, lightweight (5.4KB)
 */
export function getVietnameseCities(): string[] {
  return getProvinceNames();
}

/**
 * Get danh sách phường/xã theo tên tỉnh/thành (wards)
 * Dữ liệu từ vn-geo - Async lazy load (615KB)
 * Backwards-compatible: function kept as `getDistrictsByCity` for legacy callers.
 */
export async function getDistrictsByCity(cityName: string): Promise<string[]> {
  return getWardNamesByProvinceName(cityName);
}
