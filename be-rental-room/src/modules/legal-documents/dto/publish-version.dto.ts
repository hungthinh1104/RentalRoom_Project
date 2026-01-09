import { IsString, IsOptional, IsDateString } from 'class-validator';

export class PublishVersionDto {
    @IsDateString()
    @IsOptional()
    effectiveFrom?: string; // When it becomes active

    @IsString()
    @IsOptional()
    reason?: string; // Why publishing
}
