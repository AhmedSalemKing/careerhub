import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  MinLength,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const toBool = ({ value }: { value: unknown }) =>
  value === true || value === 'true' || value === 1 || value === '1';

export class QuizChoiceDto {
  @ApiProperty({ description: 'Choice text' })
  @IsString()
  @MinLength(1)
  text: string;

  @ApiPropertyOptional({ default: false })
  @Transform(toBool)
  @IsBoolean()
  isCorrect?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateQuestionDto {
  @ApiProperty({ enum: ['MCQ', 'SHORT_ANSWER', 'FILE_UPLOAD'] })
  @IsIn(['MCQ', 'SHORT_ANSWER', 'FILE_UPLOAD'])
  type: string;

  @ApiProperty({ description: 'Question text' })
  @IsString()
  @MinLength(1)
  questionText: string;

  @ApiPropertyOptional({ description: 'Optional question image URL' })
  @IsOptional()
  @IsString()
  questionImage?: string;

  @ApiPropertyOptional({ description: 'Note shown to the student above the choices' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  points?: number;

  @ApiPropertyOptional({ default: false })
  @Transform(toBool)
  @IsBoolean()
  allowMultipleAnswers?: boolean;

  @ApiPropertyOptional({ type: [QuizChoiceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizChoiceDto)
  choices?: QuizChoiceDto[];
}