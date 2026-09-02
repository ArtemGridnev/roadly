import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { REFRESH_COOKIE_NAME } from '../utils/authCookie';
import { RefreshTokenPayload } from '../dto/refresh-token-payload.dto';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'refresh-token') {
    constructor(
        private configService: ConfigService,
        private authService: AuthService
    ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.[REFRESH_COOKIE_NAME];
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: unknown): Promise<RefreshTokenPayload> {
    const refreshToken = req?.cookies?.[REFRESH_COOKIE_NAME];

    await this.authService.validateRefreshToken(refreshToken);

    const refreshTokenPayload = plainToInstance(RefreshTokenPayload, payload);
    const errors = validateSync(refreshTokenPayload);

    if (errors.length > 0) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    return refreshTokenPayload;
  }
}
