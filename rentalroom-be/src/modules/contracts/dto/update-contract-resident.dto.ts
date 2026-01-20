import { PartialType } from '@nestjs/swagger';
import { CreateContractResidentDto } from './create-contract-resident.dto';

export class UpdateContractResidentDto extends PartialType(
    CreateContractResidentDto,
) { }
