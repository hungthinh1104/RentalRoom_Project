import { IsString, IsNumber } from 'class-validator';

export class GenerateQrDto {
  @IsString()
  landlordId: string;

  @IsNumber()
  amount: number;

  @IsString()
  paymentRef: string;
  description?: string;
}
