import { IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportTaxDto {
  @IsUUID()
  landlordId: string;

  @IsInt()
  @Min(2020)
  @Max(2100)
  @Type(() => Number)
  year: number;
}

export class MonthlySnapshotParamsDto {
  @IsUUID()
  landlordId: string;

  @IsInt()
  @Min(2020)
  @Max(2100)
  @Type(() => Number)
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month: number;
}
