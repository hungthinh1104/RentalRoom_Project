import { PrismaClient, RoomStatus, AmenityType } from '@prisma/client';
import { fakerVI as faker } from '@faker-js/faker';
import { generateRandomVector, chunkArray } from './utils';
import type { SeedOptions } from './users';

export async function seedRooms(prisma: PrismaClient, properties: any[], opts: SeedOptions, seed: number) {
  const { DRY_RUN } = opts;
  const rooms: any[] = [];
  let vectorCounter = 0;

  const CHUNK_SIZE = Number(process.env.SEED_CHUNK_SIZE || 200);

  for (const property of properties) {
    const roomCount = faker.number.int({ min: 3, max: 8 });

    // prepare room data list for the property
    const roomInputs: Array<{ roomNumber: string; data: any; rawText: string; amenities: string[]; imagesCount: number }> = [];
    for (let i = 1; i <= roomCount; i++) {
      const price = faker.number.int({ min: 2000000, max: 15000000, multipleOf: 100000 });
      const description = faker.helpers.arrayElement(['Phòng trọ đầy đủ tiện nghi','Căn hộ mini hiện đại','Phòng cho thuê giá rẻ']);
      const rawText = `${property.name || property.address} ${property.ward} ${property.city} ${description} Giá ${price} VNĐ`;
      const status = faker.helpers.weightedArrayElement([{ value: RoomStatus.AVAILABLE, weight: 6 },{ value: RoomStatus.OCCUPIED, weight: 3 },{ value: RoomStatus.MAINTENANCE, weight: 1 }]);

      const roomNumber = `${String.fromCharCode(65 + Math.floor(i / 10))}${(i % 10) + 1}`.padStart(4, '0');
      const roomData = {
        propertyId: property.id,
        roomNumber,
        area: faker.number.float({ min: 15, max: 45, fractionDigits: 1 }),
        pricePerMonth: price,
        deposit: price * faker.helpers.arrayElement([1, 1.5, 2]),
        status,
        description,
        maxOccupants: faker.number.int({ min: 1, max: 3 }),
      };

      roomInputs.push({ roomNumber, data: roomData, rawText, amenities: faker.helpers.arrayElements(Object.values(AmenityType), faker.number.int({ min: 2, max: 4 })), imagesCount: faker.number.int({ min: 2, max: 5 }) });
    }

    // Insert rooms in chunks
    const { chunkArray } = await import('./utils.js');
    const roomChunks = chunkArray(roomInputs, CHUNK_SIZE);

    // log property progress
    try {
      const { logInfo } = await import('./utils.js');
      logInfo(`property.start`, { property: property.name || property.address, rooms: roomInputs.length, chunks: roomChunks.length });
    } catch (e) {
      console.log(`  - ${property.name || property.address}: ${roomInputs.length} rooms -> ${roomChunks.length} chunk(s)`);
    }

    for (let ci = 0; ci < roomChunks.length; ci++) {
      const chunk = roomChunks[ci];
      // prepare create list and update list for idempotency
      const roomNumbers = chunk.map((r) => r.roomNumber);

      if (!DRY_RUN) {
        try { const { logInfo } = await import('./utils.js'); logInfo(`chunk.start`, { property: property.name || property.address, chunk: ci + 1, totalChunks: roomChunks.length, rooms: chunk.length }); } catch (e) { console.log(`    > processing chunk ${ci + 1}/${roomChunks.length} (${chunk.length} rooms)`); }
      }

      if (DRY_RUN) {
        // simulate creation
        const createdRooms = chunk.map((r) => ({ id: faker.string.uuid(), ...r.data }));
        for (const cr of createdRooms) rooms.push(cr);
      } else {
        const existingRooms = await prisma.room.findMany({ where: { propertyId: property.id, roomNumber: { in: roomNumbers } } });
        const existingByNumber: Record<string, any> = {};
        for (const er of existingRooms) existingByNumber[er.roomNumber] = er;

        const toCreate = chunk.filter((r) => !existingByNumber[r.roomNumber]).map((r) => r.data);
        const toUpdate = chunk.filter((r) => !!existingByNumber[r.roomNumber]);

        if (toCreate.length) await prisma.room.createMany({ data: toCreate });
        for (const r of toUpdate) {
          await prisma.room.update({ where: { id: existingByNumber[r.roomNumber].id }, data: r.data });
        }

        // fetch back created/updated rows (by propertyId + roomNumber)
        const createdRooms = await prisma.room.findMany({ where: { propertyId: property.id, roomNumber: { in: roomNumbers } } });

        // map by roomNumber
        const roomsByNumber: Record<string, any> = {};
        for (const rr of createdRooms) roomsByNumber[rr.roomNumber] = rr;

        // prepare embedding rows and amenity/image insert batches
        const embeddingRows: Array<{ roomId: string; rawText: string; embedding: number[] }> = [];
        const amenityInserts: any[] = [];
        const imageInserts: any[] = [];

        for (const r of chunk) {
          const rr = roomsByNumber[r.roomNumber];
          if (!rr) continue;
          const roomId = rr.id;

          // deterministic vector
          const vectorEmbedding = generateRandomVector(seed, vectorCounter++, 768);
          embeddingRows.push({ roomId, rawText: r.rawText.replace(/'/g, "''"), embedding: vectorEmbedding });

          // amenities
          for (const a of r.amenities) amenityInserts.push({ roomId, amenityType: a, quantity: 1 });

          // images
          for (let idx = 0; idx < r.imagesCount; idx++) imageInserts.push({ roomId, imageUrl: `https://picsum.photos/800/600?random=${roomId}-${idx}`, displayOrder: idx });

          rooms.push(rr);
        }

        // bulk insert embeddings (one SQL per chunk)
        if (embeddingRows.length) {
          const rowsSql = embeddingRows.map((e) => ` (gen_random_uuid(), '${e.roomId}', '${e.rawText}', '[${e.embedding.join(',')}]'::vector, 'gemini-text-embedding-004', NOW())`).join(',');
          await prisma.$executeRawUnsafe(`INSERT INTO room_embedding (id, room_id, raw_text, embedding, embedding_model, last_updated) VALUES ${rowsSql}`);

          // save embedding metadata for reproducibility
          const { saveEmbeddingMetadata } = await import('./utils.js');
          const metaEntries = embeddingRows.map((e, idx) => ({ roomId: e.roomId, seed, counter: vectorCounter - embeddingRows.length + idx }));
          saveEmbeddingMetadata(metaEntries);
        }

        // createMany amenities & images
        if (amenityInserts.length) await prisma.roomAmenity.createMany({ data: amenityInserts });
        if (imageInserts.length) await prisma.roomImage.createMany({ data: imageInserts });
      }
    }
  }

  return rooms;
}
