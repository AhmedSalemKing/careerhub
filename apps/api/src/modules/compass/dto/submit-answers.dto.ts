import {
  IsArray, IsInt, IsOptional, IsString, ValidateNested, Min, Max, MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'

export class AnswerItemDto {
  @IsString()
  questionId!: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptionIds?: string[]

  @IsOptional()
  @IsArray()
  rankingOrder?: { optionId: string; rank: number }[]

  @IsOptional()
  @IsString()
  @MaxLength(500)
  textValue?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingValue?: number
}

export class SubmitAnswersDto {
  @IsInt()
  @Min(1)
  @Max(6)
  stageNumber!: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers!: AnswerItemDto[]
}
