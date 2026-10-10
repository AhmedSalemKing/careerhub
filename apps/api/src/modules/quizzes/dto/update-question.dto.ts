import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QuizChoiceDto } from './create-question.dto';

const toBool = ({ value }: { value: unknown }) =>
  value === true || value === 'true' || value === 1 || value === '1';

export class UpdateQuestionDto {
  @ApiPropertyOptional({ enum: ['MCQ', 'SHORT_ANSWER', 'FILE_UPLOAD'] })
  @IsOptional()
  @IsIn(['MCQ', 'SHORT_ANSWER', 'FILE_UPLOAD'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  questionText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  questionImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @ApiPropertyOptional()
  @Transform(toBool)
  @IsOptional()
  @IsBoolean()
  allowMultipleAnswers?: boolean;

  @ApiPropertyOptional({ type: [QuizChoiceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizChoiceDto)
  choices?: QuizChoiceDto[];
}