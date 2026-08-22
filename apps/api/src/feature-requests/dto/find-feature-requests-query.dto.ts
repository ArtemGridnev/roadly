import { RequestStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FindFeatureRequestsQueryDto {
  @IsString()
  @IsNotEmpty()
  readonly workspaceId!: string;

  @IsOptional()
  @IsEnum(RequestStatus)
  readonly status?: RequestStatus;
}
