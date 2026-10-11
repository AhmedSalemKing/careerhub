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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const toBool = ({ value }: { value: unknown }) =>
  value === true || value === 'true' || value === 1 || value === '1';

export class CreateQuizDto {
  @ApiProperty({ description: 'Quiz title (primary / Arabic)', example: 'اختبار الدالة ومعلوماتها' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiPropertyOptional({ description: 'Secondary title (English)', example: 'Functions quiz' })
  @IsOptional()
  @IsString()
  titleAr?: string;

  @ApiPropertyOptional({ description: 'Quiz description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Course id (must belong to the instructor)' })
  @IsString()
  courseId: string;

  @ApiPropertyOptional({ description: 'Optional section id' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ description: 'Optional lesson id' })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes', default: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'Passing percentage 0-100', default: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional({ default: false })
  @Transform(toBool)
  @IsBoolean()
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({ default: false })
  @Transform(toBool)
  @IsBoolean()
  shuffleChoices?: boolean;

  @ApiPropertyOptional({ default: true })
  @Transform(toBool)
  @IsBoolean()
  allowRetake?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @ApiPropertyOptional({ description: 'Minimum percentage below which a retake is allowed', default: 50 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  retakeThreshold?: number;

  @ApiPropertyOptional({ default: false })
  @Transform(toBool)
  @IsOptional()
  @IsBoolean()
  unlimitedRetakes?: boolean;

  @ApiPropertyOptional({ default: true })
  @Transform(toBool)
  @IsBoolean()
  showResults?: boolean;
}