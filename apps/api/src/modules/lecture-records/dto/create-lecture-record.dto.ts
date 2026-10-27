import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { LectureRecordStatus } from '@prisma/client';

export class CreateLectureRecordDto {
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
  @IsEnum(LectureRecordStatus)
  status?: LectureRecordStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
