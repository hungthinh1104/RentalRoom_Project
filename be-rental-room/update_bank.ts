
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const contract = await prisma.contract.findFirst({
        where: { id: "a1e7d27c-e6e9-4046-8e23-48f8974a037b" },
        include: { landlord: true }
    });

    if (!contract) {
        console.log("Contract not found");
        return;
    }

    console.log("Found contract:", contract.contractNumber);

    // FIX wrong paymentRef (Double HD prefix issue: HDHD...)
    // const correctRef = "HD" + contract.contractNumber.replace(/-/g, ""); // This was the bug
    const correctRef = contract.contractNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    await prisma.contract.update({
        where: { id: contract.id },
        data: { paymentRef: correctRef }
    });
    console.log(`Fixed paymentRef: ${contract.paymentRef} -> ${correctRef}`);
    console.log('Current Landlord Bank:', contract.landlord.bankName, contract.landlord.bankAccount);

    // Update Landlord Bank Info
    // Use userId because Landlord PK is userId
    const updatedLandlord = await prisma.landlord.update({
        where: { userId: contract.landlordId },
        data: {
            bankName: 'MBBank',
            bankAccount: '0369613751' // User provided
        }
    });

    console.log('Updated Landlord Bank:', updatedLandlord.bankName, updatedLandlord.bankAccount);

    // Also enable/create payment config if missing (to ensure SePay API works)
    // PaymentConfig has accountNumber, not bankAccount
    const apiToken = process.env.SEPAY_API_TOKEN || 'dummy-token';

    const paymentConfig = await prisma.paymentConfig.upsert({
        where: { landlordId: contract.landlordId },
        update: {
            isActive: true,
            bankName: 'MBBank',
            accountNumber: '0369613751',
            apiToken: apiToken
        },
        create: {
            landlordId: contract.landlordId,
            isActive: true,
            bankName: 'MBBank',
            accountNumber: '0369613751',
            apiToken: apiToken
        }
    });
    console.log('Payment Config updated/created', paymentConfig);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
