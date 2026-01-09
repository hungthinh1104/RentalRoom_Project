import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { formatDate } from 'date-fns';

/**
 * ContractTemplateService
 * - Generate PDF từ HTML templates + dữ liệu
 * - Hỗ trợ các loại hợp đồng khác nhau (Thuê trọ, Hợp đồng dịch vụ, v.v.)
 */
@Injectable()
export class ContractTemplateService {
  private readonly logger = new Logger(ContractTemplateService.name);
  private readonly templatesDir = path.join(
    process.cwd(),
    'src/templates/contracts',
  );
  private browser: puppeteer.Browser;

  async onModuleInit() {
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
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Generate PDF từ HTML + Template
   */
  async generateContractPDF(
    templateName: string,
    data: Record<string, any>,
  ): Promise<Buffer> {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templateName}`);
      }

      // 1. Load template HTML
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateContent);

      // 2. Compile dữ liệu vào template
      const html = template(data);

      // 3. Dùng Puppeteer render HTML sang PDF
      const page = await this.browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      await page.close();

      this.logger.log(`Contract PDF generated: ${templateName}`);
      return Buffer.from(pdfBuffer);
    } catch (error: unknown) {
      const msg = (error as Error)?.message ?? String(error);
      this.logger.error(`Failed to generate PDF: ${msg}`);
      throw new Error(msg);
    }
  }

  /**
   * Danh sách template có sẵn
   */
  getAvailableTemplates(): string[] {
    if (!fs.existsSync(this.templatesDir)) {
      return [];
    }

    return fs
      .readdirSync(this.templatesDir)
      .filter((f) => f.endsWith('.hbs'))
      .map((f) => f.replace('.hbs', ''));
  }

  /**
   * Register Handlebars Helpers (cho formatting)
   */
  registerHelpers() {
    handlebars.registerHelper('formatDate', (date: Date, format: string) => {
      return formatDate(new Date(date), format);
    });

    handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);
    });

    handlebars.registerHelper('uppercase', (str: string) => {
      return str?.toUpperCase() || '';
    });

    handlebars.registerHelper('capitalize', (str: string) => {
      return str?.charAt(0).toUpperCase() + str?.slice(1) || '';
    });
  }
}
