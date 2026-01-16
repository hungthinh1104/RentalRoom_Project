import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { fakerVI as faker } from '@faker-js/faker';
import { WARDS_BY_CITY, pickRandomWardFromCities } from './utils';

export type SeedOptions = { DRY_RUN: boolean };

export async function seedUsers(prisma: PrismaClient, opts: SeedOptions) {
  const { DRY_RUN } = opts;
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Admin (idempotent upsert)
  let adminUser: any;
  if (DRY_RUN) {
    adminUser = { id: faker.string.uuid(), fullName: 'Admin Hệ Thống', email: 'admin@rentalroom.vn', passwordHash: hashedPassword, phoneNumber: '0900000000', role: UserRole.ADMIN, emailVerified: true };
  } else {
    adminUser = await prisma.user.upsert({ where: { email: 'admin@rentalroom.vn' }, update: { fullName: 'Admin Hệ Thống', passwordHash: hashedPassword, phoneNumber: '0900000000', role: UserRole.ADMIN, emailVerified: true }, create: { fullName: 'Admin Hệ Thống', email: 'admin@rentalroom.vn', passwordHash: hashedPassword, phoneNumber: '0900000000', role: UserRole.ADMIN, emailVerified: true } });
  }

  const landlords: any[] = [];
  for (let i = 1; i <= 5; i++) {
    const fullName = faker.person.fullName();
    const email = `landlord${i}@example.com`;
    const user = DRY_RUN ? ({
      id: faker.string.uuid(), fullName, email, passwordHash: hashedPassword, phoneNumber: `090${String(i).padStart(7,'0')}`, role: UserRole.LANDLORD, emailVerified: i <= 3,
    } as any) : await prisma.user.upsert({
      where: { email },
      update: { fullName, passwordHash: hashedPassword, phoneNumber: `090${String(i).padStart(7,'0')}`, role: UserRole.LANDLORD, emailVerified: i <= 3 },
      create: { fullName, email, passwordHash: hashedPassword, phoneNumber: `090${String(i).padStart(7,'0')}`, role: UserRole.LANDLORD, emailVerified: i <= 3 },
    });

    const landlordData = {
      userId: user.id,
      citizenId: faker.string.numeric(12),
      bankAccount: faker.string.numeric(14),
      bankName: faker.helpers.arrayElement(['Vietcombank','Techcombank','VietinBank','BIDV','ACB']),
      address: faker.location.streetAddress(true),
      verified: i <= 3,
      rating: i <= 3 ? parseFloat(faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 }).toFixed(1)) : null,
    };

    const landlord = DRY_RUN ? ({ id: faker.string.uuid(), ...landlordData } as any) : await prisma.landlord.upsert({
      where: { userId: user.id },
      update: landlordData,
      create: landlordData,
    });

    landlords.push({ user, landlord });
  }

  const tenants: any[] = [];
  for (let i = 1; i <= 4; i++) {
    const fullName = faker.person.fullName();
    const temail = `tenant${i}@example.com`;
    const user = DRY_RUN ? ({ id: faker.string.uuid(), fullName, email: temail, passwordHash: hashedPassword, phoneNumber: `091${String(i).padStart(7, '0')}`, role: UserRole.TENANT, emailVerified: true, } as any) : await prisma.user.upsert({
      where: { email: temail },
      update: { fullName, passwordHash: hashedPassword, phoneNumber: `091${String(i).padStart(7, '0')}`, role: UserRole.TENANT, emailVerified: true },
      create: { fullName, email: temail, passwordHash: hashedPassword, phoneNumber: `091${String(i).padStart(7, '0')}`, role: UserRole.TENANT, emailVerified: true },
    });

    const tenant = DRY_RUN ? ({ id: faker.string.uuid(), userId: (user as any).id, dateOfBirth: faker.date.birthdate({ min: 18, max: 40, mode: 'age' }), citizenId: faker.string.numeric(12), emergencyContact: `092${String(i).padStart(7,'0')}`, budgetMin: 2000000, budgetMax: faker.number.int({ min:5000000, max:15000000 }), preferredLocation: pickRandomWardFromCities(['Hồ Chí Minh','Hà Nội','Đà Nẵng']), employmentStatus: faker.helpers.arrayElement(['Sinh viên','Nhân viên văn phòng','Tự do','Kinh doanh']), } as any) : await prisma.tenant.create({
      data: {
        userId: user.id,
        dateOfBirth: faker.date.birthdate({ min: 18, max: 40, mode: 'age' }),
        citizenId: faker.string.numeric(12),
        emergencyContact: `092${String(i).padStart(7, '0')}`,
        budgetMin: 2000000,
        budgetMax: faker.number.int({ min: 5000000, max: 15000000 }),
        preferredLocation: pickRandomWardFromCities(['Hồ Chí Minh','Hà Nội','Đà Nẵng']),
        employmentStatus: faker.helpers.arrayElement(['Sinh viên','Nhân viên văn phòng','Tự do','Kinh doanh']),
      },
    });

    if (!DRY_RUN) {
      await prisma.tenantAiProfile.create({
        data: {
          tenantId: tenant.userId,
          searchHistory: [
            'phòng trọ quận 1',
            'chung cư mini giá rẻ',
            'căn hộ gần trường đại học',
          ],
          searchCount: faker.number.int({ min: 5, max: 50 }),
          lastSearched: faker.date.recent({ days: 7 }),
        },
      });
    }

    tenants.push({ user, tenant });
  }

  return { adminUser, landlords, tenants };
}
