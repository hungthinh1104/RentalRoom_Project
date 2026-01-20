/**
 * Seeded RNG using Mulberry32 (fast, simple)
 */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate deterministic vector with seed + index
 * Used in test-seed-utils.ts and seed.ts
 */
export function generateRandomVector(
  seed: number,
  index: number = 0,
  dimensions: number = 768,
): number[] {
  const rng = mulberry32(seed + index);
  return Array.from({ length: dimensions }, () => rng() * 2 - 1);
}

/**
 * Split array into chunks of given size
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
