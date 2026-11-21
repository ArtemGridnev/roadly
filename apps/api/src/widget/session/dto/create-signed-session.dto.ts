import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSignedSessionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  readonly token!: string;
}
