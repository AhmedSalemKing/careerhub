import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class CreateUserAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  accountType: string = 'STUDENT';

  @IsOptional()
  @IsString()
  phone?: string;
}
