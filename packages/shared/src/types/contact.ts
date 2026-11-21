export interface Contact {
  id: string;
  workspaceId: string;
  externalId: string;
  name: string | null;
  email: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
}
