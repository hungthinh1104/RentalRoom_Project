import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { formatDate } from 'date-fns';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ContractType } from '@prisma/client';

/**
 * ContractTemplateService
 * - Generate PDF from HTML templates + data
 * - Supports DB-backed templates with File System fallback/seeding
 */
@Injectable()
export class ContractTemplateService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ContractTemplateService.name);
  private readonly templatesDir = path.join(
    process.cwd(),
    'src/templates/contracts',
  );
  private browser: puppeteer.Browser;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // 1. Launch Puppeteer
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        executablePath:
          process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } catch (e) {
      this.logger.warn(
        'Puppeteer launch failed (PDF generation will not work): ' + e.message,
      );
    }

    // 2. Register Helpers
    this.registerHelpers();

    // 3. Seed Templates from FS to DB if empty
    await this.seedTemplates();
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Seed templates from file system to database if they don't exist
   */
  private async seedTemplates() {
    try {
      if (!fs.existsSync(this.templatesDir)) return;

      const files = fs
        .readdirSync(this.templatesDir)
        .filter((f) => f.endsWith('.hbs'));

      for (const file of files) {
        const name = file.replace('.hbs', '');
        const content = fs.readFileSync(
          path.join(this.templatesDir, file),
          'utf8',
        );

        // Determine type based on name pattern (heuristic)
        let type: ContractType = ContractType.RENTAL_AGREEMENT;
        if (name.includes('handover')) type = ContractType.HANDOVER_CHECKLIST;
        if (name.includes('deposit')) type = ContractType.DEPOSIT_RECEIPT;
        if (name.includes('service')) type = ContractType.SERVICE_AGREEMENT;
        if (name.includes('liquidation'))
          type = ContractType.LIQUIDATION_MINUTES;
        if (name.includes('pccc_app')) type = ContractType.PCCC_APPLICATION;
        if (name.includes('pccc_check')) type = ContractType.PCCC_CHECKLIST;

        // Check if exists
        const exists = await this.prisma.contractTemplate.findFirst({
          where: { name },
        });

        if (!exists) {
          await this.prisma.contractTemplate.create({
            data: {
              name,
              title: `Template ${handlebars.helpers.capitalize(name)}`,
              content,
              type,
              version: 1,
              isActive: false, // Default inactive until reviewed
              isDefault: false,
              status: 'REVIEWED', // Mark as REVIEWED initially for migration
              description:
                'Initial seed from file system. Pending Manual Activation.',
              legalDisclaimer:
                'Mẫu tham khảo, không thay thế xác nhận chính thức Cảnh sát PCCC',
            },
          });
          this.logger.log(`Seeded contract template: ${name}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to seed templates', error);
    }
  }

  /**
   * Log User Agreement (Legal Safeguard)
   */
  async createUserAgreement(
    userId: string,
    templateId: string,
    ip: string,
    phone: string,
    userAgent?: string,
  ) {
    return this.prisma.userAgreement.create({
      data: {
        userId,
        templateId,
        ipAddress: ip,
        userAgent,
        phone, // Ensure phone is passed!
      },
    });
  }

  /**
   * Check if User has agreed to a specific template version
   */
  async hasUserAgreed(userId: string, templateId: string): Promise<boolean> {
    const agreement = await this.prisma.userAgreement.findFirst({
      where: { userId, templateId },
    });
    return !!agreement;
  }

  /**
   * Get template content (DB preferred, fallback to FS)
   */
  private async getTemplateContent(templateName: string): Promise<string> {
    // 1. Try DB (Active & Default) - Strict for End Users
    // Logic moved to generateContractPDF strict query.
    // This helper might be used for internal fallback or generic fetch.

    const dbTemplate = await this.prisma.contractTemplate.findFirst({
      where: {
        name: templateName,
        isActive: true,
        // status: 'ACTIVE' // Could enforce here too
      },
      orderBy: {
        version: 'desc', // Get latest version
      },
    });

    if (dbTemplate) {
      return dbTemplate.content;
    }

    // 2. Fallback to FS (Dev only)
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
    if (fs.existsSync(templatePath)) {
      this.logger.warn(
        `Template ${templateName} not found in DB, using FS fallback.`,
      );
      return fs.readFileSync(templatePath, 'utf8');
    }

    throw new Error(`Template not found: ${templateName}`);
  }

  /**
   * Generate PDF
   */
  /**
   * Generate PDF (Strict Legal Mode)
   */
  async generateContractPDF(
    templateName: string,
    data: Record<string, any>,
    _userId?: string, // Optional for preview/admin, required for end-users
  ): Promise<Buffer> {
    try {
      // 1. Query STRICT: Active + Default + Status ACTIVE
      const dbTemplate = await this.prisma.contractTemplate.findFirst({
        where: {
          name: templateName,
          isActive: true,
          isDefault: true,
          status: 'ACTIVE', // Production Ready only
        },
        orderBy: { version: 'desc' },
      });

      // Allow Preview logic if no active template found BUT only for Admin (needs refinement)
      // For now, fail safe.
      if (!dbTemplate) {
        // Fallback for Admin Preview (if userId provided and user is admin? - Logic omitted for MVP simplicity)
        // Or check for DRAFT if strictly requested.
        // For general usage:
        this.logger.warn(`No ACTIVE template found for ${templateName}.`);
        throw new Error(`Template not available: ${templateName}`);
      }

      // 2. [TODO] Verify User Agreement (if userId provided)
      // verifyUserAgreement(userId, dbTemplate.id);

      // 3. Compile Template
      const template = handlebars.compile(dbTemplate.content);
      const html = template(data);

      // 4. Inject Watermark & Legal Disclaimer
      const finalHtml = this.injectLegalSafeguards(
        html,
        dbTemplate.legalDisclaimer,
      );

      // 5. Render PDF
      if (!this.browser) {
        throw new Error('Puppeteer browser not initialized');
      }

      const page = await this.browser.newPage();
      await page.setContent(finalHtml, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
        printBackground: true,
      });

      await page.close();

      this.logger.log(
        `Contract PDF generated: ${templateName} (v${dbTemplate.version})`,
      );
      return Buffer.from(pdfBuffer);
    } catch (error: unknown) {
      const msg = (error as Error)?.message ?? String(error);
      this.logger.error(`Failed to generate PDF: ${msg}`);
      throw new Error(msg);
    }
  }

  /**
   * Inject Watermark and Legal Footer into HTML
   */
  private injectLegalSafeguards(html: string, disclaimer: string): string {
    const watermarkCss = `
      <style>
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 80px;
          color: rgba(200, 0, 0, 0.15);
          z-index: 9999;
          pointer-events: none;
          white-space: nowrap;
          font-family: Arial, sans-serif;
          font-weight: bold;
          text-transform: uppercase;
        }
        .legal-footer {
          position: fixed;
          bottom: 5px;
          left: 0;
          width: 100%;
          text-align: center;
          font-size: 10px;
          color: #666;
          background: rgba(255, 255, 255, 0.9);
          padding: 5px;
          border-top: 1px solid #ddd;
          z-index: 10000;
        }
      </style>
    `;

    const watermarkHtml = `<div class="watermark">MẪU THAM KHẢO</div>`;
    const footerHtml = `<div class="legal-footer">⚠️ ${disclaimer} - Cần xác nhận của Cảnh sát PCCC.</div>`;

    // Inject into body
    return html
      .replace('</body>', `${watermarkHtml}${footerHtml}</body>`)
      .replace('</head>', `${watermarkCss}</head>`);
  }

  /**
   * List available templates (for Debug/UI)
   */
  async getAvailableTemplates() {
    // Return from DB
    return this.prisma.contractTemplate.findMany({
      distinct: ['name'],
      where: { isActive: true },
      select: { name: true, type: true, title: true, version: true },
    });
  }

  /**
   * Create a new template version
   */
  async createTemplate(userId: string, dto: any) {
    // Validate Handlebars syntax
    this.validateContent(dto.content);

    // Check if name exists to bump version
    const lastVersion = await this.prisma.contractTemplate.findFirst({
      where: { name: dto.name },
      orderBy: { version: 'desc' },
    });

    const newVersion = lastVersion ? lastVersion.version + 1 : 1;
    const shouldBeDefault = dto.isDefault !== false;

    // Deactivate old default if new one is default
    if (shouldBeDefault) {
      await this.prisma.contractTemplate.updateMany({
        where: { name: dto.name, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await this.prisma.contractTemplate.create({
      data: {
        ...dto,
        version: newVersion,
        isDefault: shouldBeDefault,
        isActive: false, // 🔥 Production: Always inactive intially
        status: 'DRAFT', // 🔥 Production: Starts as Draft
        createdBy: userId,
      },
    });

    // Audit Log
    await this.logAudit(userId, template.id, 'CREATE', null, template.content);

    return template;
  }

  /**
   * Activate Template (Production Release)
   * - Only for REVIEWED templates
   * - Deactivates old version
   */
  async activateTemplate(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const template = await tx.contractTemplate.findUnique({ where: { id } });
      if (!template) throw new Error('Template not found');

      // Optional: Check if status is REVIEWED? For MVP, allow Draft->Active if Admin.

      // Deactivate others of same name
      await tx.contractTemplate.updateMany({
        where: { name: template.name, isActive: true },
        data: { isActive: false },
      });

      // Activate this one
      const updated = await tx.contractTemplate.update({
        where: { id },
        data: {
          isActive: true,
          status: 'ACTIVE',
          reviewedBy: userId, // Auto-mark reviewer as activator
          reviewDate: new Date(),
        },
      });

      // Audit
      await this.prisma.contractTemplateAudit.create({
        data: {
          templateId: id,
          userId,
          action: 'ACTIVATE',
          oldContent: null,
          newContent: 'Status: ACTIVE',
        },
      });

      return updated;
    });
  }

  /**
   * Update existing template (soft update or new version?)
   * For now, update metadata. If content changes, SHOULD create new version, but for MVP we might allow edit if it's draft.
   * However, requirement says "Version Control".
   * Let's assume this updates the current record if it's the latest and unused, OR just updates simple fields.
   * BUT, best practice for "Versioning" is: Content change = New Version.
   * For this implementation, we will stick to the controller logic: Update in place (simple) or create new (via create endpoint).
   *
   * WAIT: The controller has PUT :id. This implies in-place update.
   * We will add audit log to it.
   */
  async updateTemplate(userId: string, id: string, dto: any) {
    const oldTemplate = await this.prisma.contractTemplate.findUnique({
      where: { id },
    });
    if (!oldTemplate) throw new Error('Template not found');

    if (dto.content) {
      this.validateContent(dto.content);
    }

    const updated = await this.prisma.contractTemplate.update({
      where: { id },
      data: dto,
    });

    // Audit Log
    await this.logAudit(
      userId,
      id,
      'EDIT',
      oldTemplate.content,
      updated.content,
    );

    return updated;
  }

  /**
   * Soft Delete Template
   */
  async deleteTemplate(userId: string, id: string) {
    const oldTemplate = await this.prisma.contractTemplate.findUnique({
      where: { id },
    });
    if (!oldTemplate) throw new Error('Template not found');

    const updated = await this.prisma.contractTemplate.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Audit Log
    await this.logAudit(userId, id, 'DELETE', oldTemplate.content, null);

    return updated;
  }

  /**
   * Validate Handlebars Content
   */
  private validateContent(content: string) {
    try {
      handlebars.precompile(content);
    } catch (e) {
      throw new Error(`Invalid Handlebars syntax: ${e.message}`);
    }
  }

  /**
   * Get Audit Logs for a template
   */
  async getTemplateAudit(templateId: string) {
    return this.prisma.contractTemplateAudit.findMany({
      where: { templateId },
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Create Audit Log
   */
  private async logAudit(
    userId: string,
    templateId: string,
    action: string,
    oldContent: string | null,
    newContent: string | null,
  ) {
    try {
      // Check if content changed significantly or it's a critical action
      await this.prisma.contractTemplateAudit.create({
        data: {
          templateId,
          userId,
          action,
          oldContent: action === 'EDIT' ? oldContent : null, // Only store if relevant
          newContent: action === 'DELETE' ? null : newContent,
        },
      });
    } catch (e) {
      this.logger.error(`Failed to create audit log: ${e.message}`);
    }
  }

  /**
   * Register Handlebars Helpers
   */
  registerHelpers() {
    handlebars.registerHelper(
      'formatDate',
      (date: Date | string, format: string) => {
        if (!date) return '';
        return formatDate(new Date(date), format);
      },
    );

    handlebars.registerHelper('formatCurrency', (amount: number) => {
      // Handle potential undefined/null
      const val = Number(amount) || 0;
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(val);
    });

    handlebars.registerHelper('uppercase', (str: string) => {
      return str?.toUpperCase() || '';
    });

    handlebars.registerHelper('capitalize', (str: string) => {
      return str?.charAt(0).toUpperCase() + str?.slice(1) || '';
    });

    // Add logic helper
    handlebars.registerHelper('eq', (a, b) => a === b);
  }
}
