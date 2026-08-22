import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  @IsEmail()
  readonly email!: string;

  @IsString()
  @MinLength(8)
  readonly password!: string;
}
