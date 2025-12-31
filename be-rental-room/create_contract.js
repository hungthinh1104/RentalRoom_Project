const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Find Users
    const tenant = await prisma.user.findUnique({ where: { email: 'tenant1@example.com' } });
    const landlord = await prisma.user.findUnique({ where: { email: 'landlord1@example.com' } });

    if (!tenant || !landlord) {
        console.error('Tenant or Landlord not found');
        return;
    }

    // 2. Find Room owned by Landlord
    // First find property
    const property = await prisma.property.findFirst({
        where: { landlordId: landlord.id },
        include: { rooms: true }
    });

    if (!property || property.rooms.length === 0) {
        console.error('No rooms found for landlord');
        return;
    }

    const room = property.rooms[0];

    // 3. Create Application (Required for Contract)
    const application = await prisma.rentalApplication.create({
        data: {
            roomId: room.id,
            tenantId: tenant.id,
            landlordId: landlord.id,
            status: 'APPROVED',
            message: 'Sample application',
            requestedMoveInDate: new Date()
        }
    });

    // 4. Create Contract
    const contract = await prisma.contract.create({
        data: {
            contractNumber: 'HD-' + Date.now(),
            applicationId: application.id,
            roomId: room.id,
            tenantId: tenant.id,
            landlordId: landlord.id,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            monthlyRent: room.pricePerMonth,
            deposit: room.deposit,
            status: 'PENDING_SIGNATURE',
            paymentDay: 5,
            terms: 'Sample terms for UI testing.',
            depositDeadline: new Date(new Date().setDate(new Date().getDate() + 3)),
            paymentRef: 'SEPAY-' + Date.now()
        }
    });

    console.log('Created Contract:', contract.id);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
