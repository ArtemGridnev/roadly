import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContactsModule } from '../contacts/contacts.module';
import { FeatureRequestsModule } from '../feature-requests/feature-requests.module';
import { VotesModule } from '../votes/votes.module';
import { WidgetContactsController } from './contacts/widget-contacts.controller';
import { WidgetFeatureRequestsController } from './feature-requests/widget-feature-requests.controller';
import { WidgetFeatureRequestsService } from './feature-requests/widget-feature-requests.service';
import { WidgetSessionController } from './session/widget-session.controller';
import { WidgetVotesController } from './votes/widget-votes.controller';

@Module({
  imports: [AuthModule, ContactsModule, FeatureRequestsModule, VotesModule],
  controllers: [
    WidgetContactsController,
    WidgetSessionController,
    WidgetFeatureRequestsController,
    WidgetVotesController,
  ],
  providers: [WidgetFeatureRequestsService],
})
export class WidgetModule {}
