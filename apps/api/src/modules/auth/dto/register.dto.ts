import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsIn,
  IsInt,
  IsNumber,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ description: 'User password', example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
  })
  password: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ description: 'User phone number', example: '+201234567890' })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'User country', example: 'Egypt' })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString()
  @MaxLength(50)
  country?: string;

  @ApiPropertyOptional({ description: 'User city', example: 'Cairo' })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString()
  @MaxLength(50)
  city?: string;

  @ApiPropertyOptional({ description: 'Preferred language', example: 'en', enum: ['en', 'ar'] })
  @IsOptional()
  @IsIn(['en', 'ar'])
  language?: string;

  @ApiPropertyOptional({
    description: 'Account type',
    example: 'STUDENT',
    enum: ['STUDENT', 'INSTRUCTOR', 'CONSULTANT'],
  })
  @IsOptional()
  @IsIn(['STUDENT', 'INSTRUCTOR', 'CONSULTANT'])
  accountType?: string;

  @ApiPropertyOptional({ description: 'CV URL for instructors/consultants' })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString()
  cvUrl?: string;

  @ApiPropertyOptional({ description: 'Professional bio' })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ description: 'Years of experience' })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(String(value), 10) : undefined))
  @IsInt()
  @Min(0)
  @Max(50)
  experience?: number;

  @ApiPropertyOptional({ description: 'Area of speciality' })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString()
  @MaxLength(100)
  speciality?: string;

  @ApiPropertyOptional({ description: 'LinkedIn profile URL' })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString()
  linkedinUrl?: string;

  @ApiPropertyOptional({ description: 'Hourly rate in SAR (for consultants)' })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseFloat(String(value)) : undefined))
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Preferred meeting method', enum: ['ZOOM', 'GOOGLE_MEET', 'BOTH'] })
  @IsOptional()
  @IsIn(['ZOOM', 'GOOGLE_MEET', 'BOTH'])
  meetingMethod?: string;

  @ApiPropertyOptional({ description: 'Profile avatar URL' })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString()
  avatar?: string;
}
