import type { RequestStatus } from './request-status';

export interface FeatureRequestAuthor {
  externalId: string;
  name: string | null;
  email: string | null;
  verified: boolean;
}

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  workspaceId: string;
  authorId: string | null;
  author: FeatureRequestAuthor | null;
  voteCount: number;
  createdAt: string;
}

export interface WidgetFeatureRequest extends Omit<FeatureRequest, 'authorId' | 'author'> {
  hasVoted: boolean;
  isMine: boolean;
}
