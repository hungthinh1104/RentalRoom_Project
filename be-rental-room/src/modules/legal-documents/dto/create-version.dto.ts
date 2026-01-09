import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class CreateVersionDto {
    @IsString()
    content: string; // Markdown or HTML content

    @IsString()
    @IsOptional()
    contentType?: string = 'markdown';

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    summary?: string; // What changed

    @IsString()
    @IsOptional()
    changelog?: string; // Detailed changes

    @IsDateString()
    @IsOptional()
    effectiveFrom?: string; // ISO date

    @IsDateString()
    @IsOptional()
    effectiveTo?: string; // ISO date
}
