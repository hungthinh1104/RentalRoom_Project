/**
 * Vietnam Geographic Data Utilities
 * Dữ liệu địa danh Việt Nam 2025 từ vn-geo
 * 
 * Performance Note:
 * - provinces.json: 5.4KB (always loaded)
 * - tree.json: 615KB (lazy loaded when needed)
 * - wards.json: 603KB (lazy loaded when needed)
 */

import provincesData from './provinces.json';

// Data are now served from public/data (fetched at runtime)
let treeCache: ProvinceWithWards[] | null = null;
let wardsCache: Ward[] | null = null;

async function loadTreeData(): Promise<ProvinceWithWards[]> {
  if (treeCache) return treeCache;
  const res = await fetch('/data/tree.json');
  if (!res.ok) throw new Error('Failed to load /data/tree.json');
  treeCache = await res.json();
  return treeCache!;
}

async function loadWardsData(): Promise<Ward[]> {
  if (wardsCache) return wardsCache;
  const res = await fetch('/data/wards.json');
  if (!res.ok) throw new Error('Failed to load /data/wards.json');
  wardsCache = await res.json();
  return wardsCache!;
}

export interface Province {
  code: string;
  name: string;
  fullName: string;
  slug: string;
  type: "province" | "city";
  isCentral: boolean;
}

export interface Ward {
  code: string;
  name: string;
  fullName: string;
  slug: string;
  type: "ward" | "commune";
  provinceCode: string;
}

export interface ProvinceWithWards extends Province {
  wards: Omit<Ward, 'provinceCode'>[];
}

/**
 * Lấy danh sách tất cả tỉnh/thành phố
 */
export function getProvinces(): Province[] {
  return provincesData as Province[];
}

/**
 * Lấy danh sách tên tỉnh/thành phố (sorted)
 */
export function getProvinceNames(): string[] {
  return provincesData
    .map(p => p.name)
    .sort((a, b) => a.localeCompare(b, 'vi'));
}

/**
 * Lấy tỉnh theo tên
 */
export function getProvinceByName(name: string): Province | undefined {
  return provincesData.find(p => p.name === name) as Province | undefined;
}

/**
 * Lấy tỉnh theo code
 */
export function getProvinceByCode(code: string): Province | undefined {
  return provincesData.find(p => p.code === code) as Province | undefined;
}

/**
 * Lấy danh sách tất cả phường/xã/thị trấn (async)
 */
export async function getWards(): Promise<Ward[]> {
  const data = await loadWardsData();
  return data || [];
}

/**
 * Lấy danh sách phường/xã theo mã tỉnh (async)
 */
export async function getWardsByProvinceCode(provinceCode: string): Promise<Ward[]> {
  const data = await loadWardsData();
  return data ? data.filter((w: Ward) => w.provinceCode === provinceCode) : [];
}

/**
 * Lấy danh sách phường/xã theo tên tỉnh (async)
 */
export async function getWardsByProvinceName(provinceName: string): Promise<Ward[]> {
  const province = getProvinceByName(provinceName);
  if (!province) return [];
  return getWardsByProvinceCode(province.code);
}

/**
 * Lấy danh sách tên quận/huyện theo tỉnh (sorted, unique)
 * Dùng cho dropdown quận/huyện
 * OPTIMIZED: Dùng tree.json thay vì wards.json vì có sẵn structure
 */
export async function getWardNamesByProvinceName(provinceName: string): Promise<string[]> {
  const data = await loadTreeData();
  if (!data) return [];
  
  const province = data.find((p: ProvinceWithWards) => p.name === provinceName);
  
  if (!province || !province.wards) return [];
  
  // Extract unique ward/commune names from wards
  const uniqueNames = new Set<string>();
  province.wards.forEach((ward) => {
    // Parse ward/commune name from fullName
    // Example: "Phường Hà Đông, Quận Hà Đông, Thành phố Hà Nội"
    const parts = ward.fullName.split(',');
    if (parts.length > 0) {
      const wardName = parts[0]
        .replace(/^(Phường|Xã|Thị trấn)\s+/, '')
        .trim();
      uniqueNames.add(wardName);
    }
  });
  
  return Array.from(uniqueNames).sort((a, b) => a.localeCompare(b, 'vi'));
}

// Backwards-compatible alias (keeps compatibility with legacy code using 'district' name)
export const getDistrictNamesByProvinceName = getWardNamesByProvinceName;

/**
 * Lấy cấu trúc phân cấp tỉnh + phường/xã (async)
 */
export async function getProvinceTree(): Promise<ProvinceWithWards[]> {
  const data = await loadTreeData();
  return data || [];
}

/**
 * Lấy tỉnh với danh sách phường/xã theo tên (async)
 */
export async function getProvinceTreeByName(name: string): Promise<ProvinceWithWards | undefined> {
  const data = await loadTreeData();
  return data ? data.find((p: ProvinceWithWards) => p.name === name) : undefined;
}

/**
 * Search phường/xã theo keyword (async)
 */
export async function searchWards(keyword: string, limit = 50): Promise<Ward[]> {
  const data = await loadWardsData();
  if (!data) return [];
  
  const lowerKeyword = keyword.toLowerCase();
  return data
    .filter((w: Ward) => 
      w.name.toLowerCase().includes(lowerKeyword) ||
      w.fullName.toLowerCase().includes(lowerKeyword) ||
      w.slug.includes(lowerKeyword)
    )
    .slice(0, limit);
}

/**
 * Get thành phố trung ương (5 thành phố lớn)
 */
export function getCentralCities(): Province[] {
  return provincesData.filter(p => p.isCentral) as Province[];
}

/**
 * Get tỉnh (không phải thành phố trung ương)
 */
export function getRegularProvinces(): Province[] {
  return provincesData.filter(p => !p.isCentral) as Province[];
}
