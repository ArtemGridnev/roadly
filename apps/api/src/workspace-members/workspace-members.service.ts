import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { WorkspaceMemberResponseDto } from './dto/workspace-member-response.dto';

@Injectable()
export class WorkspaceMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async findAll(workspaceId: string): Promise<WorkspaceMemberResponseDto[]> {
    await this.workspacesService.findOne(workspaceId);

    const workspaceMembers = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return workspaceMembers.map(WorkspaceMemberResponseDto.fromEntity);
  }

  async findOne(
    workspaceId: string,
    id: string,
  ): Promise<WorkspaceMemberResponseDto> {
    await this.workspacesService.findOne(workspaceId);

    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: { id },
    });

    if (!workspaceMember || workspaceMember.workspaceId !== workspaceId) {
      throw new NotFoundException(
        `Workspace member ${id} not found for workspace ${workspaceId}`,
      );
    }

    return WorkspaceMemberResponseDto.fromEntity(workspaceMember);
  }
}
