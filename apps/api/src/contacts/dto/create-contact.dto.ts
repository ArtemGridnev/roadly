import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  readonly externalId!: string;

  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  @IsEmail()
  readonly email!: string;
}
