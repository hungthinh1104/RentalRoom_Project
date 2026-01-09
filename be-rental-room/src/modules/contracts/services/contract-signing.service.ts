import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { DigitalSignatureService } from 'src/common/services/digital-signature.service';
import { ContractTemplateService } from 'src/common/services/contract-template.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * ContractSigningService
 * - Quản lý quy trình ký hợp đồng (Tạo PDF → Hash → Sign → Embed → Lưu)
 * - Tạo audit log cho mọi thao tác
 * - Dùng để lưu trữ chữ ký số cho hợp đồng điện tử
 */
@Injectable()
export class ContractSigningService {
  private readonly logger = new Logger(ContractSigningService.name);
  // Make storagePath mutable so we can fallback to a safe tmp dir if needed
  private storagePath = path.join(process.cwd(), 'storage/contracts');

  constructor(
    private readonly prisma: PrismaService,
    private readonly digitalSignature: DigitalSignatureService,
    private readonly contractTemplate: ContractTemplateService,
  ) {
    this.ensureStorageDirectory();
  }

  private ensureStorageDirectory() {
    const tryEnsure = (dir: string): boolean => {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          this.logger.log(`Created storage directory: ${dir}`);
        }
        // Verify we can write
        fs.accessSync(dir, fs.constants.W_OK);
        return true;
      } catch {
        this.logger.warn(`Cannot create/access directory ${dir}`);
        return false;
      }
    };

    if (tryEnsure(this.storagePath)) return;

    // Fallback to system temp directory if project storage is not writable
    const fallback = path.join(os.tmpdir(), 'rental-room-storage', 'contracts');
    if (tryEnsure(fallback)) {
      this.logger.warn(
        `Falling back to temporary storage directory: ${fallback}`,
      );
      this.storagePath = fallback;
      return;
    }

    // If we still can't create a directory, log error and keep original path (operations will fail with clear errors)
    this.logger.error(
      `Failed to create storage directory at ${this.storagePath} and fallback ${fallback}. Contract storage operations will fail. Please create the directory and ensure write permission or configure CONTRACT_STORAGE_PATH.`,
    );
  }

  /**
   * Step 1: Generate PDF từ contract data
   */
  async generateContractPDF(
    contractId: string,
    templateName: string = 'rental-agreement',
  ) {
    try {
      const contract = await this.prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          application: {
            include: {
              tenant: { include: { user: true } },
              room: {
                include: {
                  property: {
                    include: {
                      landlord: { include: { user: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!contract) {
        throw new NotFoundException(`Contract ${contractId} not found`);
      }

      const tenantUser = contract.application.tenant.user;
      const landlordUser = contract.application.room.property.landlord.user;
      const room = contract.application.room;

      // Chuẩn bị dữ liệu cho template
      const templateData = {
        contractNumber: contract.contractNumber,
        generatedAt: new Date(),
        tenantName: tenantUser.fullName,
        tenantEmail: tenantUser.email,
        tenantPhone: tenantUser.phoneNumber || 'N/A',
        tenantCCCD: 'N/A',
        landlordName: landlordUser.fullName,
        landlordEmail: landlordUser.email,
        landlordPhone: landlordUser.phoneNumber || 'N/A',
        landlordCCCD: 'N/A',
        propertyAddress: room.property.address || 'N/A',
        propertyWard: room.property.ward || 'N/A',
        propertyCity: room.property.city || 'N/A',
        roomNumber: room.roomNumber || 'N/A',
        roomArea: room.area || 'N/A',
        startDate: contract.startDate,
        endDate: contract.endDate,
        monthlyRent: contract.monthlyRent.toString(),
        depositAmount: contract.deposit.toString(),
        utilityIncluded: 'Water, Electricity, Internet',
      };

      // Generate PDF
      const pdfBuffer = await this.contractTemplate.generateContractPDF(
        templateName,
        templateData,
      );

      // Lưu file gốc
      const originalFileName = `${contractId}-original.pdf`;
      const originalFilePath = path.join(this.storagePath, originalFileName);
      fs.writeFileSync(originalFilePath, pdfBuffer);

      // Update DB
      const pdfHash = this.digitalSignature.hashPDF(pdfBuffer);

      // Ensure storage writable before updating DB with file paths
      try {
        fs.accessSync(this.storagePath, fs.constants.W_OK);
      } catch {
        this.logger.error(`Storage path not writable: ${this.storagePath}`);
        throw new InternalServerErrorException('Storage path not writable');
      }

      await this.prisma.contract.update({
        where: { id: contractId },
        data: {
          pdfUrl: originalFilePath,
          pdfHash: pdfHash,
          signatureStatus: 'PENDING_SIGNATURE',
        },
      });

      this.logger.log(
        `Contract PDF generated: ${contractId}, Hash: ${pdfHash}`,
      );

      return {
        contractId,
        fileName: originalFileName,
        pdfHash,
        filePath: originalFilePath,
      };
    } catch (error) {
      const msg = (error as Error)?.message ?? String(error);
      this.logger.error(
        `Failed to generate PDF for contract ${contractId}: ${msg}`,
      );
      throw new Error(msg);
    }
  }

  /**
   * Step 2: Ký hợp đồng
   */
  async signContract(
    contractId: string,
    signerInfo: {
      name: string;
      email: string;
      userId: string;
      reason: string;
    },
    context: {
      ipAddress: string;
      userAgent: string;
      deviceInfo?: string;
    },
  ) {
    try {
      const contract = await this.prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        throw new NotFoundException(`Contract ${contractId} not found`);
      }

      if (!contract.pdfUrl) {
        throw new BadRequestException('Contract PDF has not been generated');
      }

      if (contract.signatureStatus === 'SIGNED') {
        throw new BadRequestException('Contract has already been signed');
      }

      const pdfBuffer = fs.readFileSync(contract.pdfUrl);
      const signedPdfBuffer = await this.digitalSignature.signPDF(
        pdfBuffer,
        signerInfo,
      );

      const signedFileName = `${contractId}-signed.pdf`;
      const signedFilePath = path.join(this.storagePath, signedFileName);

      // Ensure storage writable before writing signed file
      try {
        fs.accessSync(this.storagePath, fs.constants.W_OK);
      } catch {
        this.logger.error(`Storage path not writable: ${this.storagePath}`);
        throw new InternalServerErrorException('Storage path not writable');
      }

      fs.writeFileSync(signedFilePath, signedPdfBuffer);

      // Tạo metadata audit log
      const pdfHash =
        contract.pdfHash || this.digitalSignature.hashPDF(pdfBuffer);
      const metadata = this.digitalSignature.createSignatureMetadata(
        pdfHash,
        signerInfo,
        {
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          deviceInfo: context.deviceInfo,
        },
      );

      await this.prisma.contract.update({
        where: { id: contractId },
        data: {
          signedUrl: signedFilePath,
          signatureStatus: 'SIGNED',
          eSignatureUrl: signedFilePath,
        },
      });

      this.createAuditLog(contractId, {
        action: 'SIGN',
        signer: signerInfo.name,
        signerEmail: signerInfo.email,
        timestamp: new Date(),
        metadata,
      });

      this.logger.log(`Contract ${contractId} signed by ${signerInfo.name}`);

      return {
        contractId,
        fileName: signedFileName,
        filePath: signedFilePath,
      };
    } catch (error) {
      const msg = (error as Error)?.message ?? String(error);
      this.logger.error(`Failed to sign contract ${contractId}: ${msg}`);
      throw new Error(msg);
    }
  }

  /**
   * Step 3: Xác thực chữ ký
   */
  async verifyContract(contractId: string) {
    try {
      const contract = await this.prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract?.signedUrl) {
        throw new NotFoundException(
          `Signed PDF not found for contract ${contractId}`,
        );
      }

      const signedPdfBuffer = fs.readFileSync(contract.signedUrl);
      const verification = this.digitalSignature.verifyPDF(signedPdfBuffer);
      const isVerified = verification.isValid;

      if (isVerified) {
        await this.prisma.contract.update({
          where: { id: contractId },
          data: {
            signatureStatus: 'VERIFIED',
          },
        });

        this.createAuditLog(contractId, {
          action: 'VERIFY',
          signer: 'System',
          timestamp: new Date(),
          metadata: { verificationResult: verification },
        });
      }

      const verificationResult = {
        contractId,
        isVerified,
        signedUrl: contract.signedUrl,
      };

      this.logger.log(`Contract ${contractId} verified: ${isVerified}`);

      return verificationResult;
    } catch (error: unknown) {
      const msg = (error as Error)?.message ?? String(error);
      this.logger.error(`Failed to verify contract ${contractId}: ${msg}`);
      throw new Error(msg);
    }
  }

  /**
   * Download signed PDF
   */
  async downloadSignedPDF(
    contractId: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    try {
      const contract = await this.prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract?.signedUrl) {
        throw new BadRequestException('Signed PDF not available');
      }

      const buffer = fs.readFileSync(contract.signedUrl);
      return {
        buffer,
        fileName: `${contract.contractNumber}-signed.pdf`,
      };
    } catch (error) {
      const msg = (error as Error)?.message ?? String(error);
      this.logger.error(
        `Failed to download PDF for contract ${contractId}: ${msg}`,
      );
      throw new Error(msg);
    }
  }

  /**
   * Create audit log for signing operations
   */
  private createAuditLog(
    contractId: string,
    logData: {
      action: string;
      signer: string;
      signerEmail?: string;
      timestamp: Date;
      metadata?: any;
    },
  ) {
    try {
      this.logger.log(
        JSON.stringify({
          contractId,
          timestamp: logData.timestamp,
          action: logData.action,
          signer: logData.signer,
          email: logData.signerEmail || '',
          ...logData.metadata,
        }),
      );
    } catch (error) {
      const msg = (error as Error)?.message ?? String(error);
      this.logger.warn(`Failed to create audit log: ${msg}`);
    }
  }
}
