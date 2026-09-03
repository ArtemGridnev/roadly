import { RequestStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class FindFeatureRequestsQueryDto {
  @IsOptional()
  @IsEnum(RequestStatus)
  readonly status?: RequestStatus;
}
