import { PartialType } from '@nestjs/mapped-types';
import { CreateFeatureRequestDto } from './create-feature-request.dto';

export class UpdateFeatureRequestDto extends PartialType(
  CreateFeatureRequestDto,
) {}
