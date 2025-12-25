import { PrismaClient } from '@prisma/client';
import { fakerVI as faker } from '@faker-js/faker';
import { WARDS_BY_CITY } from './utils';
import type { SeedOptions } from './users';

export async function seedPopularSearches(prisma: PrismaClient, opts: SeedOptions) {
  const { DRY_RUN } = opts;
  const searchQueries = [
    `phòng trọ ${faker.helpers.arrayElement(WARDS_BY_CITY['Hồ Chí Minh'])}`,
    `phòng trọ ${faker.helpers.arrayElement(WARDS_BY_CITY['Hà Nội'])}`,
    `phòng trọ ${faker.helpers.arrayElement(WARDS_BY_CITY['Đà Nẵng'])}`,
    'chung cư mini giá rẻ',
    'căn hộ gần trường đại học',
    `phòng trọ ${faker.helpers.arrayElement(WARDS_BY_CITY['Hồ Chí Minh'])} giá rẻ`,
    `phòng trọ ${faker.helpers.arrayElement(WARDS_BY_CITY['Hà Nội'])} cho sinh viên`,
    `phòng cho thuê ${faker.helpers.arrayElement(WARDS_BY_CITY['Đà Nẵng'])} có gác lửng`,
  ];

  for (const query of searchQueries) {
    if (DRY_RUN) {
      console.log(`⚠️ DRY RUN: would create popularSearch for '${query}'`);
    } else {
      // upsert by unique query; use createMany with skipDuplicates for batch behavior
      await prisma.popularSearch.createMany({ data: [{ query, searchCount: faker.number.int({ min: 10, max: 500 }), lastSearched: faker.date.recent({ days: 7 }) }], skipDuplicates: true });
    }
  }

  return searchQueries;
}
