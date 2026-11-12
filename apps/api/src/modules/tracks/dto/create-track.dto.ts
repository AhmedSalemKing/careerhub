import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, MaxLength, Min,
} from 'class-validator';

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

export class CreateTrackDto {
  @IsString() @MaxLength(120) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase letters, numbers and dashes' })
  slug: string;

  @IsString() @MaxLength(200) nameAr: string;
  @IsString() @MaxLength(200) nameEn: string;
  @IsString() @MaxLength(2000) descAr: string;
  @IsString() @MaxLength(2000) descEn: string;

  @Type(() => Number) @IsInt() @Min(1) weeks: number;
  @IsString() @MaxLength(100) level: string;
  @IsString() @MaxLength(100) levelEn: string;
  @IsString() @MaxLength(200) languages: string;

  @IsOptional() @IsString() @MaxLength(1000) @Matches(/^(https?:\/\/|\/)\S+$/, { message: 'coverImage must be an http(s) URL or a /path' })
  coverImage?: string | null;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) sessionPrice?: number | null;
  @IsOptional() @IsString() @MaxLength(200) speciality?: string | null;
  @IsOptional() @IsString() @MaxLength(1000) visionDescKSA?: string | null;
  @IsOptional() @IsString() @MaxLength(1000) visionDescEG?: string | null;

  @IsArray() @IsIn(['KSA', 'EG'], { each: true }) vision2030: string[];


  @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) skills: string[];
  @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) skillsEn: string[];

  /** accepts a real array or a JSON string of one */
  @Transform(({ value }) => parseMaybeJson(value))
  @IsArray() @ArrayMaxSize(50) jobs: Record<string, unknown>[];

  @Transform(({ value }) => parseMaybeJson(value))
  @IsArray() @ArrayMaxSize(50) courses: Record<string, unknown>[];

  @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) freeItemsAr: string[];
  @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) freeItemsEn: string[];

  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsIn(['EG', 'KSA', 'BOTH']) country?: 'EG' | 'KSA' | 'BOTH';
}
