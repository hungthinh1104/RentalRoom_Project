
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const id = 'fdd47240-0aa5-428d-ba70-0d4c4cc716f1'; // The draft contract ID
    const contract = await prisma.contract.findUnique({
        where: { id },
        include: {
            tenant: { include: { user: true } },
            landlord: { include: { user: true } },
            room: { include: { property: true } },
            residents: true,
        },
    });

    console.log('--- RAW DB DATA ---');
    console.log(JSON.stringify(contract, null, 2));

    if (contract?.room?.property) {
        console.log('\n--- PROPERTY CHECK ---');
        console.log('Property Type:', contract.room.property.propertyType);
        console.log('Address:', contract.room.property.address);
    } else {
        console.log('\n--- PROPERTY MISSING ---');
    }

    if (contract?.deposit) {
        console.log('\n--- DEPOSIT CHECK ---');
        console.log('Deposit Original:', contract.deposit);
        console.log('Deposit Type:', typeof contract.deposit);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
