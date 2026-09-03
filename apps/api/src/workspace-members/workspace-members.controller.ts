import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { WorkspaceMembersService } from './workspace-members.service';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto';
import { WorkspaceMemberResponseDto } from './dto/workspace-member-response.dto';
import { WorkspaceMembershipGuard } from '../auth/guards/workspace-membership.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import type { ResolvedWorkspace } from '../auth/types/auth-context';

@UseGuards(WorkspaceMembershipGuard)
@Controller('workspace-members')
export class WorkspaceMembersController {
  constructor(
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  @Post()
  create(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Body() createWorkspaceMemberDto: CreateWorkspaceMemberDto,
  ): Promise<WorkspaceMemberResponseDto> {
    return this.workspaceMembersService.create(
      workspace.id,
      createWorkspaceMemberDto,
    );
  }

  @Get()
  findAll(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
  ): Promise<WorkspaceMemberResponseDto[]> {
    return this.workspaceMembersService.findAll(workspace.id);
  }

  @Get(':id')
  findOne(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Param('id') id: string,
  ): Promise<WorkspaceMemberResponseDto> {
    return this.workspaceMembersService.findOne(workspace.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Param('id') id: string,
  ): Promise<void> {
    return this.workspaceMembersService.remove(workspace.id, id);
  }
}
