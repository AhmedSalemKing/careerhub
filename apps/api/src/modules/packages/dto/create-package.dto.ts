import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreatePackageDto {
  /** Track id (or career path id / slug) the bundle belongs to */
  @IsString() @MaxLength(200) pathId: string;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @IsString({ each: true }) courseIds: string[];

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) originalPrice?: number;

  @Type(() => Number) @IsNumber() @Min(0.01) finalPrice: number;

  @IsOptional() @IsString() @MaxLength(2000) notes?: string;

  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdatePackageDto extends PartialType(CreatePackageDto) {}
