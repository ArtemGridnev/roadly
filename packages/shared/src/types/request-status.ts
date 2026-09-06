import { z } from 'zod';

export const requestStatusSchema = z.enum([
  'BACKLOG',
  'PLANNED',
  'IN_PROGRESS',
  'SHIPPED',
]);

export type RequestStatus = z.infer<typeof requestStatusSchema>;
