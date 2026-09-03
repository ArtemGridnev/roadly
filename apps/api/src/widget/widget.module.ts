import { Module } from '@nestjs/common';
import { ContactsModule } from '../contacts/contacts.module';
import { FeatureRequestsModule } from '../feature-requests/feature-requests.module';
import { VotesModule } from '../votes/votes.module';
import { WidgetContactsController } from './contacts/widget-contacts.controller';
import { WidgetFeatureRequestsController } from './feature-requests/widget-feature-requests.controller';
import { WidgetVotesController } from './votes/widget-votes.controller';

@Module({
  imports: [ContactsModule, FeatureRequestsModule, VotesModule],
  controllers: [
    WidgetContactsController,
    WidgetFeatureRequestsController,
    WidgetVotesController,
  ],
})
export class WidgetModule {}
