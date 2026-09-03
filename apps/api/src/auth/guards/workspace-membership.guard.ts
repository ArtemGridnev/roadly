import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WORKSPACE_ID_HEADER } from '../constants/workspace-header';
import { AuthenticatedRequest } from '../types/auth-context';

@Injectable()
export class WorkspaceMembershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const workspaceId = request.header(WORKSPACE_ID_HEADER);
    if (!workspaceId) {
      throw new BadRequestException(`Missing ${WORKSPACE_ID_HEADER} header`);
    }

    const agentId = request.user?.sub;
    if (!agentId) {
      throw new ForbiddenException('No authenticated agent on request');
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_agentId: { workspaceId, agentId } },
    });

    if (!membership) {
      throw new ForbiddenException(
        `Agent is not a member of workspace ${workspaceId}`,
      );
    }

    request.workspace = { id: workspaceId };

    return true;
  }
}
