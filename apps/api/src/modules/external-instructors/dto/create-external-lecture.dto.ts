import { IsString, IsOptional, IsInt, IsDateString, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExternalLectureStatus } from '@prisma/client';

export class CreateExternalLectureDto {
  @ApiProperty()
  @IsString()
  instructorId: string;

  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty()
  @IsDateString()
  lectureDate: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  durationMinutes: number;

  @ApiPropertyOptional({ enum: ExternalLectureStatus, default: ExternalLectureStatus.SCHEDULED })
  @IsOptional()
  @IsEnum(ExternalLectureStatus)
  status?: ExternalLectureStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
