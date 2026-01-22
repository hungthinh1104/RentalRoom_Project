import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateUserDocumentDto } from './dto/create-document.dto';
import { UserDocument, UserDocumentType } from '@prisma/client';

@Injectable()
export class DocumentsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, dto: CreateUserDocumentDto): Promise<UserDocument> {
        return this.prisma.userDocument.create({
            data: {
                userId,
                title: dto.title,
                type: dto.type,
                fileUrl: dto.fileUrl,
                fileHash: dto.fileHash,
                propertyId: dto.propertyId,
                expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
                description: dto.description,
            },
        });
    }

    async findAll(userId: string, query: { type?: UserDocumentType; propertyId?: string }) {
        return this.prisma.userDocument.findMany({
            where: {
                userId,
                type: query.type,
                propertyId: query.propertyId,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                property: { select: { id: true, name: true } },
            },
        });
    }

    async findOne(id: string, userId: string): Promise<UserDocument> {
        const doc = await this.prisma.userDocument.findFirst({
            where: { id, userId },
        });
        if (!doc) throw new NotFoundException('Document not found');
        return doc;
    }

    async remove(id: string, userId: string): Promise<void> {
        const doc = await this.findOne(id, userId); // Ensure ownership
        await this.prisma.userDocument.delete({ where: { id: doc.id } });
    }
}
