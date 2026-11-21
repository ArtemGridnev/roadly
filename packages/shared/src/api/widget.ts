import { z } from 'zod';

export const createWidgetFeatureRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export type CreateWidgetFeatureRequestInput = z.infer<
  typeof createWidgetFeatureRequestSchema
>;

export const createSignedWidgetSessionSchema = z.object({
  token: z.string().min(1),
});

export type CreateSignedWidgetSessionInput = z.infer<
  typeof createSignedWidgetSessionSchema
>;

export const widgetFeatureRequestSortSchema = z.enum(['top', 'newest']);

export type WidgetFeatureRequestSort = z.infer<
  typeof widgetFeatureRequestSortSchema
>;

export const findWidgetFeatureRequestsQuerySchema = z.object({
  sort: widgetFeatureRequestSortSchema.optional(),
});

export type FindWidgetFeatureRequestsQuery = z.infer<
  typeof findWidgetFeatureRequestsQuerySchema
>;
