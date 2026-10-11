import { FeatureRequestResponseDto } from '../../../feature-requests/dto/feature-request-response.dto';

export type WidgetFeatureRequestResponseDto = Omit<
  FeatureRequestResponseDto,
  'authorId'
> & {
  hasVoted: boolean;
  isMine: boolean;
};
