import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { FilterChangeLogDto } from './dto/filter-change-log.dto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRole } from 'src/modules/users/entities';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('change-logs')
  @Auth(UserRole.ADMIN)
  findChangeLogs(@Query() filter: FilterChangeLogDto) {
    return this.auditService.findChangeLogs(filter);
  }
}
