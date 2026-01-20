import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Res,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PCCCService } from './services/pccc.service';
import { CreatePCCCReportDto } from './dto/create-pccc-report.dto';

/**
 * PCCC Controller - Fire Safety Compliance
 * Generates PC17 reports based on Luật 55/2024/QH15
 */
@Controller('pccc')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PCCCController {
  constructor(private readonly pcccService: PCCCService) {}

  /**
   * Generate PCCC Report (PC17)
   */
  @Post('properties/:propertyId/report')
  @Roles('LANDLORD', 'ADMIN')
  async generateReport(
    @Param('propertyId') propertyId: string,
    @Body() dto: CreatePCCCReportDto,
    @CurrentUser() user: any,
  ) {
    return this.pcccService.generatePCCCReport(user.id, propertyId, dto);
  }

  /**
   * Get PCCC Report
   */
  @Get('reports/:reportId')
  async getReport(
    @Param('reportId') reportId: string,
    @CurrentUser() user?: any,
  ) {
    return this.pcccService.getPCCCReport(reportId, user?.id);
  }

  /**
   * Download PCCC PDF
   */
  @Get('reports/:reportId/pdf')
  async downloadPDF(@Param('reportId') reportId: string, @Res() res: Response) {
    const { buffer, fileName } =
      await this.pcccService.downloadPCCCPDF(reportId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  /**
   * Verify PCCC Report (Public endpoint for QR code scanning)
   * 📋 Checks expiry + legal validity
   */
  @Get('verify/:reportId')
  async verifyReport(@Param('reportId') reportId: string) {
    const report = await this.pcccService.getPCCCReport(reportId);

    return {
      valid: new Date() < new Date(report.expiryDate),
      reportId: report.id,
      propertyAddress: report.property.address,
      complianceScore: report.complianceScore,
      expiryDate: report.expiryDate,
      status: report.status,
      pdfHash: report.pdfHash, // Hash for integrity verification
    };
  }

  /**
   * Verify PDF Integrity (Check if PDF has been tampered)
   * 🔐 Returns hash - client computes local hash and compares
   */
  @Get('verify/:reportId/pdf-hash')
  async verifyPDFHash(@Param('reportId') reportId: string) {
    const report = await this.pcccService.getPCCCReport(reportId);

    if (!report.pdfHash) {
      return { error: 'PDF hash not available for this report' };
    }

    return {
      reportId: report.id,
      pdfHash: report.pdfHash,
      hashAlgorithm: 'SHA-256',
      instructions:
        'Compute SHA-256 hash of downloaded PDF and compare with pdfHash',
    };
  }

  /**
   * Get All PCCC Reports (Admin)
   */
  @Get('admin/reports')
  @Roles('ADMIN')
  async getAllReports(@Query('limit') limit?: number) {
    return this.pcccService.getAllReports(limit);
  }
}
