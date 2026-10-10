import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderQuestionsDto {
  @ApiProperty({ description: 'Question ids in the desired order', type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  order: string[];
}