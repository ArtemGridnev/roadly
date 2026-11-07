import { z } from 'zod';
import { languageSchema } from '../types/language';

export const createAgentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
  language: languageSchema.optional(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;

export const updateAgentSchema = createAgentSchema.partial();

export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;

export const updateCurrentAgentSchema = z.object({
  language: languageSchema,
});

export type UpdateCurrentAgentInput = z.infer<typeof updateCurrentAgentSchema>;
