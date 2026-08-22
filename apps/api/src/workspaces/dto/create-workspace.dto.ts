import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  @IsString()
  @IsNotEmpty()
  readonly slug!: string;
}
