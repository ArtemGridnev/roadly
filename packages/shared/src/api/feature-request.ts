import { z } from 'zod';
import { requestStatusSchema } from '../types/request-status';

export const createFeatureRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().optional(),
  status: requestStatusSchema.optional(),
});

export type CreateFeatureRequestInput = z.infer<
  typeof createFeatureRequestSchema
>;

export const updateFeatureRequestSchema = createFeatureRequestSchema.partial();

export type UpdateFeatureRequestInput = z.infer<
  typeof updateFeatureRequestSchema
>;

export const findFeatureRequestsQuerySchema = z.object({
  status: requestStatusSchema.optional(),
});

export type FindFeatureRequestsQuery = z.infer<
  typeof findFeatureRequestsQuerySchema
>;
