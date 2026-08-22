import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateFeatureRequestDto } from './create-feature-request.dto';

export class UpdateFeatureRequestDto extends PartialType(
  OmitType(CreateFeatureRequestDto, ['workspaceId', 'authorId'] as const),
) {}
