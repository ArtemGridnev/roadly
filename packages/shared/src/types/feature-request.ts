import type { RequestStatus } from './request-status';

export interface FeatureRequestAuthor {
  name: string;
  email: string;
}

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: string | null;
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
