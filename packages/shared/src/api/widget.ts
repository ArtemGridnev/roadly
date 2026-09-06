import { z } from 'zod';

export const createWidgetFeatureRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().optional(),
});

export type CreateWidgetFeatureRequestInput = z.infer<
  typeof createWidgetFeatureRequestSchema
>;
