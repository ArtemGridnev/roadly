import { IsString } from 'class-validator';

export class RefreshTokenPayload {
  @IsString()
  sub!: string;

  @IsString()
  jti!: string;
}
