import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';

@Module({
  imports: [WorkspacesModule],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
