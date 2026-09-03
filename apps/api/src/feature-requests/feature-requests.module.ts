import { Module } from '@nestjs/common';
import { FeatureRequestsService } from './feature-requests.service';
import { FeatureRequestsController } from './feature-requests.controller';
import { WorkspaceMembershipGuard } from '../auth/guards/workspace-membership.guard';

@Module({
  controllers: [FeatureRequestsController],
  providers: [FeatureRequestsService, WorkspaceMembershipGuard],
  exports: [FeatureRequestsService],
})
export class FeatureRequestsModule {}
