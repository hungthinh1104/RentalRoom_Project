import * as fs from 'fs';
import * as path from 'path';

export type WardRecord = {
  code: string;
  name: string;
  fullName?: string;
  slug?: string;
  type?: string; // "ward" | "commune" | "town" | etc.
  provinceCode: string;
};

export type WardsIndex = {
  byProvinceCode: Map<string, WardRecord[]>;
  byName: Map<string, WardRecord[]>; // normalized name -> list (names may duplicate across provinces)
};

function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function resolveWardsJsonPath(): string | null {
  // Priority: env var, then FE path relative to project
  const envPath = process.env.WARDS_JSON_PATH;
  const candidates = [
    envPath,
    // BE-local typical locations
    path.resolve(process.cwd(), 'public/wards.json'),
    path.resolve(process.cwd(), 'data/wards.json'),
    path.resolve(process.cwd(), 'src/data/wards.json'),
    path.resolve(process.cwd(), '../rentalroom-fe/public/data/wards.json'),
    path.resolve(process.cwd(), '../../rentalroom-fe/public/data/wards.json'),
    path.resolve(__dirname, '../../../../rentalroom-fe/public/data/wards.json'),
  ].filter(Boolean) as string[];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (error) {
      // ignore file system access errors during path discovery
      void error;
    }
  }
  return null;
}

export function loadWardsIndex(): {
  index: WardsIndex | null;
  source: string | null;
} {
  const filePath = resolveWardsJsonPath();
  if (!filePath) return { index: null, source: null };
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const wards: WardRecord[] = JSON.parse(raw);
    const byProvinceCode = new Map<string, WardRecord[]>();
    const byName = new Map<string, WardRecord[]>();
    for (const w of wards) {
      if (!byProvinceCode.has(w.provinceCode))
        byProvinceCode.set(w.provinceCode, []);
      byProvinceCode.get(w.provinceCode)!.push(w);
      const key = normalize(w.name);
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key)!.push(w);
    }
    return { index: { byProvinceCode, byName }, source: filePath };
  } catch {
    return { index: null, source: filePath };
  }
}

export function getWardType(
  name: string,
  provinceCode?: string,
): string | undefined {
  const { index } = loadWardsIndex();
  if (!index) return undefined;
  const matches = index.byName.get(normalize(name)) || [];
  if (!matches.length) return undefined;
  if (provinceCode) {
    const m = matches.find((w) => w.provinceCode === provinceCode);
    return m?.type;
  }
  return matches[0]?.type;
}

export function listWardNamesByProvinceCode(provinceCode: string): string[] {
  const { index } = loadWardsIndex();
  if (!index) return [];
  return (index.byProvinceCode.get(provinceCode) || []).map((w) => w.name);
}

export function getWardCodes(name: string): string[] {
  const { index } = loadWardsIndex();
  if (!index) return [];
  const matches = index.byName.get(normalize(name)) || [];
  return matches.map((w) => w.code);
}
