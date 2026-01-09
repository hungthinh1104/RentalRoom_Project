import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

/**
 * Service responsible for generating a PDF representation of a contract.
 * Uses pdf-lib to create a simple PDF with contract details and QR code.
 */
@Injectable()
export class ContractPdfService {
  private readonly logger = new Logger(ContractPdfService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a PDF buffer for the given contract ID.
   * Throws NotFoundException if contract does not exist.
   * Returns a Buffer containing the PDF data.
   */
  async generatePdf(
    contractId: string,
    requesterUserId: string,
  ): Promise<Buffer> {
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

    // Authorization: only tenant, landlord, or admin can access
    const user = await this.prisma.user.findUnique({
      where: { id: requesterUserId },
    });
    if (!user) {
      throw new BadRequestException('Invalid requester');
    }
    const isTenant = contract.tenant?.userId === requesterUserId;
    const isLandlord = contract.landlord?.userId === requesterUserId;
    const isAdmin = user.role === 'ADMIN';
    if (!isTenant && !isLandlord && !isAdmin) {
      throw new BadRequestException(
        'You are not authorized to generate this PDF',
      );
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();

    // Register fontkit to support custom fonts
    pdfDoc.registerFontkit(fontkit);

    // Fetch font that supports Vietnamese (Roboto)
    const fontUrl =
      'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto-Regular.ttf';
    const fontBytes = await fetch(fontUrl).then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch font: ${res.statusText}`);
      return res.arrayBuffer();
    });
    const font = await pdfDoc.embedFont(fontBytes);

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
        font,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
    };

    drawText(`Hợp đồng số: ${contract.contractNumber}`);
    drawText(`Ngày bắt đầu: ${contract.startDate.toISOString().split('T')[0]}`);
    drawText(`Ngày kết thúc: ${contract.endDate.toISOString().split('T')[0]}`);
    drawText(`Phòng: ${contract.room?.roomNumber || ''}`);
    drawText(`Chủ nhà: ${contract.landlord?.user?.fullName || ''}`);
    drawText(`Người thuê: ${contract.tenant?.user?.fullName || ''}`);
    drawText(`Tiền thuê hàng tháng: ${contract.monthlyRent.toString()}`);
    drawText(`Tiền cọc: ${contract.deposit.toString()}`);
    drawText(`Điều khoản: ${contract.terms?.substring(0, 200) || ''}`);

    // Add QR code image if SePay QR URL is available
    if (contract.landlord?.bankName && contract.landlord?.bankAccount) {
      const qrUrl = `https://qr.sepay.vn/img?bank=${encodeURIComponent(contract.landlord.bankName)}&acc=${encodeURIComponent(contract.landlord.bankAccount)}&amount=${contract.deposit.toString()}&des=${encodeURIComponent(`COC ${contract.contractNumber}`)}`;
      try {
        const response = await fetch(qrUrl);
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
      }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
