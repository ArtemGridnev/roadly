import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { WorkspaceMembershipGuard } from '../auth/guards/workspace-membership.guard';

@Module({
  imports: [WorkspacesModule],
  controllers: [ContactsController],
  providers: [ContactsService, WorkspaceMembershipGuard],
  exports: [ContactsService],
})
export class ContactsModule {}
