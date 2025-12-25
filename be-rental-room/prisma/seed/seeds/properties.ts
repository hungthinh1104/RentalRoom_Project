import { PrismaClient, ServiceType, BillingMethod, PropertyType } from '@prisma/client';
import { fakerVI as faker } from '@faker-js/faker';
import { getRandomAddress, WARDS_BY_CITY } from './utils';
import type { SeedOptions } from './users';

export async function seedProperties(prisma: PrismaClient, landlords: any[], opts: SeedOptions) {
  const { DRY_RUN } = opts;
  const properties: any[] = [];

  for (const { landlord } of landlords) {
    const propertyCount = faker.number.int({ min: 2, max: 3 });
    for (let i = 0; i < propertyCount; i++) {
      const city = faker.helpers.arrayElement(Object.keys(WARDS_BY_CITY) as Array<'Hồ Chí Minh'|'Hà Nội'|'Đà Nẵng'>);
      const ward = faker.helpers.arrayElement(WARDS_BY_CITY[city]);
      const baseName = faker.helpers.arrayElement(['Nhà trọ Ánh Dương','Chung cư mini Hòa Bình','Phòng trọ Thanh Xuân','Nhà trọ Mỹ Đình','Căn hộ Green House']);
      const address = getRandomAddress(city, ward);

      const propName = `${baseName} - ${i + 1} - ${String((landlord as any).userId || '').slice(0, 6)}`;
      if (DRY_RUN) {
        var property = ({ id: faker.string.uuid(), landlordId: landlord.userId, name: propName, address, city, ward, propertyType: faker.helpers.arrayElement(Object.values(PropertyType)), } as any);
      } else {
        // idempotent: find existing by landlordId + name, update if found
        const existing = await prisma.property.findFirst({ where: { landlordId: landlord.userId, name: propName } });
        if (existing) {
          // attempt geocode and append coords to description when available
          let coords: { lat: number; lon: number } | null = null;
          if (process.env.GEOCODE === '1') {
            coords = await (await import('./utils.js')).geocodeAddress(address);
            if (coords) console.log(`    ⤷ Geocoded: ${address} -> ${coords.lat.toFixed(6)},${coords.lon.toFixed(6)}`);
          }
          const desc = coords ? `Lat:${coords.lat.toFixed(6)} Lon:${coords.lon.toFixed(6)}` : undefined;
          property = await prisma.property.update({ where: { id: existing.id }, data: { address, city, ward, propertyType: faker.helpers.arrayElement(Object.values(PropertyType)), ...(desc ? { description: desc } : {}) } });
        } else {
          let coords: { lat: number; lon: number } | null = null;
          if (process.env.GEOCODE === '1') {
            coords = await (await import('./utils.js')).geocodeAddress(address);
            if (coords) console.log(`    ⤷ Geocoded: ${address} -> ${coords.lat.toFixed(6)},${coords.lon.toFixed(6)}`);
          }
          const desc = coords ? `Lat:${coords.lat.toFixed(6)} Lon:${coords.lon.toFixed(6)}` : undefined;
          property = await prisma.property.create({ data: { landlordId: landlord.userId, name: propName, address, city, ward, propertyType: faker.helpers.arrayElement(Object.values(PropertyType)), ...(desc ? { description: desc } : {}) } });
        }
      }

      if (!DRY_RUN) {
        await prisma.service.createMany({
          data: [
            { propertyId: property.id, serviceName: 'Điện', serviceType: ServiceType.ELECTRICITY, billingMethod: BillingMethod.METERED, unitPrice: 3500, unit: 'kWh' },
            { propertyId: property.id, serviceName: 'Nước', serviceType: ServiceType.WATER, billingMethod: BillingMethod.METERED, unitPrice: 15000, unit: 'm³' },
            { propertyId: property.id, serviceName: 'Internet', serviceType: ServiceType.INTERNET, billingMethod: BillingMethod.FIXED, unitPrice: 100000, unit: 'tháng' },
          ],
        });
      }

      properties.push(property);
    }
  }

  return properties;
}
