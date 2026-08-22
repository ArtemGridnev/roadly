import { FeatureRequest, RequestStatus } from '@prisma/client';

export class FeatureRequestResponseDto {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string | null;
  readonly status: RequestStatus;
  readonly workspaceId: string;
  readonly authorId: string;
  readonly createdAt: Date;

  constructor(featureRequest: FeatureRequest) {
    this.id = featureRequest.id;
    this.title = featureRequest.title;
    this.description = featureRequest.description;
    this.category = featureRequest.category;
    this.status = featureRequest.status;
    this.workspaceId = featureRequest.workspaceId;
    this.authorId = featureRequest.authorId;
    this.createdAt = featureRequest.createdAt;
  }

  static fromEntity(featureRequest: FeatureRequest): FeatureRequestResponseDto {
    return new FeatureRequestResponseDto(featureRequest);
  }
}
