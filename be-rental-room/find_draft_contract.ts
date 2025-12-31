
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const contract = await prisma.contract.findFirst({
        where: { status: 'DRAFT' },
        select: { id: true, contractNumber: true }
    });
    console.log('Draft Contract:', contract);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
