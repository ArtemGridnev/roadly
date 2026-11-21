import { z } from 'zod';

export const updateWorkspaceIdentitySchema = z.object({
  requireSignedIdentity: z.boolean(),
});

export type UpdateWorkspaceIdentityInput = z.infer<
  typeof updateWorkspaceIdentitySchema
>;
