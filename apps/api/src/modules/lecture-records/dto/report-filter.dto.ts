import { IsOptional, IsString, IsDateString } from 'class-validator';

export class ReportFilterDto {
  @IsOptional()
  @IsString()
  instructorId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
