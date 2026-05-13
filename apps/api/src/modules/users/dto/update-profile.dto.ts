import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  Matches,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'First name',
    example: 'John',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString({ message: 'First name must be a string' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  @Matches(/^[a-zA-Z\u0600-\u06FF\s]+$/, {
    message: 'First name can only contain letters and spaces',
  })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString({ message: 'Last name must be a string' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  @Matches(/^[a-zA-Z\u0600-\u06FF\s]+$/, {
    message: 'Last name can only contain letters and spaces',
  })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+201234567890',
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Please provide a valid phone number with country code',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Please provide a valid date of birth' })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    example: 'MALE',
    enum: Gender,
  })
  @IsOptional()
  @IsEnum(Gender, { message: 'Gender must be MALE, FEMALE, or OTHER' })
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Nationality',
    example: 'Egyptian',
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString({ message: 'Nationality must be a string' })
  @MaxLength(50, { message: 'Nationality cannot exceed 50 characters' })
  nationality?: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'Egypt',
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString({ message: 'Country must be a string' })
  @MaxLength(50, { message: 'Country cannot exceed 50 characters' })
  country?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Cairo',
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString({ message: 'City must be a string' })
  @MaxLength(50, { message: 'City cannot exceed 50 characters' })
  city?: string;

  @ApiPropertyOptional({
    description: 'Bio',
    example: 'Passionate learner and tech enthusiast',
    maxLength: 500,
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsString({ message: 'Bio must be a string' })
  @MaxLength(500, { message: 'Bio cannot exceed 500 characters' })
  bio?: string;

  @ApiPropertyOptional({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/johndoe',
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value)
  @IsUrl({}, { message: 'Please provide a valid LinkedIn URL' })
  linkedinUrl?: string;

  @ApiPropertyOptional({
    description: 'Preferred language',
    example: 'en',
    enum: ['en', 'ar'],
  })
  @IsOptional()
  @IsString({ message: 'Language must be a string' })
  @Matches(/^(en|ar)$/, { message: 'Language must be either "en" or "ar"' })
  language?: string;

  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'Africa/Cairo',
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/[^>]*>/g, '').trim() : value)
  @IsString({ message: 'Timezone must be a string' })
  @MaxLength(50, { message: 'Timezone cannot exceed 50 characters' })
  timezone?: string;
}
