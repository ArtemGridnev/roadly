import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContactsModule } from '../contacts/contacts.module';
import { FeatureRequestsModule } from '../feature-requests/feature-requests.module';
import { VotesModule } from '../votes/votes.module';
import { WorkspaceIdentityModule } from '../workspace-identity/workspace-identity.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { WidgetFeatureRequestsController } from './feature-requests/widget-feature-requests.controller';
import { WidgetFeatureRequestsService } from './feature-requests/widget-feature-requests.service';
import { WidgetSessionController } from './session/widget-session.controller';
import { WidgetSessionService } from './session/widget-session.service';
import { WidgetVotesController } from './votes/widget-votes.controller';

@Module({
  imports: [
    AuthModule,
    ContactsModule,
    FeatureRequestsModule,
    VotesModule,
    WorkspacesModule,
    WorkspaceIdentityModule,
  ],
  controllers: [
    WidgetSessionController,
    WidgetFeatureRequestsController,
    WidgetVotesController,
  ],
  providers: [WidgetFeatureRequestsService, WidgetSessionService],
})
export class WidgetModule {}
