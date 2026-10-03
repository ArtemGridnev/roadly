import type { RequestStatus } from './request-status';

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: string | null;
  status: RequestStatus;
  workspaceId: string;
  authorId: string;
  voteCount: number;
  createdAt: string;
}
