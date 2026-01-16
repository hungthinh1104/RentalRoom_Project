import * as fs from 'fs';
import * as path from 'path';
import { fakerVI as faker } from '@faker-js/faker';

export const CITY_PROVINCE_CODES: Record<string, string> = {
  'Hồ Chí Minh': '30',
  'Hà Nội': '01',
  'Đà Nẵng': '12',
};

const WARDS_CANDIDATES = [
  path.resolve(process.cwd(), '../fe-rental-room/public/data/wards.json'),
  path.resolve(process.cwd(), '../../fe-rental-room/public/data/wards.json'),
  path.resolve(process.cwd(), '../../../fe-rental-room/public/data/wards.json'),
  path.resolve(__dirname, '../../../fe-rental-room/public/data/wards.json')
];
let WARDS_FILE: string | null = null;
for (const c of WARDS_CANDIDATES) {
  if (fs.existsSync(c)) { WARDS_FILE = c; break; }
}
export const ALL_WARDS: Array<{ code: string; name: string; fullName: string; slug: string; type: string; provinceCode: string }> = WARDS_FILE ? JSON.parse(fs.readFileSync(WARDS_FILE, 'utf8')) : [];

// Fallback ward lists if FE wards.json is not available
const DEFAULT_WARDS: Record<string,string[]> = {
  'Hồ Chí Minh': ['Phường Bến Nghé','Phường Tân Định','Phường 1','Phường 2','Phường 3'],
  'Hà Nội': ['Phường Trúc Bạch','Phường Hàng Bài','Phường Cửa Nam','Phường Phúc Tân','Phường Cống Vị'],
  'Đà Nẵng': ['Phường Hải Châu 1','Phường Thanh Bình','Phường An Hải Tây']
};

export function getWardsForCity(cityName: keyof typeof CITY_PROVINCE_CODES) {
  const code = CITY_PROVINCE_CODES[cityName];
  return ALL_WARDS.filter((w) => w.provinceCode === code && w.type === 'ward').map((w) => w.name);
}

export const WARDS_BY_CITY: Record<string, string[]> = {
  'Hồ Chí Minh': (() => { const arr = getWardsForCity('Hồ Chí Minh'); return arr.length ? arr : DEFAULT_WARDS['Hồ Chí Minh']; })(),
  'Hà Nội': (() => { const arr = getWardsForCity('Hà Nội'); return arr.length ? arr : DEFAULT_WARDS['Hà Nội']; })(),
  'Đà Nẵng': (() => { const arr = getWardsForCity('Đà Nẵng'); return arr.length ? arr : DEFAULT_WARDS['Đà Nẵng']; })(),
};

// Load street lists (editable in prisma/seed/addresses.json or prisma/addresses.json)
const ADDR_CANDIDATES = [
  path.resolve(process.cwd(), 'prisma/seed/addresses.json'),
  path.resolve(process.cwd(), 'prisma/addresses.json'),
  path.resolve(__dirname, 'addresses.json'),
  path.resolve(__dirname, '../addresses.json')
];
let ADDR_FILE: string | null = null;
for (const c of ADDR_CANDIDATES) { if (fs.existsSync(c)) { ADDR_FILE = c; break; } }
export let STREET_BY_CITY: Record<string, string[]> = {};
try {
  if (ADDR_FILE) STREET_BY_CITY = JSON.parse(fs.readFileSync(ADDR_FILE, 'utf8'));
} catch (e) {
  // fallback is fine
}

export function getRandomAddress(city: string, ward: string) {
  const streets = STREET_BY_CITY[city] || [];
  const street = streets.length ? faker.helpers.arrayElement(streets) : `${faker.location.streetAddress()}`;
  const number = faker.number.int({ min: 1, max: 999 });
  return `${number} ${street}, ${ward}, ${city}`;
}

// deterministic vector generator using seed-derived mulberry32
export function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateRandomVector(seed: number, counter: number, dimensions: number = 768): number[] {
  const localRng = mulberry32(seed + counter);
  return Array.from({ length: dimensions }, () => localRng() * 2 - 1);
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function pickRandomWardFromCities(cities: string[]) {
  const candidates: string[] = [];
  for (const c of cities) {
    const arr = WARDS_BY_CITY[c] || [];
    if (arr && arr.length) candidates.push(...arr);
  }
  if (candidates.length) return faker.helpers.arrayElement(candidates);
  // fallback simple list
  const fallback = ['Phường 1','Phường 2','Quận 1','Quận 2','Trung tâm'];
  return faker.helpers.arrayElement(fallback);
}

export function pickRandomWardForCity(city: string) {
  const arr = WARDS_BY_CITY[city] || [];
  if (arr.length) return faker.helpers.arrayElement(arr);
  return pickRandomWardFromCities(Object.keys(WARDS_BY_CITY));
}

// -------------------- Geocoding (optional) --------------------
const GEOCODE_CACHE_FILE = path.resolve(process.cwd(), 'prisma/geocode-cache.json');
let GEOCODE_CACHE: Record<string, { lat: number; lon: number }> = {};
try {
  GEOCODE_CACHE = JSON.parse(fs.readFileSync(GEOCODE_CACHE_FILE, 'utf8'));
} catch (e) {
  GEOCODE_CACHE = {};
}

export async function geocodeAddress(address: string, options?: { force?: boolean }) {
  const normalized = address.trim();
  if (GEOCODE_CACHE[normalized] && !options?.force) return GEOCODE_CACHE[normalized];

  // Only run if environment allows it
  if (process.env.GEOCODE !== '1') return null;

  // Respect Nominatim usage policy: add user-agent and pause between calls if needed
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalized)}&limit=1&addressdetails=0`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'rental-room-seed/1.0 (+https://example.com)' } });
    if (!res.ok) return null;
    const arr = await res.json();
    if (!arr || arr.length === 0) return null;
    const { lat, lon } = arr[0];
    const coords = { lat: Number(lat), lon: Number(lon) };
    GEOCODE_CACHE[normalized] = coords;
    try { fs.writeFileSync(GEOCODE_CACHE_FILE, JSON.stringify(GEOCODE_CACHE, null, 2)); } catch (e) { /* ignore */ }
    // be polite
    await new Promise((r) => setTimeout(r, 1100));
    return coords;
  } catch (e) {
    return null;
  }
}

// -------------------- Embedding metadata logging --------------------
const EMBED_METADATA_FILE = path.resolve(process.cwd(), 'prisma/embeddings-metadata.json');
let EMBED_META: Record<string, any> = {};
try {
  EMBED_META = JSON.parse(fs.readFileSync(EMBED_METADATA_FILE, 'utf8'));
} catch (e) {
  EMBED_META = {};
}

export function saveEmbeddingMetadata(entries: Array<{ roomId: string; seed: number; counter: number }>) {
  for (const e of entries) {
    EMBED_META[e.roomId] = { seed: e.seed, counter: e.counter, generatedAt: new Date().toISOString() };
  }
  try { fs.writeFileSync(EMBED_METADATA_FILE, JSON.stringify(EMBED_META, null, 2)); } catch (e) { /* ignore */ }
}

export function logInfo(message: string, meta?: Record<string, any>) {
  if (process.env.LOG_JSON === '1') {
    const out = { message, timestamp: new Date().toISOString(), ...meta };
    console.log(JSON.stringify(out));
  } else {
    if (meta) console.log(message, meta); else console.log(message);
  }
}

