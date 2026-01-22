import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
  Res,
  NotFoundException,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import {
  ContractPdfService,
  ContractSigningService,
  PdfQueueService,
} from './signing';
import { ContractsService } from './contracts.service';
import {
  CreateRentalApplicationDto,
  CreateContractDto,
  UpdateContractDto,
  FilterRentalApplicationsDto,
  FilterContractsDto,
  TerminateContractDto,
  UpdateHandoverChecklistDto,
  RenewContractDto,
  UpdateContractResidentDto,
} from './dto';
import { CreateContractResidentDto } from './dto/create-contract-resident.dto';
import { User, UserRole } from '../users/entities';
import { Auth } from 'src/common/decorators/auth.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ContractPartyGuard } from '../../common/guards/contract-party.guard';
import { AdminAuditService } from 'src/shared/audit/admin-audit.service';

@Controller('contracts')
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly contractSigningService: ContractSigningService,
    private readonly pdfQueueService: PdfQueueService,
    private readonly contractPdfService: ContractPdfService,
    private readonly adminAudit: AdminAuditService,
  ) {}

  @Patch(':id/handover')
  @Auth(UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN)
  @UseGuards(ContractPartyGuard)
  updateHandoverChecklist(
    @Param('id') id: string,
    @Body() dto: UpdateHandoverChecklistDto,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.updateHandoverChecklist(id, user.id, dto);
  }

  // ===== RENTAL APPLICATIONS ENDPOINTS =====

  @Post('applications')
  @Auth(UserRole.TENANT) // Only tenants can create applications
  createApplication(
    @Body() createDto: CreateRentalApplicationDto,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.createApplication(createDto, user);
  }

  @Get('applications')
  @Auth(UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN)
  findAllApplications(@Query() filterDto: FilterRentalApplicationsDto) {
    return this.contractsService.findAllApplications(filterDto);
  }

  @Get('applications/:id')
  @Auth(UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN)
  findOneApplication(@Param('id') id: string) {
    return this.contractsService.findOneApplication(id);
  }

  @Patch('applications/:id/approve')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  approveApplication(@Param('id') id: string, @CurrentUser() user: User) {
    return this.contractsService.approveApplication(id, user);
  }

  @Patch('applications/:id/reject')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  rejectApplication(@Param('id') id: string, @CurrentUser() user: User) {
    return this.contractsService.rejectApplication(id, user);
  }

  @Patch('applications/:id/withdraw')
  @Auth(UserRole.TENANT)
  withdrawApplication(@Param('id') id: string, @CurrentUser() user: User) {
    return this.contractsService.withdrawApplication(id, user.id);
  }

  // ===== CONTRACT APPROVAL (Two-Party Agreement) =====

  @Patch(':id/tenant-approve')
  @Auth(UserRole.TENANT)
  @UseGuards(ContractPartyGuard)
  tenantApproveContract(@Param('id') id: string, @CurrentUser() user: User) {
    return this.contractsService.tenantApproveContract(id, user.id);
  }

  // ===== CONTRACT MANAGEMENT ENDPOINTS =====

  /**
   * GET /contracts/jobs/:jobId (MUST be before :id routes)
   * - Check PDF generation job status
   */
  @Get('jobs/:jobId')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT)
  async checkJobStatus(@Param('jobId') jobId: string) {
    const job = await this.pdfQueueService.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }
    return job;
  }

  @Post()
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  create(@Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(createContractDto);
  }

  @Get()
  @Auth(UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN)
  findAll(@Query() filterDto: FilterContractsDto, @CurrentUser() user: User) {
    return this.contractsService.findAll(filterDto, user);
  }

  @Get(':id')
  @Auth(UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN)
  @UseGuards(ContractPartyGuard) // ✅ Only contract parties
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Patch(':id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  @UseGuards(ContractPartyGuard) // ✅ Only landlord of this contract
  update(
    @Param('id') id: string,
    @Body() updateContractDto: UpdateContractDto,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.update(id, updateContractDto, user);
  }

  @Patch(':id/send')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  @UseGuards(ContractPartyGuard)
  send(@Param('id') id: string, @CurrentUser() user: User) {
    return this.contractsService.sendContract(id, user.id);
  }

  @Patch(':id/revoke')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT)
  @UseGuards(ContractPartyGuard)
  revoke(@Param('id') id: string, @CurrentUser() user: User) {
    return this.contractsService.revokeContract(id, user.id);
  }

  @Patch(':id/request-changes')
  @Auth(UserRole.TENANT)
  @UseGuards(ContractPartyGuard)
  @HttpCode(200)
  requestChanges(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('reason') reason: string,
  ) {
    if (!reason) throw new BadRequestException('Reason is required');
    return this.contractsService.requestChanges(id, user.id, reason);
  }

  @Patch(':id/terminate')
  @Auth(UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN)
  @UseGuards(ContractPartyGuard)
  terminate(
    @Param('id') id: string,
    @Body() terminateDto: TerminateContractDto,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.terminate(id, user.id, terminateDto);
  }

  @Patch(':id/renew')
  @Auth(UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN)
  @UseGuards(ContractPartyGuard)
  renew(
    @Param('id') id: string,
    @Body() renewDto: RenewContractDto,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.renew(id, user.id, renewDto);
  }

  @Delete(':id')
  @Auth(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    // 📝 ADMIN AUDIT: Log contract deletion before executing
    const contract = await this.contractsService.findOne(id);
    
    await this.adminAudit.logAdminAction({
      adminId: user.id,
      action: 'DELETE_CONTRACT',
      entityType: 'CONTRACT',
      entityId: id,
      beforeValue: contract,
      reason: `Admin deleted contract for room ${contract.room?.roomNumber || 'N/A'}, tenant: ${contract.tenant?.user?.fullName || 'N/A'}`,
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    return this.contractsService.remove(id);
  }

  // ===== RESIDENT MANAGEMENT (Occupancy) =====
  @Post(':id/residents')
  @Auth(UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN)
  @UseGuards(ContractPartyGuard)
  addResident(
    @Param('id') id: string,
    @Body() dto: CreateContractResidentDto,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.addResident(id, dto, user.id);
  }

  @Delete(':id/residents/:residentId')
  @Auth(UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN)
  @UseGuards(ContractPartyGuard)
  removeResident(
    @Param('id') id: string,
    @Param('residentId') residentId: string,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.removeResident(id, residentId, user.id);
  }

  @Patch(':id/residents/:residentId')
  @Auth(UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN)
  @UseGuards(ContractPartyGuard)
  updateResident(
    @Param('id') id: string,
    @Param('residentId') residentId: string,
    @Body() dto: UpdateContractResidentDto,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.updateResident(id, residentId, dto, user.id);
  }

  // ===== DIGITAL SIGNATURE ENDPOINTS (Chữ ký số) =====

  /**
   * POST /contracts/:id/generate-pdf-async (NON-BLOCKING)
   * - Tạo job và trả về jobId ngay lập tức
   * - PDF generation chạy background (không block event loop)
   */
  @Post(':id/generate-pdf-async')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT)
  @UseGuards(ContractPartyGuard)
  async generatePDFAsync(
    @Param('id') id: string,
    @Body('templateName') templateName: string = 'rental-agreement',
  ) {
    // Create job (returns existing if pending/processing for this contract)
    const { jobId, isNew } = await this.pdfQueueService.createJob(
      id,
      templateName,
    );

    // Process PDF in background (non-blocking) only if new job
    if (isNew) {
      setImmediate(() => {
        void (async () => {
          try {
            await this.pdfQueueService.markProcessing(jobId);
            const result =
              await this.contractSigningService.generateContractPDF(
                id,
                templateName,
              );
            await this.pdfQueueService.markCompleted(jobId, result);
          } catch (error: unknown) {
            const msg = (error as Error)?.message ?? String(error);
            await this.pdfQueueService.markFailed(jobId, msg);
          }
        })();
      });
    }

    return {
      jobId,
      status: isNew ? 'pending' : 'queued',
      message: isNew
        ? 'PDF generation started. Check /contracts/jobs/:jobId for status'
        : 'PDF generation already in progress for this contract',
    };
  }

  /**
   * POST /contracts/:id/generate-pdf (SYNCHRONOUS - giữ lại cho compatibility)
   * - Tạo PDF từ contract data
   * - Hash file PDF
   * - Lưu file gốc để ký sau
   */
  @Post(':id/generate-pdf')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT)
  @UseGuards(ContractPartyGuard)
  async generateContractPDF(
    @Param('id') id: string,
    @Body('templateName') templateName: string = 'rental-agreement',
  ) {
    return this.contractSigningService.generateContractPDF(id, templateName);
  }

  /**
   * POST /contracts/:id/sign
   * - Ký file PDF bằng Private Key của hệ thống
   * - Embed chữ ký vào file
   * - Tạo audit log (ai ký, khi nào, từ đâu)
   *
   * TODO: Validate contract state before signing (must have generated PDF, both parties approved)
   * TODO: Prevent duplicate signatures
   */
  @Post(':id/sign')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT)
  @UseGuards(ContractPartyGuard)
  async signContract(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { reason: string },
  ) {
    if (!user) {
      throw new BadRequestException('User information is required');
    }

    // TODO: Parse real IP and UserAgent from request headers
    // ipAddress: req.ip || req.headers['x-forwarded-for']
    // userAgent: req.headers['user-agent']
    return this.contractSigningService.signContract(
      id,
      {
        name: user.fullName,
        email: user.email,
        userId: user.id,
        reason: body.reason || 'Contract signature',
      },
      {
        ipAddress: 'N/A', // TODO: Parse from request.ip
        userAgent: 'N/A', // TODO: Parse from request.headers['user-agent']
        deviceInfo: 'Web Browser',
      },
    );
  }

  /**
   * GET /contracts/:id/verify
   * - Kiểm tra chữ ký có hợp lệ không
   * - Xác nhận file chưa bị sửa đổi
   */
  @Get(':id/verify')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT)
  @UseGuards(ContractPartyGuard)
  async verifyContract(@Param('id') id: string) {
    return this.contractSigningService.verifyContract(id);
  }

  /**
   * GET /contracts/:id/payment-status
   * - Check Payment Status (Polling)
   */
  @Get(':id/payment-status')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT)
  @UseGuards(ContractPartyGuard) // Prevent unauthorized polling
  async verifyPaymentStatus(@Param('id') id: string) {
    return this.contractsService.verifyPaymentStatus(id);
  }

  // ----- PDF Generation Endpoint -----
  @Get(':id/pdf')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT)
  @UseGuards(ContractPartyGuard)
  async getContractPdf(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.contractPdfService.generatePdf(id, user.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="contract-${id}.pdf"`,
    );
    res.send(pdfBuffer);
  }

  /**
   * GET /contracts/:id/download-signed
   * - Download file PDF đã ký
   */
  @Get(':id/download-signed')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT)
  @UseGuards(ContractPartyGuard)
  async downloadSignedPDF(@Param('id') id: string, @Res() res: Response) {
    try {
      const { buffer, fileName } =
        await this.contractSigningService.downloadSignedPDF(id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.send(buffer);
    } catch (error) {
      const msg = (error as Error)?.message ?? String(error);
      throw new BadRequestException(msg);
    }
  }
}
