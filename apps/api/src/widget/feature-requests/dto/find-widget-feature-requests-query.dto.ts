import { IsIn, IsOptional } from 'class-validator';
import {
  FEATURE_REQUEST_SORTS,
  type FeatureRequestSort,
} from '../../../feature-requests/dto/find-feature-requests-query.dto';

export class FindWidgetFeatureRequestsQueryDto {
  @IsOptional()
  @IsIn(FEATURE_REQUEST_SORTS)
  readonly sort?: FeatureRequestSort;
}
