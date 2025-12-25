import { PrismaClient, UserRole, PropertyType, RoomStatus, AmenityType, ApplicationStatus, ContractStatus, ServiceType, BillingMethod, PaymentMethod, PaymentStatus, InvoiceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { fakerVI as faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// CLI options
const args = process.argv.slice(2);
const seedArg = args.find((a) => a.startsWith('--seed='))?.split('=')[1];
const SEED = seedArg ? Number(seedArg) : 12345;
const DRY_RUN = args.includes('--dry-run');
const CLEAN = args.includes('--clean');
const CONFIRM_CLEAN = args.includes('--confirm-clean');

faker.seed(SEED);
console.log(`🔁 Seed: ${SEED} — DRY_RUN: ${DRY_RUN ? 'yes' : 'no'} — CLEAN: ${CLEAN ? 'yes' : 'no'}`);

// Vietnamese data
const WARDS_BY_CITY: Record<string, string[]> = {
  'Hồ Chí Minh': ['Bến Nghé', 'Bến Thành', 'Cầu Ông Lãnh', 'Cô Giang', 'Đa Kao', 'Nguyễn Cư Trinh', 'Nguyễn Thái Bình', 'Phạm Ngũ Lão', 'Tân Định'],
  'Hà Nội': ['Phúc Xá', 'Trúc Bạch', 'Vĩnh Phúc', 'Cống Vị', 'Liễu Giai', 'Nguyễn Trung Trực', 'Quán Thánh', 'Thành Công', 'Đội Cấn'],
  'Đà Nẵng': ['Thạch Thang', 'Hòa Cường Bắc', 'Hòa Cường Nam', 'Hòa Thuận Tây', 'Hòa Thuận Đông', 'Hòa Khê', 'Hòa Minh', 'Hòa An'],
};

const PROPERTY_NAMES = ['Chung cư mini Hòa Bình', 'Nhà trọ Vạn Phúc', 'Phòng trọ Thanh Xuân', 'Homestay Sài Gòn', 'Chung cư mini Sky View', 'Nhà trọ Mỹ Đình'];

function generateRandomVector(dim: number): number[] {
  return Array.from({ length: dim }, () => Math.random());
}

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clean database
  if (CLEAN && CONFIRM_CLEAN && !DRY_RUN) {
    console.log('🧹 Cleaning database...');
    await prisma.aiInteractionLog.deleteMany();
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

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. CREATE USERS
  console.log('👤 Creating users...');
  
  const adminUser = await prisma.user.create({
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
    const user = await prisma.user.create({
      data: {
        fullName,
        email: `landlord${i}@example.com`,
        passwordHash: hashedPassword,
        phoneNumber: `090${String(i).padStart(7, '0')}`,
        role: UserRole.LANDLORD,
        emailVerified: i <= 3,
      },
    });

    const landlord = await prisma.landlord.create({
      data: {
        userId: user.id,
        citizenId: faker.string.numeric(12),
        bankAccount: faker.string.numeric(14),
        bankName: faker.helpers.arrayElement(['Vietcombank', 'Techcombank', 'VietinBank']),
        address: faker.location.streetAddress(true),
        verified: i <= 3,
        rating: i <= 3 ? parseFloat(faker.number.float({ min: 4.0, max: 5.0 }).toFixed(1)) : null,
      },
    });

    landlords.push({ user, landlord });
    console.log(`✅ Created Landlord ${i}: ${fullName}`);
  }

  // Create 4 Tenants
  const tenants: any[] = [];
  for (let i = 1; i <= 4; i++) {
    const fullName = faker.person.fullName();
    const user = await prisma.user.create({
      data: {
        fullName,
        email: `tenant${i}@example.com`,
        passwordHash: hashedPassword,
        phoneNumber: `091${String(i).padStart(7, '0')}`,
        role: UserRole.TENANT,
        emailVerified: true,
      },
    });

    const tenant = await prisma.tenant.create({
      data: {
        userId: user.id,
        dateOfBirth: faker.date.birthdate({ min: 18, max: 40, mode: 'age' }),
        citizenId: faker.string.numeric(12),
        emergencyContact: `092${String(i).padStart(7, '0')}`,
        budgetMin: 2000000,
        budgetMax: faker.number.int({ min: 5000000, max: 15000000 }),
        preferredLocation: faker.helpers.arrayElement(WARDS_BY_CITY['Hồ Chí Minh']),
        employmentStatus: faker.helpers.arrayElement(['Sinh viên', 'Nhân viên văn phòng']),
      },
    });

    await prisma.tenantAiProfile.create({
      data: {
        tenantId: tenant.userId,
        searchHistory: ['phòng trọ quận 1', 'chung cư mini giá rẻ'],
        searchCount: faker.number.int({ min: 5, max: 50 }),
        lastSearched: faker.date.recent({ days: 7 }),
      },
    });

    tenants.push({ user, tenant });
    console.log(`✅ Created Tenant ${i}: ${fullName}`);
  }

  console.log(`\n📊 Total Users: ${1 + landlords.length + tenants.length}\n`);

  // 2. CREATE PROPERTIES
  console.log('🏢 Creating properties...');
  
  const properties: any[] = [];
  for (const { landlord } of landlords) {
    const propertyCount = faker.number.int({ min: 2, max: 3 });
    
    for (let i = 0; i < propertyCount; i++) {
      const city = faker.helpers.arrayElement(Object.keys(WARDS_BY_CITY));
      const ward = faker.helpers.arrayElement(WARDS_BY_CITY[city]);
      
      const property = await prisma.property.create({
        data: {
          landlordId: landlord.userId,
          name: `${faker.helpers.arrayElement(PROPERTY_NAMES)} ${i + 1}`,
          address: `${faker.number.int({ min: 1, max: 500 })} ${faker.location.street()}`,
          city,
          ward,
          propertyType: faker.helpers.arrayElement(Object.values(PropertyType)),
          description: 'Phòng trọ đầy đủ tiện nghi, gần trường học, siêu thị',
        },
      });

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
        ],
      });

      properties.push(property);
      console.log(`  ✅ Created Property: ${property.name} (${property.ward})`);
    }
  }

  console.log(`\n📊 Total Properties: ${properties.length}\n`);

  // 3. CREATE ROOMS
  console.log('🚪 Creating rooms...');
  
  const rooms: any[] = [];
  let globalRoomCounter = 1;
  
  for (const property of properties) {
    const roomCount = faker.number.int({ min: 3, max: 8 });
    
    for (let i = 1; i <= roomCount; i++) {
      const price = faker.number.int({ min: 2000000, max: 15000000, multipleOf: 100000 });
      const status = faker.helpers.weightedArrayElement([
        { value: RoomStatus.AVAILABLE, weight: 6 },
        { value: RoomStatus.OCCUPIED, weight: 3 },
        { value: RoomStatus.MAINTENANCE, weight: 1 },
      ]);

      const roomNumber = `R${String(globalRoomCounter++).padStart(3, '0')}`;
      
      const room = await prisma.room.create({
        data: {
          propertyId: property.id,
          roomNumber,
          area: faker.number.float({ min: 15, max: 45, fractionDigits: 1 }),
          pricePerMonth: price,
          deposit: price * 2,
          status,
          description: 'Phòng sạch sẽ, thoáng mát',
          maxOccupants: faker.number.int({ min: 1, max: 3 }),
        },
      });

      // Create room embedding
      const vectorEmbedding = generateRandomVector(768);
      const rawText = `${property.name} ${property.ward} ${property.city} Giá ${price} VNĐ`;
      
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

      // Add amenities
      const amenityTypes = faker.helpers.arrayElements(Object.values(AmenityType), faker.number.int({ min: 2, max: 4 }));
      await prisma.roomAmenity.createMany({
        data: amenityTypes.map((type) => ({
          roomId: room.id,
          amenityType: type,
          quantity: 1,
        })),
      });

      // Add images
      await prisma.roomImage.createMany({
        data: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, (_, idx) => ({
          roomId: room.id,
          imageUrl: `https://picsum.photos/800/600?random=${room.id}-${idx}`,
          displayOrder: idx,
        })),
      });

      rooms.push(room);
    }
    
    console.log(`  ✅ Created ${roomCount} rooms for ${property.name}`);
  }

  console.log(`\n📊 Total Rooms: ${rooms.length}\n`);

  // 4. CREATE CONTRACTS
  console.log('📝 Creating contracts...');
  
  const occupiedRooms = rooms.filter((r) => r.status === RoomStatus.OCCUPIED);
  const contracts: any[] = [];
  
  for (let i = 0; i < Math.min(occupiedRooms.length, tenants.length); i++) {
    const room = occupiedRooms[i];
    const tenant = tenants[i % tenants.length];
    const property = properties.find((p) => p.id === room.propertyId);
    
    if (!property) continue;

    const application = await prisma.rentalApplication.create({
      data: {
        roomId: room.id,
        tenantId: tenant.tenant.userId,
        landlordId: property.landlordId,
        applicationDate: faker.date.past({ years: 1 }),
        status: ApplicationStatus.APPROVED,
        requestedMoveInDate: faker.date.soon({ days: 14 }),
        message: 'Tôi rất quan tâm đến phòng này!',
        reviewedAt: faker.date.recent({ days: 3 }),
      },
    });

    const startDate = faker.date.recent({ days: 30 });
    const contract = await prisma.contract.create({
      data: {
        applicationId: application.id,
        roomId: room.id,
        tenantId: tenant.tenant.userId,
        landlordId: property.landlordId,
        contractNumber: `HD-${faker.string.numeric(8)}`,
        startDate,
        endDate: new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000),
        monthlyRent: room.pricePerMonth,
        depositAmount: room.deposit,
        status: ContractStatus.ACTIVE,
        signedAt: faker.date.recent({ days: 5 }),
      },
    });

    contracts.push(contract);
    console.log(`  ✅ Created Contract for Room ${room.roomNumber}`);
  }

  console.log(`\n📊 Total Contracts: ${contracts.length}\n`);

  // 5. CREATE INVOICES
  console.log('💰 Creating invoices...');
  
  for (const contract of contracts) {
    for (let month = 0; month < 3; month++) {
      const issueDate = new Date();
      issueDate.setMonth(issueDate.getMonth() - month);
      
      const totalAmount = Number(contract.monthlyRent) + faker.number.float({ min: 100000, max: 500000 });
      
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

      if (invoice.status === InvoiceStatus.PAID) {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            tenantId: contract.tenantId,
            amount: invoice.totalAmount,
            paymentMethod: faker.helpers.arrayElement(Object.values(PaymentMethod)),
            paymentDate: faker.date.recent({ days: 10 }),
            status: PaymentStatus.COMPLETED,
            paidAt: faker.date.recent({ days: 10 }),
          },
        });
      }
    }
  }

  console.log('✅ Created invoices and payments\n');

  // 6. CREATE POPULAR SEARCHES
  console.log('🔍 Creating popular searches...');
  
  const searchQueries = [
    `phòng trọ ${faker.helpers.arrayElement(WARDS_BY_CITY['Hồ Chí Minh'])}`,
    `phòng trọ ${faker.helpers.arrayElement(WARDS_BY_CITY['Hà Nội'])}`,
    'chung cư mini giá rẻ',
    'căn hộ gần trường đại học',
    'phòng trọ sinh viên',
  ];

  for (const query of searchQueries) {
    await prisma.popularSearch.create({
      data: {
        query,
        searchCount: faker.number.int({ min: 10, max: 500 }),
        lastSearched: faker.date.recent({ days: 7 }),
      },
    });
  }

  console.log(`✅ Created ${searchQueries.length} popular searches\n`);

  // SUMMARY
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
