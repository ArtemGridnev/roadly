import { Module } from '@nestjs/common';
import { FeatureRequestsModule } from '../feature-requests/feature-requests.module';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { WorkspaceMembershipGuard } from '../auth/guards/workspace-membership.guard';

@Module({
  imports: [FeatureRequestsModule],
  controllers: [VotesController],
  providers: [VotesService, WorkspaceMembershipGuard],
  exports: [VotesService],
})
export class VotesModule {}
