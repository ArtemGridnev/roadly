import { Injectable } from '@nestjs/common';
import { FeatureRequestsService } from '../../feature-requests/feature-requests.service';
import { VotesService } from '../../votes/votes.service';
import { FindWidgetFeatureRequestsQueryDto } from './dto/find-widget-feature-requests-query.dto';
import { WidgetFeatureRequestResponseDto } from './dto/widget-feature-request-response.dto';

@Injectable()
export class WidgetFeatureRequestsService {
  constructor(
    private readonly featureRequestsService: FeatureRequestsService,
    private readonly votesService: VotesService,
  ) {}

  async findAll(
    workspaceId: string,
    contactId: string | undefined,
    query: FindWidgetFeatureRequestsQueryDto,
  ): Promise<WidgetFeatureRequestResponseDto[]> {
    const featureRequests = await this.featureRequestsService.findAll(
      workspaceId,
      { sort: query.sort },
    );

    const votedIds = contactId
      ? await this.votesService.findVotedRequestIds(
          contactId,
          featureRequests.map((featureRequest) => featureRequest.id),
        )
      : new Set<string>();

    return featureRequests.map((featureRequest) => ({
      ...featureRequest,
      hasVoted: votedIds.has(featureRequest.id),
    }));
  }
}
