import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveAnswerDto {
  @ApiProperty({ description: 'Question id this answer belongs to' })
  @IsString()
  questionId: string;

  @ApiPropertyOptional({ description: 'Selected choice ids (MCQ only)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedChoiceIds?: string[];

  @ApiPropertyOptional({ description: 'Free text answer (SHORT_ANSWER)' })
  @IsOptional()
  @IsString()
  textAnswer?: string;

  @ApiPropertyOptional({ description: 'Uploaded file URL (FILE_UPLOAD)' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'Uploaded file name (FILE_UPLOAD)' })
  @IsOptional()
  @IsString()
  fileName?: string;
}