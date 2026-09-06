import { z } from 'zod';

export const createVoteSchema = z.object({
  contactId: z.string().min(1),
});

export type CreateVoteInput = z.infer<typeof createVoteSchema>;

export const updateVoteSchema = createVoteSchema.partial();

export type UpdateVoteInput = z.infer<typeof updateVoteSchema>;

export const findVotesQuerySchema = z.object({
  contactId: z.string().optional(),
});

export type FindVotesQuery = z.infer<typeof findVotesQuerySchema>;
