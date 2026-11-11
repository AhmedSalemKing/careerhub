import { IsString, MaxLength, MinLength } from 'class-validator';

export class AutoLoginDto {
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  token: string;
}
