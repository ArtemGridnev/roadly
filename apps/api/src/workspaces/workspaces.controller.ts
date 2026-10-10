import { Controller, Get, Post, Body } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';
import { CurrentAgent } from '../auth/decorators/current-agent.decorator';
import { AccessTokenPayload } from '../auth/dto/access-token-payload.dto';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(
    @CurrentAgent() agent: AccessTokenPayload,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    return this.workspacesService.create(agent.sub, createWorkspaceDto);
  }

  @Get()
  findAll(
    @CurrentAgent() agent: AccessTokenPayload,
  ): Promise<WorkspaceResponseDto[]> {
    return this.workspacesService.findAllForAgent(agent.sub);
  }
}
