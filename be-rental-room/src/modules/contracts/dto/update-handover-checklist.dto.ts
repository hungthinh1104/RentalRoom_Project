import { IsEnum, IsArray, ValidateNested, IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum HandoverStage {
    CHECK_IN = 'CHECK_IN',
    CHECK_OUT = 'CHECK_OUT',
}

export class HandoverItemDto {
    @IsString()
    itemName: string;

    @IsString()
    condition: string; // GOOD, DAMAGED, MISSING, NEW

    @IsNumber()
    quantity: number;

    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];
}

export class UpdateHandoverChecklistDto {
    @IsEnum(HandoverStage)
    stage: HandoverStage;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => HandoverItemDto)
    items: HandoverItemDto[];

    @IsOptional()
    @IsString()
    witness?: string;

    @IsOptional()
    @IsString()
    signatureUrl?: string; // Digital signature of the party confirming
}
