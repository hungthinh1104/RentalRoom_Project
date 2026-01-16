import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { ContractTemplateService } from '../../../common/services/contract-template.service';
import {
  CreateContractTemplateDto,
  UpdateContractTemplateDto,
} from '../dto/contract-template.dto';
import { CreateUserAgreementDto } from '../dto/create-user-agreement.dto';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin/contract-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ContractTemplatesController {
  constructor(
    private readonly templateService: ContractTemplateService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async findAll(@Query('type') type?: string) {
    return this.prisma.contractTemplate.findMany({
      where: {
        ...(type ? { type: type as any } : {}),
        deletedAt: null, // Filter out soft-deleted
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.contractTemplate.findFirst({
      where: { id, deletedAt: null },
    });
  }

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateContractTemplateDto,
  ) {
    return this.templateService.createTemplate(user.id, dto);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateContractTemplateDto,
  ) {
    return this.templateService.updateTemplate(user.id, id, dto);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN) // Or PCCC_EXPERT in future
  async activate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.templateService.activateTemplate(user.id, id);
  }

  @Post('agreements')
  async createAgreement(
    @CurrentUser() user: any,
    @Body() dto: CreateUserAgreementDto,
    @Ip() ip: string,
  ) {
    return this.templateService.createUserAgreement(
      user.id,
      dto.templateId,
      ip,
      dto.phone,
    );
  }

  @Delete(':id')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.templateService.deleteTemplate(user.id, id);
  }

  @Get(':id/audit')
  async getAudit(@Param('id') id: string) {
    return this.templateService.getTemplateAudit(id);
  }

  @Get('preview/:name')
  async preview(@Param('name') name: string) {
    // Generate PDF with dummy data
    const dummyData = {
      contractNumber: 'PREVIEW-001',
      createdAt: new Date(),
      tenant: { fullName: 'Nguyen Van A', citizenId: '123456789' },
      landlord: { fullName: 'Tran Van B' },
      room: {
        roomNumber: '101',
        pricePerMonth: 5000000,
        address: '123 Street',
      },
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      deposit: 5000000,
      monthlyRent: 5000000,
    };

    const buffer = await this.templateService.generateContractPDF(
      name,
      dummyData,
    );
    return {
      pdfBase64: buffer.toString('base64'),
    };
  }
}
