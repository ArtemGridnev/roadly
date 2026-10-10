import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../types/auth-context';
import { AccessTokenPayload } from '../dto/access-token-payload.dto';

export const CurrentAgent = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AccessTokenPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new InternalServerErrorException(
        '@CurrentAgent() used on a route without access-token auth',
      );
    }

    return request.user;
  },
);
