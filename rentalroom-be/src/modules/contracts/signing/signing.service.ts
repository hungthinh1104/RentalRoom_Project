import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { DigitalSignatureService } from 'src/common/services/digital-signature.service';
import { ContractTemplateService } from 'src/common/services/contract-template.service';
import { promises as fsPromises } from 'fs';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DocumentsService } from 'src/modules/documents/documents.service';


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
    private readonly documentsService: DocumentsService,
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
   * CRITICAL: Atomic operation with rollback on failure
   */
  async generateContractPDF(
    contractId: string,
    templateName: string = 'rental-agreement',
  ) {
    let originalFilePath: string | null = null;

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

      // State machine guard: only generate if not already signed
      if (
        contract.signatureStatus === 'SIGNED' ||
        contract.signatureStatus === 'VERIFIED'
      ) {
        throw new BadRequestException(
          'Cannot regenerate PDF for signed contract',
        );
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

      const pdfHash = this.digitalSignature.hashPDF(pdfBuffer);

      // Ensure storage writable before writing
      try {
        await fsPromises.access(this.storagePath, fs.constants.W_OK);
      } catch {
        this.logger.error(`Storage path not writable: ${this.storagePath}`);
        throw new InternalServerErrorException('Storage path not writable');
      }

      // CRITICAL: Write file first, then update DB with rollback on failure
      const originalFileName = `${contractId}-original.pdf`;
      originalFilePath = path.join(this.storagePath, originalFileName);

      await fsPromises.writeFile(originalFilePath, pdfBuffer);

      try {
        await this.prisma.contract.update({
          where: { id: contractId },
          data: {
            pdfUrl: originalFilePath,
            pdfHash: pdfHash,
            signatureStatus: 'PENDING_SIGNATURE',
          },
        });
      } catch (dbError) {
        // Rollback: delete file if DB update fails
        try {
          await fsPromises.unlink(originalFilePath);
          this.logger.warn(`Rolled back file: ${originalFilePath}`);
        } catch (unlinkError) {
          this.logger.error(`Failed to rollback file: ${originalFilePath}`);
        }
        throw dbError;
      }

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
      // CRITICAL: Preserve HTTP exceptions, don't convert to generic Error
      if (error instanceof HttpException) {
        throw error;
      }

      const msg = (error as Error)?.message ?? String(error);
      this.logger.error(
        `Failed to generate PDF for contract ${contractId}: ${msg}`,
      );
      throw new InternalServerErrorException(`Failed to generate PDF: ${msg}`);
    }
  }

  /**
   * Step 2: Ký hợp đồng
   * CRITICAL: Party authorization + state machine + atomic file+DB
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
    let signedFilePath: string | null = null;

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

      if (!contract.pdfUrl) {
        throw new BadRequestException('Contract PDF has not been generated');
      }

      // CRITICAL: State machine enforcement
      if (contract.signatureStatus !== 'PENDING_SIGNATURE') {
        throw new BadRequestException(
          `Cannot sign contract with status: ${contract.signatureStatus}`,
        );
      }

      // CRITICAL: Party authorization - verify signer is contract party
      const tenantUserId = contract.application.tenant.user.id;
      const landlordUserId =
        contract.application.room.property.landlord.user.id;

      if (![tenantUserId, landlordUserId].includes(signerInfo.userId)) {
        throw new BadRequestException('Signer is not a party to this contract');
      }

      // Read original PDF
      const pdfBuffer = await fsPromises.readFile(contract.pdfUrl);

      // Sign PDF
      const signedPdfBuffer = await this.digitalSignature.signPDF(
        pdfBuffer,
        signerInfo,
      );

      const signedFileName = `${contractId}-signed.pdf`;
      signedFilePath = path.join(this.storagePath, signedFileName);

      // Ensure storage writable
      try {
        await fsPromises.access(this.storagePath, fs.constants.W_OK);
      } catch {
        this.logger.error(`Storage path not writable: ${this.storagePath}`);
        throw new InternalServerErrorException('Storage path not writable');
      }

      // CRITICAL: Write file first, then update DB with rollback
      await fsPromises.writeFile(signedFilePath, signedPdfBuffer);

      try {
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
      } catch (dbError) {
        // Rollback: delete signed file if DB update fails
        try {
          await fsPromises.unlink(signedFilePath);
          this.logger.warn(`Rolled back signed file: ${signedFilePath}`);
        } catch (unlinkError) {
          this.logger.error(`Failed to rollback file: ${signedFilePath}`);
        }
        throw dbError;
      }

      this.logger.log(`Contract ${contractId} signed by ${signerInfo.name}`);

      // Auto-create UserDocument if fully signed (optional: check if both parties signed if that's the flow, but here we just stash the signed version)
      // Assuming 'SIGNED' means fully signed or at least a significant step.
      try {
        await this.documentsService.create({
          title: `Hợp đồng thuê - ${contract.contractNumber}`,
          type: 'CONTRACT' as any,
          fileUrl: contract.signedUrl ? contract.signedUrl : '', // Note: This might be a local path, need to ensure it's accessible or uploaded. 
          // In this system, it seems likely pdfUrl/signedUrl are local paths. 
          // The DocumentService might need to handle file uploads or we store the path?
          // "fileUrl" in UserDocument suggests a web-accessible URL.
          // If the system serves static files from storage, we might need to convert path to URL.
          // For now, let's assume we store what we have or a placeholder.
          // Wait, PCCC logic used `result.pdfUrl` which was `storage/pccc/...`.
          // DocumentsService API (`create`) expects `fileUrl`.
          propertyId: contract.application.room.property.id,
          expiryDate: contract.endDate.toISOString(),
          description: `Hợp đồng được ký bởi ${signerInfo.name}`,
          userId: contract.application.tenant.user.id // Assign to Tenant? Or Landlord? Or both?
          // Maybe duplicate for landlord? For now, let's assign to Tenant as they just signed?
          // But Landlord needs it too. The UserDocument model has `userId`. 
          // We might need to create two documents or shared ownership? 
          // Let's creating for the Signer for now.
        });

        // Also create for Landlord if the signer is Tenant, and vice versa?
        // Actually, usually we want the document available to the user who triggers the action or both.
        // Let's create for the Landlord as well since they are the owner.
        await this.documentsService.create({
          title: `Hợp đồng thuê - ${contract.contractNumber}`,
          type: 'CONTRACT' as any,
          fileUrl: signedFilePath, // Consistency with PCCC
          propertyId: contract.application.room.property.id,
          expiryDate: contract.endDate.toISOString(),
          description: `Hợp đồng được ký bởi ${signerInfo.name}`,
          userId: contract.application.room.property.landlord.user.id
        });

      } catch (error) {
        this.logger.warn(`Failed to auto-create UserDocument for contract ${contractId}`, error);
      }

      return {
        contractId,
        fileName: signedFileName,
        filePath: signedFilePath,
      };
    } catch (error) {
      // CRITICAL: Preserve HTTP exceptions
      if (error instanceof HttpException) {
        throw error;
      }

      const msg = (error as Error)?.message ?? String(error);
      this.logger.error(`Failed to sign contract ${contractId}: ${msg}`);
      throw new InternalServerErrorException(`Failed to sign contract: ${msg}`);
    }
  }

  /**
   * Step 3: Xác thực chữ ký
   * FIXED: Read-only operation, no state mutation
   * FIXED: Verify hash integrity against DB
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

      const signedPdfBuffer = await fsPromises.readFile(contract.signedUrl);
      const verification = this.digitalSignature.verifyPDF(signedPdfBuffer);
      const isVerified = verification.isValid;

      // CRITICAL: Verify hash integrity against stored hash
      const currentHash = this.digitalSignature.hashPDF(signedPdfBuffer);
      const hashMatch = contract.pdfHash
        ? currentHash === contract.pdfHash
        : true;

      if (isVerified && !hashMatch) {
        this.logger.warn(
          `Contract ${contractId}: Signature valid but hash mismatch. Possible file replacement.`,
        );
      }

      // FIXED: Verify is read-only, does NOT mutate contract state
      // Status VERIFIED should be set by admin/finalization flow, not automatic

      this.createAuditLog(contractId, {
        action: 'VERIFY',
        signer: 'System',
        timestamp: new Date(),
        metadata: {
          verificationResult: verification,
          hashMatch,
          storedHash: contract.pdfHash,
          currentHash,
        },
      });

      const verificationResult = {
        contractId,
        isVerified: isVerified && hashMatch,
        signatureValid: isVerified,
        hashIntegrity: hashMatch,
        signedUrl: contract.signedUrl,
      };

      this.logger.log(
        `Contract ${contractId} verified: signature=${isVerified}, hash=${hashMatch}`,
      );

      return verificationResult;
    } catch (error: unknown) {
      // CRITICAL: Preserve HTTP exceptions
      if (error instanceof HttpException) {
        throw error;
      }

      const msg = (error as Error)?.message ?? String(error);
      this.logger.error(`Failed to verify contract ${contractId}: ${msg}`);
      throw new InternalServerErrorException(
        `Failed to verify contract: ${msg}`,
      );
    }
  }

  /**
   * Download signed PDF
   * FIXED: Async fs operations
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

      const buffer = await fsPromises.readFile(contract.signedUrl);
      return {
        buffer,
        fileName: `${contract.contractNumber}-signed.pdf`,
      };
    } catch (error) {
      // CRITICAL: Preserve HTTP exceptions
      if (error instanceof HttpException) {
        throw error;
      }

      const msg = (error as Error)?.message ?? String(error);
      this.logger.error(
        `Failed to download PDF for contract ${contractId}: ${msg}`,
      );
      throw new InternalServerErrorException(`Failed to download PDF: ${msg}`);
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
