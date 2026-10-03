import { FeatureRequestResponseDto } from '../../../feature-requests/dto/feature-request-response.dto';

export type WidgetFeatureRequestResponseDto = FeatureRequestResponseDto & {
  hasVoted: boolean;
};
