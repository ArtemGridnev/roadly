import { RequestStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFeatureRequestDto {
  @IsString()
  @IsNotEmpty()
  readonly title!: string;

  @IsString()
  @IsNotEmpty()
  readonly description!: string;

  @IsOptional()
  @IsEnum(RequestStatus)
  readonly status?: RequestStatus;
}
