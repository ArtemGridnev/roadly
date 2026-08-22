import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspaceMembersController } from './workspace-members.controller';

@Module({
  imports: [WorkspacesModule],
  controllers: [WorkspaceMembersController],
  providers: [WorkspaceMembersService],
})
export class WorkspaceMembersModule {}
