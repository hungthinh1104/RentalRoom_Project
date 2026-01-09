import { IsString, IsNumber, IsOptional } from 'class-validator';

export class GenerateQrDto {
  @IsString()
  landlordId: string;

  @IsNumber()
  amount: number;

  @IsString()
  paymentRef: string;
  description?: string;
}
