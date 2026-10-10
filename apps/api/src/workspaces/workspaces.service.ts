import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    agentId: string,
    createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    try {
      const workspace = await this.prisma.workspace.create({
        data: { ...createWorkspaceDto, members: { create: { agentId } } },
      });

      return WorkspaceResponseDto.fromEntity(workspace);
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async findAllForAgent(agentId: string): Promise<WorkspaceResponseDto[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: { members: { some: { agentId } } },
      orderBy: { createdAt: 'desc' },
    });

    return workspaces.map(WorkspaceResponseDto.fromEntity);
  }

  async findOne(id: string): Promise<WorkspaceResponseDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }

    return WorkspaceResponseDto.fromEntity(workspace);
  }

  async findByWidgetKey(widgetKey: string): Promise<WorkspaceResponseDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { widgetKey },
    });

    if (!workspace) {
      throw new NotFoundException(
        `Workspace with widget key ${widgetKey} not found`,
      );
    }

    return WorkspaceResponseDto.fromEntity(workspace);
  }

  async update(
    id: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    await this.findOne(id);

    try {
      const workspace = await this.prisma.workspace.update({
        where: { id },
        data: updateWorkspaceDto,
      });

      return WorkspaceResponseDto.fromEntity(workspace);
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.workspace.delete({ where: { id } });
  }

  private mapKnownError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException('A workspace with this slug already exists');
    }

    return error;
  }
}
