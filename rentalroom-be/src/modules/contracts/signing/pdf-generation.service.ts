import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Service responsible for generating a PDF representation of a contract.
 * Uses pdf-lib to create a PDF with contract details and QR code.
 *
 * NOTE: Authorization is handled by ContractPartyGuard in controller.
 * This service assumes the request is already authorized.
 */
@Injectable()
export class ContractPdfService {
  private readonly logger = new Logger(ContractPdfService.name);
  private fontCache: Buffer | null = null; // Cache font in memory
  private readonly fontPath = path.join(
    process.cwd(),
    'fonts',
    'Roboto-Regular.ttf',
  );

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Load font from local cache or file system
   * FIXED: Cache font in memory to avoid repeated downloads
   */
  private async loadFont(): Promise<Buffer> {
    // Return cached font if available
    if (this.fontCache) {
      return this.fontCache;
    }

    try {
      // Try to load from local file system first
      this.fontCache = fs.readFileSync(this.fontPath);
      this.logger.log('Font loaded from local file system');
      return this.fontCache;
    } catch (err) {
      this.logger.warn(
        `Failed to load font from ${this.fontPath}: ${(err as Error).message}. Falling back to default font.`,
      );
      // Return empty buffer - pdf-lib will use default font
      return Buffer.alloc(0);
    }
  }

  /**
   * Generate a PDF buffer for the given contract ID.
   * FIXED: Authorization is handled by ContractPartyGuard in controller.
   * Throws NotFoundException if contract does not exist.
   * Returns a Buffer containing the PDF data.
   */
  async generatePdf(
    contractId: string,
    requesterUserId: string,
  ): Promise<Buffer> {
    try {
      // Fetch contract with necessary relations
      const contract = await this.prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          tenant: { include: { user: true } },
          landlord: { include: { user: true } },
          room: true,
          residents: true,
        },
      });

      if (!contract) {
        throw new NotFoundException(`Contract with ID ${contractId} not found`);
      }

      // FIXED: Remove duplicate authorization
      // ContractPartyGuard in controller already verified this is allowed
      // Service assumes valid request

      // Create PDF
      const pdfDoc = await PDFDocument.create();

      // Register fontkit to support custom fonts
      pdfDoc.registerFontkit(fontkit);

      // FIXED: Load font from cache/local instead of GitHub
      const fontBytes = await this.loadFont();
      let font: any = null;
      if (fontBytes.length > 0) {
        font = await pdfDoc.embedFont(fontBytes);
      }

      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const fontSize = 12;
      const lineHeight = fontSize + 4;
      let y = height - 50;

      const drawText = (text: string) => {
        page.drawText(text, {
          x: 50,
          y,
          size: fontSize,
          font: font || undefined,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
      };

      // FIXED: Add watermark to indicate preview/non-legal
      page.drawText('Bản xem trước – Không có giá trị pháp lý', {
        x: 50,
        y: height - 30,
        size: 10,
        color: rgb(1, 0.5, 0.5), // Reddish color for warning
      });
      y -= lineHeight * 2;

      drawText(`Hợp đồng số: ${contract.contractNumber}`);
      drawText(
        `Ngày bắt đầu: ${contract.startDate.toISOString().split('T')[0]}`,
      );
      drawText(
        `Ngày kết thúc: ${contract.endDate.toISOString().split('T')[0]}`,
      );
      drawText(`Phòng: ${contract.room?.roomNumber || ''}`);
      drawText(`Chủ nhà: ${contract.landlord?.user?.fullName || ''}`);
      drawText(`Người thuê: ${contract.tenant?.user?.fullName || ''}`);
      drawText(`Tiền thuê hàng tháng: ${contract.monthlyRent.toString()}`);
      drawText(`Tiền cọc: ${contract.deposit.toString()}`);

      // FIXED: Don't hard-truncate terms - show note instead
      if (contract.terms) {
        drawText(`Điều khoản: (xem file hoàn chỉnh để chi tiết)`);
        drawText(contract.terms.substring(0, 200) + '...');
      }

      // Add QR code image if SePay QR URL is available
      if (contract.landlord?.bankName && contract.landlord?.bankAccount) {
        const qrUrl = `https://qr.sepay.vn/img?bank=${encodeURIComponent(contract.landlord.bankName)}&acc=${encodeURIComponent(contract.landlord.bankAccount)}&amount=${contract.deposit.toString()}&des=${encodeURIComponent(`COC ${contract.contractNumber}`)}`;
        try {
          // FIXED: Add timeout to QR fetch
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

          const response = await fetch(qrUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (response.ok) {
            const pngBytes = await response.arrayBuffer();
            const pngImage = await pdfDoc.embedPng(pngBytes);
            const pngDims = pngImage.scale(0.5);
            page.drawImage(pngImage, {
              x: width - pngDims.width - 50,
              y: height - pngDims.height - 50,
              width: pngDims.width,
              height: pngDims.height,
            });
          }
        } catch (e) {
          this.logger.warn(
            `Failed to embed QR code for contract ${contractId}: ${(e as Error).message}`,
          );
          // Continue without QR - non-blocking failure
        }
      }

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      // Preserve HTTP exceptions
      if (error instanceof NotFoundException) {
        throw error;
      }

      const msg = (error as Error)?.message ?? String(error);
      this.logger.error(
        `Failed to generate PDF for contract ${contractId}: ${msg}`,
      );
      throw new InternalServerErrorException(`Failed to generate PDF: ${msg}`);
    }
  }
}
