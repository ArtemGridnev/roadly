import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ResolvedContact } from './types/auth-context';

const WIDGET_SESSION_TTL = '1h';
const WIDGET_SESSION_AUDIENCE = 'roadly-widget-session';

export interface WidgetSessionTokenPayload {
  sub: string;
  workspaceId: string;
}

@Injectable()
export class WidgetSessionTokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  sign(contact: ResolvedContact): string {
    const payload: WidgetSessionTokenPayload = {
      sub: contact.id,
      workspaceId: contact.workspaceId,
    };

    return this.jwtService.sign(payload, {
      secret: this.secret(),
      algorithm: 'HS256',
      audience: WIDGET_SESSION_AUDIENCE,
      expiresIn: WIDGET_SESSION_TTL,
    });
  }

  verify(token: string): WidgetSessionTokenPayload | null {
    try {
      return this.jwtService.verify<WidgetSessionTokenPayload>(token, {
        secret: this.secret(),
        algorithms: ['HS256'],
        audience: WIDGET_SESSION_AUDIENCE,
      });
    } catch {
      return null;
    }
  }

  private secret(): string {
    return this.configService.getOrThrow<string>('WIDGET_SESSION_SECRET');
  }
}
