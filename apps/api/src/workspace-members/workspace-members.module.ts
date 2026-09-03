import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspaceMembersController } from './workspace-members.controller';
import { WorkspaceMembershipGuard } from '../auth/guards/workspace-membership.guard';

@Module({
  imports: [WorkspacesModule],
  controllers: [WorkspaceMembersController],
  providers: [WorkspaceMembersService, WorkspaceMembershipGuard],
})
export class WorkspaceMembersModule {}
