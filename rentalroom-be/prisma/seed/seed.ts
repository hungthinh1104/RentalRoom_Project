import { PrismaClient, UserRole, PropertyType, RoomStatus, AmenityType, ApplicationStatus, ContractStatus, ServiceType, BillingMethod, PaymentMethod, PaymentStatus, ItemType, MaintenanceCategory, MaintenancePriority, MaintenanceStatus, NotificationType, InvoiceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { fakerVI as faker } from '@faker-js/faker';
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
const nodeRequire = createRequire(__filename);

const prisma = new PrismaClient();

// ---------- CLI options & deterministic seed ----------
const args = process.argv.slice(2);
const seedArg = args.find((a) => a.startsWith('--seed='))?.split('=')[1];
const SEED = seedArg ? Number(seedArg) : Number(process.env.SEED) || 12345;
const DRY_RUN = args.includes('--dry-run') || process.env.DRY_RUN === '1';
// Explicit clean flag: only clean when `--clean` is provided (safer default)
const CLEAN = args.includes('--clean') || process.env.CLEAN === '1';
// Confirm clean: require --confirm-clean when actually cleaning non-dry runs
const CONFIRM_CLEAN = args.includes('--confirm-clean') || process.env.CONFIRM_CLEAN === '1';

// Seed faker for deterministic data
faker.seed(SEED);
console.log(`🔁 Seed: ${SEED} — DRY_RUN: ${DRY_RUN ? 'yes' : 'no'} — CLEAN: ${CLEAN ? 'yes' : 'no'} — CONFIRM_CLEAN: ${CONFIRM_CLEAN ? 'yes' : 'no'}`);

// Lightweight seeded RNG (mulberry32)
function mulberry32(a: number) {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let _rng = mulberry32(SEED);
let _vectorCounter = 0; // to make each vector generation unique but deterministic
function rng() { return _rng(); }


// ============================================================================
// VIETNAMESE DATA CONSTANTS
// ============================================================================

// Load wards from FE data (keeps post-2025 updates centralized)
const WARDS_FILE = path.resolve(process.cwd(), '../rentalroom-fe/public/data/wards.json');
let ALL_WARDS: Array<{ code: string; name: string; fullName: string; slug: string; type: string; provinceCode: string }> = [];

try {
  if (fs.existsSync(WARDS_FILE)) {
    ALL_WARDS = JSON.parse(fs.readFileSync(WARDS_FILE, 'utf8'));
  } else {
    console.warn(`⚠️ Wards file not found at ${WARDS_FILE}. Using fallback cities.`);
  }
} catch (e) {
  console.warn('⚠️ Could not load wards.json, falling back to limited set');
}

const CITY_PROVINCE_CODES: Record<string, string> = {
  'Hồ Chí Minh': '30',
  'Hà Nội': '01',
  'Đà Nẵng': '12',
};

function getWardsForCity(cityName: keyof typeof CITY_PROVINCE_CODES) {
  if (ALL_WARDS.length === 0) {
    if (cityName === 'Hồ Chí Minh') return ['Bến Nghé', 'Bến Thành', 'Đa Kao', 'Tân Định', 'Thảo Điền'];
    if (cityName === 'Hà Nội') return ['Phúc Xá', 'Trúc Bạch', 'Quán Thánh', 'Thành Công', 'Láng Hạ'];
    if (cityName === 'Đà Nẵng') return ['Hải Châu 1', 'Hải Châu 2', 'Thạch Thang', 'Thuận Phước'];
    return [];
  }
  const code = CITY_PROVINCE_CODES[cityName];
  return ALL_WARDS.filter((w) => w.provinceCode === code && w.type === 'ward').map((w) => w.name);
}

const WARDS_BY_CITY: Record<string, string[]> = {
  'Hồ Chí Minh': getWardsForCity('Hồ Chí Minh'),
  'Hà Nội': getWardsForCity('Hà Nội'),
  'Đà Nẵng': getWardsForCity('Đà Nẵng'),
};

// Load street lists (editable in prisma/seed/addresses.json)
const ADDR_FILE = path.resolve(process.cwd(), 'prisma/seed/addresses.json');
let STREET_BY_CITY: Record<string, string[]> = {};
try {
  if (fs.existsSync(ADDR_FILE)) {
    STREET_BY_CITY = JSON.parse(fs.readFileSync(ADDR_FILE, 'utf8'));
  }
} catch (e) {
  console.warn('⚠️ Could not load prisma/seed/addresses.json, falling back to faker streets');
}

function getRandomAddress(city: string, ward: string) {
  const streets = STREET_BY_CITY[city] || [];
  const street = streets.length ? faker.helpers.arrayElement(streets) : `${faker.location.streetAddress()}`;
  const number = faker.number.int({ min: 1, max: 999 });
  return `${number} ${street}, ${ward}, ${city}`;
}

const PROPERTY_NAMES = [
  'Nhà trọ Ánh Dương', 'Chung cư mini Hòa Bình', 'Phòng trọ Thanh Xuân',
  'Nhà trọ Mỹ Đình', 'Căn hộ Green House', 'Phòng trọ Sinh Viên',
  'Chung cư mini Sky View', 'Nhà trọ Phú Quý', 'Homestay Sài Gòn',
  'Phòng trọ An Nhiên', 'Nhà trọ Vạn Phúc', 'Căn hộ Bình Minh'
];

const AMENITIES_DESCRIPTIONS = [
  'Máy lạnh', 'Wifi', 'Chỗ để xe', 'Gác lửng', 'Tự do giờ giấc',
  'Ban công', 'Cửa sổ', 'Nhà vệ sinh riêng', 'Bếp riêng', 'Giường',
  'Tủ lạnh', 'Máy giặt', 'Nóng lạnh', 'Camera an ninh', 'Thang máy'
];

const ROOM_DESCRIPTIONS_TEMPLATES = [
  'Phòng trọ đầy đủ tiện nghi, khu vực an ninh, gần chợ, trường học',
  'Căn hộ mini hiện đại, thoáng mát, view đẹp, yên tĩnh',
  'Phòng cho thuê giá rẻ, sinh viên ưu tiên, gần trường đại học',
  'Chung cư mini cao cấp, đầy đủ nội thất, bảo vệ 24/7',
  'Homestay ấm cúng, chủ nhà thân thiện, gần trung tâm',
  'Phòng trọ giá sinh viên, có gác lửng, ban công thoáng',
  'Căn hộ dịch vụ, sạch sẽ, tiện ích đầy đủ, an ninh tốt'
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate random 768-dimensional vector for pgvector
 */
function generateRandomVector(dimensions: number = 768): number[] {
  // use seeded RNG and advance vector counter to vary sequence across calls
  const localRng = mulberry32(SEED + _vectorCounter++);
  return Array.from({ length: dimensions }, () => localRng() * 2 - 1);
}

/**
 * Generate realistic Vietnamese room description with embedding text
 */
function generateRoomDescription(propertyName: string, ward: string, city: string, price: number): {
  description: string;
  rawText: string;
} {
  const template = faker.helpers.arrayElement(ROOM_DESCRIPTIONS_TEMPLATES);
  const amenitiesSample = faker.helpers.arrayElements(AMENITIES_DESCRIPTIONS, 4);

  const description = `${template}. Tiện ích: ${amenitiesSample.join(', ')}. Liên hệ ngay để xem phòng!`;

  // Raw text for vector embedding (what AI will search)
  const rawText = `${propertyName} ${ward} ${city} ${description} Giá ${price.toLocaleString('vi-VN')} VNĐ/tháng Diện tích ${faker.number.int({ min: 15, max: 40 })}m2`;

  return { description, rawText };
}

/**
 * Pick random enum value
 */
function randomEnum<T extends Record<string, string>>(enumObj: T): T[keyof T] {
  const values = Object.values(enumObj) as T[keyof T][];
  return faker.helpers.arrayElement(values);
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  console.log('🌱 Starting database seeding with Vietnamese data...\n');

  // Clean database (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  if (!CLEAN) {
    console.log("⚠️ Skipping clean step (no --clean provided). Use --clean to erase existing data before seeding.");
  } else if (DRY_RUN) {
    console.log('⚠️ DRY RUN: would perform deleteMany operations (use --clean to enable actual clean)');
  } else if (!CONFIRM_CLEAN) {
    console.error('❗ --clean requires --confirm-clean when not running with --dry-run. Aborting to avoid accidental data loss.');
    process.exit(1);
  } else {
    await prisma.aiInteractionLog.deleteMany().catch(e => console.warn('Skipped aiInteractionLog'));
    await prisma.webhookFailure.deleteMany().catch(e => console.warn('Skipped webhookFailure'));
    await prisma.roomEmbedding.deleteMany();
    await prisma.tenantAiProfile.deleteMany();
    await prisma.searchCache.deleteMany();
    await prisma.popularSearch.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.invoiceLineItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.maintenanceRequest.deleteMany();
    await prisma.roomReview.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.rentalApplication.deleteMany();
    await prisma.roomAmenity.deleteMany();
    await prisma.roomImage.deleteMany();
    await prisma.room.deleteMany();
    await prisma.service.deleteMany();
    await prisma.property.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.landlord.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Database cleaned\n');
  }

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // ============================================================================
  // 1. CREATE USERS (10 users: 5 landlords, 4 tenants, 1 admin)
  // ============================================================================
  console.log('👤 Creating users...');

  const adminUser = DRY_RUN ? {
    id: faker.string.uuid(),
    fullName: 'Admin Hệ Thống',
    email: 'admin@rentalroom.vn',
    passwordHash: hashedPassword,
    phoneNumber: '0900000000',
    role: UserRole.ADMIN,
    emailVerified: true,
  } as any : await prisma.user.create({
    data: {
      fullName: 'Admin Hệ Thống',
      email: 'admin@rentalroom.vn',
      passwordHash: hashedPassword,
      phoneNumber: '0900000000',
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });
  console.log(`✅ Created Admin: ${adminUser.fullName}`);

  // Create 5 Landlords
  const landlords: any[] = [];
  for (let i = 1; i <= 5; i++) {
    const fullName = faker.person.fullName();
    const user = DRY_RUN ? {
      id: faker.string.uuid(),
      fullName,
      email: `landlord${i}@example.com`,
      passwordHash: hashedPassword,
      phoneNumber: `090${String(i).padStart(7, '0')}`,
      role: UserRole.LANDLORD,
      emailVerified: i <= 3,
    } as any : await prisma.user.create({
      data: {
        fullName,
        email: `landlord${i}@example.com`,
        passwordHash: hashedPassword,
        phoneNumber: `090${String(i).padStart(7, '0')}`,
        role: UserRole.LANDLORD,
        emailVerified: i <= 3, // First 3 verified
      },
    });

    const landlord = DRY_RUN ? {
      id: faker.string.uuid(),
      userId: (user as any).id,
      citizenId: faker.string.numeric(12),
      bankAccount: faker.string.numeric(14),
      bankName: faker.helpers.arrayElement(['Vietcombank', 'Techcombank', 'VietinBank', 'BIDV', 'ACB']),
      address: faker.location.streetAddress(true),
      verified: i <= 3,
      rating: i <= 3 ? parseFloat(faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 }).toFixed(1)) : null,
    } as any : await prisma.landlord.create({
      data: {
        userId: user.id,
        citizenId: faker.string.numeric(12),
        bankAccount: faker.string.numeric(14),
        bankName: faker.helpers.arrayElement(['Vietcombank', 'Techcombank', 'VietinBank', 'BIDV', 'ACB']),
        address: faker.location.streetAddress(true),
        verified: i <= 3,
        rating: i <= 3 ? parseFloat(faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 }).toFixed(1)) : null,
      },
    });

    landlords.push({ user, landlord });
    console.log(`✅ Created Landlord ${i}: ${fullName}`);
  }

  // Create 4 Tenants
  const tenants: any[] = [];
  for (let i = 1; i <= 4; i++) {
    const fullName = faker.person.fullName();
    const user = DRY_RUN ? {
      id: faker.string.uuid(),
      fullName,
      email: `tenant${i}@example.com`,
      passwordHash: hashedPassword,
      phoneNumber: `091${String(i).padStart(7, '0')}`,
      role: UserRole.TENANT,
      emailVerified: true,
    } as any : await prisma.user.create({
      data: {
        fullName,
        email: `tenant${i}@example.com`,
        passwordHash: hashedPassword,
        phoneNumber: `091${String(i).padStart(7, '0')}`,
        role: UserRole.TENANT,
        emailVerified: true,
      },
    });

    const tenant = DRY_RUN ? {
      id: faker.string.uuid(),
      userId: (user as any).id,
      dateOfBirth: faker.date.birthdate({ min: 18, max: 40, mode: 'age' }),
      citizenId: faker.string.numeric(12),
      emergencyContact: `092${String(i).padStart(7, '0')}`,
      budgetMin: 2000000,
      budgetMax: faker.number.int({ min: 5000000, max: 15000000 }),
      preferredLocation: faker.helpers.arrayElement(WARDS_BY_CITY['Hồ Chí Minh']),
      employmentStatus: faker.helpers.arrayElement(['Sinh viên', 'Nhân viên văn phòng', 'Tự do', 'Kinh doanh']),
    } as any : await prisma.tenant.create({
      data: {
        userId: user.id,
        dateOfBirth: faker.date.birthdate({ min: 18, max: 40, mode: 'age' }),
        citizenId: faker.string.numeric(12),
        emergencyContact: `092${String(i).padStart(7, '0')}`,
        budgetMin: 2000000,
        budgetMax: faker.number.int({ min: 5000000, max: 15000000 }),
        preferredLocation: faker.helpers.arrayElement([...WARDS_BY_CITY['Hồ Chí Minh'], ...WARDS_BY_CITY['Hà Nội'], ...WARDS_BY_CITY['Đà Nẵng']]),
        employmentStatus: faker.helpers.arrayElement(['Sinh viên', 'Nhân viên văn phòng', 'Tự do', 'Kinh doanh']),
      },
    });

    // Create AI Profile for tenant
    if (DRY_RUN) {
      // mock tenant AI profile
    } else {
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
    console.log(`✅ Created Tenant ${i}: ${fullName}`);
  }

  console.log(`\n📊 Total Users: ${1 + landlords.length + tenants.length}\n`);

  // ============================================================================
  // 2. CREATE PROPERTIES (Each landlord has 2-3 properties)
  // ============================================================================
  console.log('🏢 Creating properties...');

  const properties: any[] = [];
  for (const { landlord } of landlords) {
    const propertyCount = faker.number.int({ min: 2, max: 3 });

    for (let i = 0; i < propertyCount; i++) {
      const city = faker.helpers.arrayElement(Object.keys(WARDS_BY_CITY) as Array<'Hồ Chí Minh' | 'Hà Nội' | 'Đà Nẵng'>);
      const ward = faker.helpers.arrayElement(WARDS_BY_CITY[city]);
      const baseName = faker.helpers.arrayElement(PROPERTY_NAMES);
      const address = getRandomAddress(city, ward);
      const property = DRY_RUN ? ({
        id: faker.string.uuid(),
        landlordId: landlord.userId,
        name: `${baseName} - ${i + 1} - ${String((landlord as any).userId || '').slice(0, 6)}`,
        address,
        city,
        ward,
        propertyType: randomEnum(PropertyType),
      } as any) : await prisma.property.create({
        data: {
          landlordId: landlord.userId,
          name: `${baseName} - ${i + 1} - ${landlord.userId.slice(0, 6)}`,
          address,
          city,
          ward,
          propertyType: randomEnum(PropertyType),
        },
      });

      // Create services for property
      if (!DRY_RUN) {
        await prisma.service.createMany({
          data: [
            {
              propertyId: property.id,
              serviceName: 'Điện',
              serviceType: ServiceType.ELECTRICITY,
              billingMethod: BillingMethod.METERED,
              unitPrice: 3500,
              unit: 'kWh',
            },
            {
              propertyId: property.id,
              serviceName: 'Nước',
              serviceType: ServiceType.WATER,
              billingMethod: BillingMethod.METERED,
              unitPrice: 15000,
              unit: 'm³',
            },
            {
              propertyId: property.id,
              serviceName: 'Internet',
              serviceType: ServiceType.INTERNET,
              billingMethod: BillingMethod.FIXED,
              unitPrice: 100000,
              unit: 'tháng',
            },
          ],
        });

        properties.push(property);
        console.log(`  ✅ Created Property: ${property.name} (${property.ward})`);
      }
    }
  }

  console.log(`\n📊 Total Properties: ${properties.length}\n`);

  // ============================================================================
  // 3. CREATE ROOMS (Each property has 3-8 rooms)
  // ============================================================================
  console.log('🚪 Creating rooms with embeddings...');

  const rooms: any[] = [];
  for (const property of properties) {
    const roomCount = faker.number.int({ min: 3, max: 8 });

    for (let i = 1; i <= roomCount; i++) {
      const price = faker.number.int({ min: 2000000, max: 15000000, multipleOf: 100000 });
      const { description, rawText } = generateRoomDescription(property.name, property.ward, property.city, price);
      const status = faker.helpers.weightedArrayElement([
        { value: RoomStatus.AVAILABLE, weight: 6 },
        { value: RoomStatus.OCCUPIED, weight: 3 },
        { value: RoomStatus.MAINTENANCE, weight: 1 },
      ]);

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

      const room = DRY_RUN ? ({ id: faker.string.uuid(), ...roomData } as any) : await prisma.room.create({ data: roomData });

      // Create room embedding (IMPORTANT for AI search)
      const vectorEmbedding = generateRandomVector(768);
      if (!DRY_RUN) {
        await prisma.$executeRaw`
        INSERT INTO room_embedding (id, room_id, raw_text, embedding, embedding_model, last_updated)
        VALUES (
          gen_random_uuid(),
          ${room.id}::uuid,
          ${rawText},
          ${`[${vectorEmbedding.join(',')}]`}::vector,
          'gemini-text-embedding-004',
          NOW()
        )
      `;
      }

      // Add amenities
      const amenityTypes = faker.helpers.arrayElements(
        Object.values(AmenityType),
        faker.number.int({ min: 2, max: 4 })
      );
      if (!DRY_RUN) {
        await prisma.roomAmenity.createMany({
          data: amenityTypes.map((type) => ({
            roomId: room.id,
            amenityType: type,
            quantity: 1,
          })),
        });
      }

      // Add images
      if (!DRY_RUN) {
        await prisma.roomImage.createMany({
          data: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, (_, idx) => ({
            roomId: room.id,
            imageUrl: `https://picsum.photos/800/600?random=${room.id}-${idx}`,
            displayOrder: idx,
          })),
        });
      }

      rooms.push(room);
    }
    console.log(`  ✅ Created ${roomCount} rooms for ${property.name}`);
  }

  console.log(`\n📊 Total Rooms: ${rooms.length}\n`);

  // ============================================================================
  // 4. CREATE RENTAL APPLICATIONS & CONTRACTS
  // ============================================================================
  console.log('📝 Creating applications and contracts...');

  const occupiedRooms = rooms.filter((r) => r.status === RoomStatus.OCCUPIED);
  const contracts: any[] = [];

  for (let i = 0; i < Math.min(occupiedRooms.length, tenants.length); i++) {
    const room = occupiedRooms[i];
    const tenant = tenants[i % tenants.length];
    const property = properties.find((p) => p.id === room.propertyId);

    if (!property) continue;

    // Create application
    const application = DRY_RUN ? ({
      id: faker.string.uuid(),
    } as any) : await prisma.rentalApplication.create({
      data: {
        roomId: room.id,
        tenantId: tenant.tenant.userId,
        landlordId: property.landlordId,
        applicationDate: faker.date.past({ years: 1 }),
        status: ApplicationStatus.APPROVED,
        requestedMoveInDate: faker.date.soon({ days: 14 }),
        message: 'Tôi rất quan tâm đến phòng này. Mong được thuê ạ!',
        reviewedAt: faker.date.recent({ days: 3 }),
      },
    });

    // Create contract
    const startDate = faker.date.recent({ days: 30 });
    const contract = DRY_RUN ? ({
      id: faker.string.uuid(),
      tenantId: tenant.tenant.userId,
      monthlyRent: room.pricePerMonth,
    } as any) : await prisma.contract.create({
      data: {
        applicationId: application.id,
        roomId: room.id,
        tenantId: tenant.tenant.userId,
        landlordId: property.landlordId,
        contractNumber: `HD-${faker.string.numeric(8)}`,
        startDate,
        endDate: new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
        monthlyRent: room.pricePerMonth,
        deposit: room.deposit,
        status: ContractStatus.ACTIVE,
        signedAt: faker.date.recent({ days: 5 }),
      },
    });

    contracts.push(contract);
    console.log(`  ✅ Created Contract for Room ${room.roomNumber}`);
  }

  console.log(`\n📊 Total Contracts: ${contracts.length}\n`);

  // ============================================================================
  // 5. CREATE INVOICES & PAYMENTS
  // ============================================================================
  console.log('💰 Creating invoices and payments...');

  for (const contract of contracts) {
    if (DRY_RUN) continue;
    // Create 3 invoices (past 3 months)
    for (let month = 0; month < 3; month++) {
      const issueDate = new Date();
      issueDate.setMonth(issueDate.getMonth() - month);

      const extraCharges = faker.number.float({ min: 100000, max: 500000, fractionDigits: 2 });
      const totalAmount = Number(contract.monthlyRent) + extraCharges;

      const invoice = await prisma.invoice.create({
        data: {
          contractId: contract.id,
          tenantId: contract.tenantId,
          invoiceNumber: `INV-${faker.string.numeric(10)}`,
          issueDate,
          dueDate: new Date(issueDate.getTime() + 5 * 24 * 60 * 60 * 1000),
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          status: month === 0 ? InvoiceStatus.PENDING : InvoiceStatus.PAID,
          paidAt: month === 0 ? null : faker.date.recent({ days: 10 }),
        },
      });

      // Create payment if invoice is paid
      if (invoice.status === InvoiceStatus.PAID) {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            tenantId: contract.tenantId,
            amount: invoice.totalAmount,
            paymentMethod: randomEnum(PaymentMethod),
            paymentDate: faker.date.recent({ days: 10 }),
            status: PaymentStatus.COMPLETED,
            paidAt: faker.date.recent({ days: 10 }),
          },
        });
      }
    }
  }

  console.log(`✅ Created invoices and payments\n`);

  // ============================================================================
  // 6. CREATE POPULAR SEARCHES (for market insights)
  // ============================================================================
  console.log('🔍 Creating popular searches...');

  const searchQueries = [
    `phòng trọ ${faker.helpers.arrayElement(WARDS_BY_CITY['Hồ Chí Minh'])}`,
    `phòng trọ ${faker.helpers.arrayElement(WARDS_BY_CITY['Hà Nội'])}`,
    `phòng trọ ${faker.helpers.arrayElement(WARDS_BY_CITY['Đà Nẵng'])}`,
    'chung cư mini giá rẻ',
    'căn hộ gần trường đại học',
    'phòng trọ sinh viên',
  ];

  for (const query of searchQueries) {
    if (DRY_RUN) continue;
    await prisma.popularSearch.create({
      data: {
        query,
        searchCount: faker.number.int({ min: 10, max: 500 }),
        lastSearched: faker.date.recent({ days: 7 }),
      },
    });
  }

  console.log(`✅ Created ${searchQueries.length} popular searches\n`);

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log('🎉 Database seeding completed!\n');
  console.log('📊 Summary:');
  console.log(`   - Users: ${1 + landlords.length + tenants.length}`);
  console.log(`   - Landlords: ${landlords.length}`);
  console.log(`   - Tenants: ${tenants.length}`);
  console.log(`   - Properties: ${properties.length}`);
  console.log(`   - Rooms: ${rooms.length}`);
  console.log(`   - Contracts: ${contracts.length}`);
  console.log(`   - Vector Embeddings: ${rooms.length} (768 dimensions each)\n`);

  console.log('🔑 Test Accounts:');
  console.log('   Admin: admin@rentalroom.vn / password123');
  console.log('   Landlord: landlord1@example.com / password123');
  console.log('   Tenant: tenant1@example.com / password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
