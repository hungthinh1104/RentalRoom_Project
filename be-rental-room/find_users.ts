
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { role: 'LANDLORD' },
        select: { id: true, email: true, role: true, fullName: true }
    });
    console.log('Landlord User:', user);

    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true, email: true, role: true, fullName: true }
    });
    console.log('Admin User:', admin);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
