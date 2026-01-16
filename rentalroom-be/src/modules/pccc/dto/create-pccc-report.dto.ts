import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class CreatePCCCReportDto {
  @IsEnum(['NHA_TRO', 'CHUNG_CU_MINI', 'KINH_DOANH'])
  propertyType: 'NHA_TRO' | 'CHUNG_CU_MINI' | 'KINH_DOANH';

  @IsNumber()
  @Min(1)
  @Max(20)
  floors: number;

  @IsNumber()
  @Min(10)
  area: number;

  @IsOptional()
  @IsNumber()
  volume?: number;

  @IsOptional()
  @IsNumber()
  laneWidth?: number;

  @IsOptional()
  @IsBoolean()
  hasCage?: boolean;

  @IsOptional()
  @IsEnum(['ELECTRICAL_FIRE', 'GAS_LEAK', 'GENERAL_FIRE'])
  scenarioType?: 'ELECTRICAL_FIRE' | 'GAS_LEAK' | 'GENERAL_FIRE';
}
