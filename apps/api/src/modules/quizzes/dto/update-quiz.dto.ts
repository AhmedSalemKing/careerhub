import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const toBool = ({ value }: { value: unknown }) =>
  value === true || value === 'true' || value === 1 || value === '1';

export class UpdateQuizDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional()
  @Transform(toBool)
  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @ApiPropertyOptional()
  @Transform(toBool)
  @IsOptional()
  @IsBoolean()
  shuffleChoices?: boolean;

  @ApiPropertyOptional()
  @Transform(toBool)
  @IsOptional()
  @IsBoolean()
  allowRetake?: boolean;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @ApiPropertyOptional()
  @Transform(toBool)
  @IsOptional()
  @IsBoolean()
  showResults?: boolean;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  retakeThreshold?: number;

  @ApiPropertyOptional()
  @Transform(toBool)
  @IsOptional()
  @IsBoolean()
  unlimitedRetakes?: boolean;
}
