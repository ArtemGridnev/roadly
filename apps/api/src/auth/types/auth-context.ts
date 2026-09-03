import type { Request } from 'express';
import type { AccessTokenPayload } from '../dto/access-token-payload.dto';

export interface ResolvedWorkspace {
  readonly id: string;
}

export interface ResolvedContact {
  readonly id: string;
  readonly workspaceId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
  workspace?: ResolvedWorkspace;
  contact?: ResolvedContact;
}
