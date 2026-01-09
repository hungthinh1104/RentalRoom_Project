import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class PdfService {
    constructor(private readonly prisma: PrismaService) { }

    async generateInvoicePDF(invoiceId: string, res: Response) {
        // Fetch invoice with all related data
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                contract: {
                    include: {
                        tenant: { include: { user: true } },
                        landlord: { include: { user: true } },
                        room: { include: { property: true } },
                    },
                },
                lineItems: true,
            },
        });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`,
        );

        // Pipe PDF to response
        doc.pipe(res);

        // Add content
        this.addHeader(doc, invoice);
        this.addInvoiceInfo(doc, invoice);
        this.addLineItems(doc, invoice);
        this.addFooter(doc, invoice);

        // Finalize PDF
        doc.end();
    }

    private addHeader(doc: PDFKit.PDFDocument, invoice: any) {
        doc
            .fontSize(20)
            .font('Helvetica-Bold')
            .text('HÓA ĐƠN THANH TOÁN', { align: 'center' })
            .moveDown();

        doc
            .fontSize(10)
            .font('Helvetica')
            .text(`Mã hóa đơn: ${invoice.invoiceNumber}`, { align: 'center' })
            .moveDown(2);
    }

    private addInvoiceInfo(doc: PDFKit.PDFDocument, invoice: any) {
        const landlord = invoice.contract.landlord.user;
        const tenant = invoice.contract.tenant.user;
        const property = invoice.contract.room.property;

        // Landlord info
        doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Thông tin chủ nhà:', 50, doc.y);
        doc
            .fontSize(10)
            .font('Helvetica')
            .text(`Họ tên: ${landlord.fullName || 'N/A'}`, 50, doc.y)
            .text(`Email: ${landlord.email}`, 50, doc.y)
            .text(`SĐT: ${landlord.phoneNumber || 'N/A'}`, 50, doc.y)
            .moveDown();

        // Tenant info
        doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Thông tin khách thuê:', 50, doc.y);
        doc
            .fontSize(10)
            .font('Helvetica')
            .text(`Họ tên: ${tenant.fullName || 'N/A'}`, 50, doc.y)
            .text(`Email: ${tenant.email}`, 50, doc.y)
            .text(`SĐT: ${tenant.phoneNumber || 'N/A'}`, 50, doc.y)
            .moveDown();

        // Property info
        doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Thông tin phòng:', 50, doc.y);
        doc
            .fontSize(10)
            .font('Helvetica')
            .text(`Tên tài sản: ${property.name}`, 50, doc.y)
            .text(`Địa chỉ: ${property.address}`, 50, doc.y)
            .text(`Phòng số: ${invoice.contract.room.roomNumber}`, 50, doc.y)
            .moveDown(2);
    }

    private addLineItems(doc: PDFKit.PDFDocument, invoice: any) {
        doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Chi tiết hóa đơn:', 50, doc.y)
            .moveDown();

        // Table header
        const tableTop = doc.y;
        doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Mô tả', 50, tableTop)
            .text('Số lượng', 250, tableTop)
            .text('Đơn giá', 350, tableTop)
            .text('Thành tiền', 450, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Line items
        let y = tableTop + 25;
        doc.font('Helvetica');

        invoice.lineItems.forEach((item: any) => {
            doc
                .text(item.description || 'N/A', 50, y)
                .text(item.quantity?.toString() || '1', 250, y)
                .text(this.formatCurrency(item.unitPrice), 350, y)
                .text(this.formatCurrency(item.amount), 450, y);
            y += 20;
        });

        // Total
        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 10;

        doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Tổng cộng:', 350, y)
            .text(this.formatCurrency(invoice.totalAmount), 450, y);

        doc.moveDown(3);
    }

    private addFooter(doc: PDFKit.PDFDocument, invoice: any) {
        const issueDate = new Date(invoice.issueDate).toLocaleDateString('vi-VN');
        const dueDate = new Date(invoice.dueDate).toLocaleDateString('vi-VN');

        doc
            .fontSize(10)
            .font('Helvetica')
            .text(`Ngày phát hành: ${issueDate}`, 50, doc.y)
            .text(`Hạn thanh toán: ${dueDate}`, 50, doc.y);

        if (invoice.paidAt) {
            const paidDate = new Date(invoice.paidAt).toLocaleDateString('vi-VN');
            doc
                .font('Helvetica-Bold')
                .fillColor('green')
                .text(`Đã thanh toán: ${paidDate}`, 50, doc.y);
        }

        doc
            .moveDown(2)
            .fontSize(8)
            .fillColor('gray')
            .text(
                'Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!',
                50,
                doc.y,
                { align: 'center' },
            );
    }

    private formatCurrency(amount: any): string {
        const num = Number(amount);
        return `${num.toLocaleString('vi-VN')} đ`;
    }
}
