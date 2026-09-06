import { z } from 'zod';

export const createWorkspaceMemberSchema = z.object({
  agentId: z.string().min(1),
});

export type CreateWorkspaceMemberInput = z.infer<
  typeof createWorkspaceMemberSchema
>;
