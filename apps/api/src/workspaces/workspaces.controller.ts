import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
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

  @Get(':id')
  findOne(@Param('id') id: string): Promise<WorkspaceResponseDto> {
    return this.workspacesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    return this.workspacesService.update(id, updateWorkspaceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.workspacesService.remove(id);
  }
}
