import { Language } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  @IsEmail()
  readonly email!: string;

  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  })
  readonly password!: string;

  @IsOptional()
  @IsEnum(Language)
  readonly language?: Language;
}
