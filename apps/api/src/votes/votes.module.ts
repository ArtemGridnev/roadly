import { Module } from '@nestjs/common';
import { FeatureRequestsModule } from '../feature-requests/feature-requests.module';
import { VotesService } from './votes.service';

@Module({
  imports: [FeatureRequestsModule],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}
