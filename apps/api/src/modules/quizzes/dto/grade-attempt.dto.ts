import { Transform, Type } from 'class-transformer';
import { IsString, IsOptional, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GradeAnswerItemDto {
  @ApiProperty({ description: 'QuizAnswer id returned in the attempt detail' })
  @IsString()
  answerId: string;

  @ApiProperty({ description: 'Manual grade in points, 0..question points' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  manualGrade: number;

  @ApiPropertyOptional({ description: 'Feedback for the student' })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class GradeAttemptDto {
  @ApiPropertyOptional({ type: [GradeAnswerItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeAnswerItemDto)
  answers?: GradeAnswerItemDto[];

  @ApiPropertyOptional({ description: 'Notes for the student about the whole attempt' })
  @IsOptional()
  @IsString()
  teacherNotes?: string;
}