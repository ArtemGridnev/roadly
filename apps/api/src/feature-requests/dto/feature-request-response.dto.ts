import { FeatureRequest, RequestStatus } from '@prisma/client';

export interface FeatureRequestAuthor {
  externalId: string;
  name: string | null;
  email: string | null;
  verified: boolean;
}

interface FeatureRequestAuthorRow {
  externalId: string;
  name: string | null;
  email: string | null;
}

export type FeatureRequestWithVoteCount = FeatureRequest & {
  _count: { votes: number };
  author: FeatureRequestAuthorRow | null;
};

export const featureRequestVoteCountSelect = {
  _count: { select: { votes: true } },
  author: {
    select: { externalId: true, name: true, email: true },
  },
} as const;

export class FeatureRequestResponseDto {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: RequestStatus;
  readonly workspaceId: string;
  readonly authorId: string | null;
  readonly author: FeatureRequestAuthor | null;
  readonly voteCount: number;
  readonly createdAt: Date;

  constructor(featureRequest: FeatureRequestWithVoteCount) {
    const { author } = featureRequest;

    this.id = featureRequest.id;
    this.title = featureRequest.title;
    this.description = featureRequest.description;
    this.status = featureRequest.status;
    this.workspaceId = featureRequest.workspaceId;
    this.authorId = featureRequest.authorId;
    this.author = author && {
      externalId: author.externalId,
      name: author.name,
      email: author.email,
      verified: featureRequest.authorVerified,
    };
    this.voteCount = featureRequest._count.votes;
    this.createdAt = featureRequest.createdAt;
  }

  static fromEntity(
    featureRequest: FeatureRequestWithVoteCount,
  ): FeatureRequestResponseDto {
    return new FeatureRequestResponseDto(featureRequest);
  }
}
