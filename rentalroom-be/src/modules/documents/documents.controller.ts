import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Request,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateUserDocumentDto } from './dto/create-document.dto';
import { UserDocumentType } from '@prisma/client';
import { Auth } from '../../common/decorators/auth.decorator';
import { UserRole } from '../users/entities';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Auth(UserRole.LANDLORD, UserRole.TENANT)
  create(@Request() req, @Body() dto: CreateUserDocumentDto) {
    return this.documentsService.create(req.user.id, dto);
  }

  @Get()
  @Auth(UserRole.LANDLORD, UserRole.TENANT)
  findAll(
    @Request() req,
    @Query('type') type?: UserDocumentType,
    @Query('propertyId') propertyId?: string,
  ) {
    return this.documentsService.findAll(req.user.id, { type, propertyId });
  }

  @Get(':id')
  @Auth(UserRole.LANDLORD, UserRole.TENANT)
  findOne(@Request() req, @Param('id') id: string) {
    return this.documentsService.findOne(id, req.user.id);
  }

  @Delete(':id')
  @Auth(UserRole.LANDLORD, UserRole.TENANT)
  remove(@Request() req, @Param('id') id: string) {
    return this.documentsService.remove(id, req.user.id);
  }
}
