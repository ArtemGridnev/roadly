import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthenticatedRequest, ResolvedContact } from '../types/auth-context';

export const CurrentContact = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): ResolvedContact => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.contact) {
      throw new InternalServerErrorException(
        '@CurrentContact() used on a route without @RequireContact()',
      );
    }

    return request.contact;
  },
);
