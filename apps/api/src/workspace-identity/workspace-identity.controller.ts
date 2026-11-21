import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { WorkspaceMembershipGuard } from '../auth/guards/workspace-membership.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import type { ResolvedWorkspace } from '../auth/types/auth-context';
import { WorkspaceIdentityService } from './workspace-identity.service';
import { IdentitySecretResponseDto } from './dto/identity-secret-response.dto';
import { UpdateWorkspaceIdentityDto } from './dto/update-workspace-identity.dto';
import { WorkspaceIdentityResponseDto } from './dto/workspace-identity-response.dto';

@UseGuards(WorkspaceMembershipGuard)
@Controller('workspace-identity')
export class WorkspaceIdentityController {
  constructor(
    private readonly workspaceIdentityService: WorkspaceIdentityService,
  ) {}

  @Get()
  getStatus(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
  ): Promise<WorkspaceIdentityResponseDto> {
    return this.workspaceIdentityService.getStatus(workspace.id);
  }

  @Post('secret')
  rotateSecret(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
  ): Promise<IdentitySecretResponseDto> {
    return this.workspaceIdentityService.rotateSecret(workspace.id);
  }

  @Patch()
  update(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Body() updateWorkspaceIdentityDto: UpdateWorkspaceIdentityDto,
  ): Promise<WorkspaceIdentityResponseDto> {
    return this.workspaceIdentityService.update(
      workspace.id,
      updateWorkspaceIdentityDto,
    );
  }
}
