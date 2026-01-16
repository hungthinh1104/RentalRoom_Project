import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateUserAgreementDto {
  @IsNotEmpty()
  @IsUUID()
  templateId: string;

  @IsNotEmpty()
  @IsString()
  phone: string;
}
