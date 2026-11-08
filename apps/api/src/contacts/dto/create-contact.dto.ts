import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly externalId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly name!: string;

  @IsEmail()
  readonly email!: string;
}
