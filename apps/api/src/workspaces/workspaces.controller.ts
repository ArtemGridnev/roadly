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

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    return this.workspacesService.create(createWorkspaceDto);
  }

  @Get()
  findAll(): Promise<WorkspaceResponseDto[]> {
    return this.workspacesService.findAll();
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
