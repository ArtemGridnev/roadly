import { FeatureRequest, RequestStatus } from '@prisma/client';

export type FeatureRequestWithVoteCount = FeatureRequest & {
  _count: { votes: number };
};

export const featureRequestVoteCountSelect = {
  _count: { select: { votes: true } },
} as const;

export class FeatureRequestResponseDto {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string | null;
  readonly status: RequestStatus;
  readonly workspaceId: string;
  readonly authorId: string;
  readonly voteCount: number;
  readonly createdAt: Date;

  constructor(featureRequest: FeatureRequestWithVoteCount) {
    this.id = featureRequest.id;
    this.title = featureRequest.title;
    this.description = featureRequest.description;
    this.category = featureRequest.category;
    this.status = featureRequest.status;
    this.workspaceId = featureRequest.workspaceId;
    this.authorId = featureRequest.authorId;
    this.voteCount = featureRequest._count.votes;
    this.createdAt = featureRequest.createdAt;
  }

  static fromEntity(
    featureRequest: FeatureRequestWithVoteCount,
  ): FeatureRequestResponseDto {
    return new FeatureRequestResponseDto(featureRequest);
  }
}
