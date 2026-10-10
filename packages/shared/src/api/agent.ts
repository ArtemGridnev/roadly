import { z } from 'zod';

export const createAgentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;

export const updateAgentSchema = createAgentSchema.partial();

export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
