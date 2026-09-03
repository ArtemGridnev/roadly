import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthenticatedRequest, ResolvedWorkspace } from '../types/auth-context';

export const CurrentWorkspace = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): ResolvedWorkspace => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.workspace) {
      throw new InternalServerErrorException(
        '@CurrentWorkspace() used on a route without @WidgetAuth() or @UseGuards(WorkspaceMembershipGuard)',
      );
    }

    return request.workspace;
  },
);
