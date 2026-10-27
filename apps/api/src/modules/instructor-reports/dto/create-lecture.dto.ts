import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { LectureStatus } from '@prisma/client';

export class CreateLectureDto {
  @IsString()
  instructorId: string;

  @IsString()
  courseId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsDateString()
  deliveredAt: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsOptional()
  @IsEnum(LectureStatus)
  status?: LectureStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
