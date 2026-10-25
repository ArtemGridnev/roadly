import { FeatureRequest, RequestStatus } from '@prisma/client';

export interface FeatureRequestAuthor {
  name: string;
  email: string;
}

export type FeatureRequestWithVoteCount = FeatureRequest & {
  _count: { votes: number };
  author: FeatureRequestAuthor | null;
};

export const featureRequestVoteCountSelect = {
  _count: { select: { votes: true } },
  author: { select: { name: true, email: true } },
} as const;

export class FeatureRequestResponseDto {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string | null;
  readonly status: RequestStatus;
  readonly workspaceId: string;
  readonly authorId: string | null;
  readonly author: FeatureRequestAuthor | null;
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
    this.author = featureRequest.author;
    this.voteCount = featureRequest._count.votes;
    this.createdAt = featureRequest.createdAt;
  }

  static fromEntity(
    featureRequest: FeatureRequestWithVoteCount,
  ): FeatureRequestResponseDto {
    return new FeatureRequestResponseDto(featureRequest);
  }
}
