import { IsNotEmpty, IsNotIn, IsString, Length, Matches } from 'class-validator';

export const RESERVED_WORKSPACE_SLUGS = [
  'login',
  'signup',
  'onboarding',
  'api',
  'new',
  'settings',
];

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  @IsString()
  @Length(3, 40)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  @IsNotIn(RESERVED_WORKSPACE_SLUGS)
  readonly slug!: string;
}
