import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { WorkspaceMembersService } from './workspace-members.service';
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
}
