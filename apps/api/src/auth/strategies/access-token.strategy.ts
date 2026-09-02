import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AccessTokenPayload } from '../dto/access-token-payload.dto';
import { ACCESS_COOKIE_NAME } from '../utils/authCookie';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'access-token') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.[ACCESS_COOKIE_NAME];
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: unknown): Promise<AccessTokenPayload> {
    const accessTokenPayload = plainToInstance(AccessTokenPayload, payload);
    const errors = validateSync(accessTokenPayload);

    if (errors.length > 0) {
      throw new UnauthorizedException('Invalid access token payload');
    }

    return accessTokenPayload;
  }
}
