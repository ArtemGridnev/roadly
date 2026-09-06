import { z } from 'zod';

export const createContactSchema = z.object({
  externalId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;

export const updateContactSchema = createContactSchema.partial();

export type UpdateContactInput = z.infer<typeof updateContactSchema>;
