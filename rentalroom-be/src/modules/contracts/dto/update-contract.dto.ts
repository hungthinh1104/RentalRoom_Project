import { PartialType } from '@nestjs/mapped-types';
import { CreateRentalApplicationDto } from './create-rental-application.dto';
import { CreateContractDto } from './create-contract.dto';

export class UpdateRentalApplicationDto extends PartialType(
  CreateRentalApplicationDto,
) {}
export class UpdateContractDto extends PartialType(CreateContractDto) {}
