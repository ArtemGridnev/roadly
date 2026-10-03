import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest, ResolvedContact } from '../types/auth-context';

export const OptionalContact = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): ResolvedContact | undefined =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().contact,
);
