import { z } from 'zod';

export const languageSchema = z.enum(['en', 'he']);

export type Language = z.infer<typeof languageSchema>;
