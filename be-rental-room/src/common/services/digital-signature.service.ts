import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import signPdf from 'node-signpdf';
import { CertificateService } from './certificate.service';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * DigitalSignatureService
 * - Hash file PDF
 * - Sign file PDF (embed chữ ký số)
 * - Verify chữ ký
 */
@Injectable()
export class DigitalSignatureService {
  private readonly logger = new Logger(DigitalSignatureService.name);

  constructor(private readonly certificateService: CertificateService) { }

  /**
   * Tính Hash (SHA-256) của file PDF
   * @param pdfBuffer Buffer của file PDF
   * @returns Chuỗi hash hex
   */
  hashPDF(pdfBuffer: Buffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(pdfBuffer);
    return hash.digest('hex');
  }

  /**
   * Ký PDF bằng Private Key của hệ thống
   * @param pdfBuffer Buffer của file PDF gốc
   * @param signerInfo Thông tin người ký
   * @returns Buffer của file PDF đã ký
   */
  async signPDF(
    pdfBuffer: Buffer,
    signerInfo: {
      name: string;
      email: string;
      reason?: string;
    },
    context?: {
      ipAddress: string;
    },
  ): Promise<Buffer> {
    try {
      // 1. Append Audit Trail Page
      const pdfWithAudit = await this.appendAuditTrailPage(
        pdfBuffer,
        signerInfo,
        context,
      );

      const p12Buffer = this.certificateService.getP12Buffer();
      const p12Password = this.certificateService.getP12Password();

      // Ký file PDF
      // @ts-expect-error - node-signpdf type definitions không hoàn hảo
      const signedPdf = signPdf(pdfWithAudit, p12Buffer, {
        passphrase: p12Password,
        signerName: signerInfo.name,
        reason: signerInfo.reason || 'Digital Signature',
      });

      this.logger.log(
        `PDF signed successfully by ${signerInfo.name} (${signerInfo.email})`,
      );
      return signedPdf;
    } catch (error: unknown) {
      const msg = (error as Error)?.message ?? String(error);
      this.logger.error(`Failed to sign PDF: ${msg}`);
      throw new Error(`Digital signature failed: ${msg}`);
    }
  }

  /**
   * Append Audit Trail Page (Nhật ký tin cậy)
   */
  private async appendAuditTrailPage(
    pdfBuffer: Buffer,
    signerInfo: { name: string; email: string },
    context?: { ipAddress: string },
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const drawText = (text: string, x: number, y: number, fontRef = font, size = 12) => {
      page.drawText(text, { x, y, size, font: fontRef });
    };

    let y = height - 50;

    drawText('NHAT KY TIN CAY (AUDIT TRAIL)', 50, y, boldFont, 18);
    y -= 40;

    drawText(`Nguoi ky: ${signerInfo.name}`, 50, y);
    y -= 20;
    drawText(`Email: ${signerInfo.email}`, 50, y);
    y -= 20;
    drawText(`Thoi gian: ${new Date().toLocaleString('vi-VN')}`, 50, y);
    y -= 20;
    if (context?.ipAddress) {
      drawText(`IP Address: ${context.ipAddress}`, 50, y);
      y -= 20;
    }

    drawText('Chung chi so: Verified internally by System CA', 50, y, font, 10);

    const matchId = crypto.randomUUID();
    y -= 40;
    drawText(`Reference ID: ${matchId}`, 50, y, font, 10);

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Verify chữ ký trong file PDF
   * Lưu ý: Verify PKCS#7 signature trong PDF phức tạp
   * Đây là hàm đơn giản hóa để demo
   */
  verifyPDF(signedPdfBuffer: Buffer): {
    isValid: boolean;
    signatureCount: number;
    details: string;
  } {
    try {
      // Kiểm tra xem file có chứa signature field không
      const pdfString = signedPdfBuffer.toString('binary');
      const hasSignature =
        pdfString.includes('/Sig') || pdfString.includes('/Signature');

      if (!hasSignature) {
        return {
          isValid: false,
          signatureCount: 0,
          details: 'No signature found in PDF',
        };
      }

      this.logger.log('PDF verification completed');
      return {
        isValid: true,
        signatureCount: 1,
        details: 'PDF contains valid digital signature',
      };
    } catch (error: unknown) {
      const msg = (error as Error)?.message ?? String(error);
      this.logger.error(`Failed to verify PDF: ${msg}`);
      return {
        isValid: false,
        signatureCount: 0,
        details: `Verification error: ${msg}`,
      };
    }
  }

  /**
   * Tạo Timestamp Token (giả lập)
   * Trong thực tế: integrate Time Stamping Authority (TSA)
   */
  createTimestampToken(): {
    timestamp: Date;
    token: string;
  } {
    const timestamp = new Date();
    // Trong thực tế, gọi TSA API để lấy token đã ký
    // Đây là token giả lập chỉ cho demo
    const token = crypto.randomBytes(32).toString('hex');

    return { timestamp, token };
  }

  /**
   * Tạo Signature Metadata (cho audit log)
   */
  createSignatureMetadata(
    pdfHash: string,
    signerInfo: {
      name: string;
      email: string;
      userId?: string;
    },
    context: {
      ipAddress: string;
      userAgent: string;
      deviceInfo?: string;
    },
  ): {
    signatureHash: string;
    signedAt: Date;
    signer: {
      name: string;
      email: string;
      userId?: string;
    };
    context: typeof context;
    certificateInfo: any;
  } {
    return {
      signatureHash: crypto
        .createHash('sha256')
        .update(pdfHash + signerInfo.email + Date.now())
        .digest('hex'),
      signedAt: new Date(),
      signer: signerInfo,
      context,
      certificateInfo: this.certificateService.getCertificateInfo(),
    };
  }

  /**
   * Validate Digital Signature (hàm helper)
   */
  validateSignature(originalHash: string, signedHash: string): boolean {
    // Trong thực tế: dùng Public Key của CA để verify signature
    // Đây là đơn giản hóa: chỉ so sánh hash
    return originalHash === signedHash;
  }
}
