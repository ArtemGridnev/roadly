import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto';
import { WorkspaceMemberResponseDto } from './dto/workspace-member-response.dto';

@Injectable()
export class WorkspaceMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async create(
    workspaceId: string,
    createWorkspaceMemberDto: CreateWorkspaceMemberDto,
  ): Promise<WorkspaceMemberResponseDto> {
    await this.workspacesService.findOne(workspaceId);

    try {
      const workspaceMember = await this.prisma.workspaceMember.create({
        data: { ...createWorkspaceMemberDto, workspaceId },
      });

      return WorkspaceMemberResponseDto.fromEntity(workspaceMember);
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

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

  async remove(workspaceId: string, id: string): Promise<void> {
    await this.findOne(workspaceId, id);

    await this.prisma.workspaceMember.delete({ where: { id } });
  }

  private mapKnownError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(
        'This agent is already a member of the workspace',
      );
    }

    return error;
  }
}
