import { RequestStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

export const FEATURE_REQUEST_SORTS = ['top', 'newest'] as const;

export type FeatureRequestSort = (typeof FEATURE_REQUEST_SORTS)[number];

export class FindFeatureRequestsQueryDto {
  @IsOptional()
  @IsEnum(RequestStatus)
  readonly status?: RequestStatus;

  @IsOptional()
  @IsIn(FEATURE_REQUEST_SORTS)
  readonly sort?: FeatureRequestSort;
}
