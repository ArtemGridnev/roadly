import { IsString } from 'class-validator';

export class AccessTokenPayload {
  @IsString()
  sub!: string;

  @IsString()
  username!: string;
}
