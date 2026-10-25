import { RequestStatus } from '@prisma/client';
import { FeatureRequestResponseDto } from '../../../feature-requests/dto/feature-request-response.dto';

export class WidgetFeatureRequestResponseDto {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string | null;
  readonly status: RequestStatus;
  readonly workspaceId: string;
  readonly voteCount: number;
  readonly createdAt: Date;
  readonly hasVoted: boolean;
  readonly isMine: boolean;

  constructor(
    featureRequest: FeatureRequestResponseDto,
    { hasVoted, isMine }: { hasVoted: boolean; isMine: boolean },
  ) {
    this.id = featureRequest.id;
    this.title = featureRequest.title;
    this.description = featureRequest.description;
    this.category = featureRequest.category;
    this.status = featureRequest.status;
    this.workspaceId = featureRequest.workspaceId;
    this.voteCount = featureRequest.voteCount;
    this.createdAt = featureRequest.createdAt;
    this.hasVoted = hasVoted;
    this.isMine = isMine;
  }

  static fromFeatureRequest(
    featureRequest: FeatureRequestResponseDto,
    viewer: { hasVoted: boolean; isMine: boolean },
  ): WidgetFeatureRequestResponseDto {
    return new WidgetFeatureRequestResponseDto(featureRequest, viewer);
  }
}
