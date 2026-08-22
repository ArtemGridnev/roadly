import { Module } from '@nestjs/common';
import { FeatureRequestsService } from './feature-requests.service';
import { FeatureRequestsController } from './feature-requests.controller';

@Module({
  controllers: [FeatureRequestsController],
  providers: [FeatureRequestsService],
  exports: [FeatureRequestsService],
})
export class FeatureRequestsModule {}
