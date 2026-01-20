import { IsDateString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RenewContractDto {
    @ApiProperty()
    @IsDateString()
    @IsNotEmpty()
    newEndDate: string;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    @Min(0)
    newRentPrice?: number;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    increasePercentage?: number;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    @Min(0)
    newDeposit?: number;
}
