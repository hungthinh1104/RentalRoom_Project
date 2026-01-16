import { PrismaClient, ContractType, TemplateStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const templatesDir = path.join(process.cwd(), 'src/templates/contracts');

  if (!fs.existsSync(templatesDir)) {
    console.log('Templates directory not found');
    return;
  }

  const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.hbs'));

  console.log(`Found ${files.length} templates to seed...`);

  for (const file of files) {
    const name = file.replace('.hbs', '');
    const content = fs.readFileSync(path.join(templatesDir, file), 'utf8');

    // Heuristic mapping
    let type: ContractType = 'RENTAL_AGREEMENT';
    if (name.includes('handover')) type = 'HANDOVER_CHECKLIST';
    if (name.includes('deposit')) type = 'DEPOSIT_RECEIPT';
    if (name.includes('service')) type = 'SERVICE_AGREEMENT';
    if (name.includes('liquidation')) type = 'LIQUIDATION_MINUTES';
    if (name.includes('pccc_app')) type = 'PCCC_APPLICATION';
    if (name.includes('pccc_check')) type = 'PCCC_CHECKLIST';

    // Check if exists
    const exists = await prisma.contractTemplate.findFirst({
      where: { name },
    });

    if (!exists) {
      await prisma.contractTemplate.create({
        data: {
          name,
          title: `Template ${name.toUpperCase()}`,
          content,
          type,
          version: 1,
          status: 'REVIEWED', // Production Ready: REVIEWED default
          isActive: false, // Manual activation required
          isDefault: false,
          legalDisclaimer:
            'Mẫu tham khảo, không thay thế xác nhận chính thức Cảnh sát PCCC',
          description:
            'Migrated from File System. Requires Review & Activation.',
        },
      });
      console.log(`[SEEDED] ${name} as ${type} (REVIEWED)`);
    } else {
      console.log(`[SKIPPED] ${name} already exists`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
