import { Module } from '@nestjs/common';
import { FeatureRequestsModule } from '../feature-requests/feature-requests.module';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';

@Module({
  imports: [FeatureRequestsModule],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
