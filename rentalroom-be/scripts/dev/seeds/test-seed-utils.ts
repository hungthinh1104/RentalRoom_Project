import { generateRandomVector, chunkArray } from '../../../prisma/seed/seeds/utils';

// Deterministic vector test
const v1 = generateRandomVector(12345, 0, 10);
const v2 = generateRandomVector(12345, 0, 10);

if (JSON.stringify(v1) !== JSON.stringify(v2)) {
  console.error('Deterministic vector test failed');
  process.exit(1);
}

// chunk test
const arr = Array.from({length: 7}, (_,i)=>i+1);
const chunks = chunkArray(arr, 3);
if (chunks.length !== 3 || chunks[2].length !== 1) {
  console.error('Chunk array test failed', chunks);
  process.exit(2);
}

console.log('✅ seed utils tests passed');
