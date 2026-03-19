import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsIn,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'First name must be a string' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  @Matches(/^[a-zA-Z\u0600-\u06FF\s]+$/, {
    message: 'First name can only contain letters and spaces',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'Last name must be a string' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  @Matches(/^[a-zA-Z\u0600-\u06FF\s]+$/, {
    message: 'Last name can only contain letters and spaces',
  })
  lastName: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+201234567890',
  })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Please provide a valid phone number with country code',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'User country',
    example: 'Egypt',
  })
  @IsOptional()
  @IsString({ message: 'Country must be a string' })
  @MaxLength(50, { message: 'Country cannot exceed 50 characters' })
  country?: string;

  @ApiPropertyOptional({
    description: 'User city',
    example: 'Cairo',
  })
  @IsOptional()
  @IsString({ message: 'City must be a string' })
  @MaxLength(50, { message: 'City cannot exceed 50 characters' })
  city?: string;

  @ApiPropertyOptional({
    description: 'User preferred language',
    example: 'en',
    enum: ['en', 'ar'],
  })
  @IsOptional()
  @IsIn(['en', 'ar'], { message: 'Language must be either "en" or "ar"' })
  language?: string;
}
