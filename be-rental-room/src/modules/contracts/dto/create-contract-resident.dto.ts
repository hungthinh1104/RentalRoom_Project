import { IsString, IsNotEmpty, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContractResidentDto {
    @ApiProperty({ description: 'Full name of the resident' })
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiProperty({ description: 'Phone number', required: false })
    @IsOptional()
    @IsPhoneNumber('VN')
    phoneNumber?: string;

    @ApiProperty({ description: 'Citizen ID number', required: false })
    @IsOptional()
    @IsString()
    citizenId?: string;

    @ApiProperty({ description: 'Relationship with tenant', required: false })
    @IsOptional()
    @IsString()
    relationship?: string;
}
