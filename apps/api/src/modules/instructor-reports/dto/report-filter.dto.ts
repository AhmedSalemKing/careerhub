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

  /**
   * Accepted because the web API client appends `country` to every request.
   * It is intentionally not used to filter lecture reports.
   */
  @IsOptional()
  @IsString()
  country?: string;
}
