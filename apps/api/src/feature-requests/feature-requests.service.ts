import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeatureRequestDto } from './dto/create-feature-request.dto';
import { UpdateFeatureRequestDto } from './dto/update-feature-request.dto';
import { FindFeatureRequestsQueryDto } from './dto/find-feature-requests-query.dto';
import {
  FeatureRequestResponseDto,
  featureRequestVoteCountSelect,
} from './dto/feature-request-response.dto';

@Injectable()
export class FeatureRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    workspaceId: string,
    createFeatureRequestDto: CreateFeatureRequestDto,
    { withAuthorVote = false }: { withAuthorVote?: boolean } = {},
  ): Promise<FeatureRequestResponseDto> {
    const featureRequest = await this.prisma.featureRequest.create({
      data: {
        ...createFeatureRequestDto,
        workspaceId,
        votes: withAuthorVote
          ? { create: { contactId: createFeatureRequestDto.authorId } }
          : undefined,
      },
      include: featureRequestVoteCountSelect,
    });

    return FeatureRequestResponseDto.fromEntity(featureRequest);
  }

  async findAll(
    workspaceId: string,
    query: FindFeatureRequestsQueryDto,
  ): Promise<FeatureRequestResponseDto[]> {
    const featureRequests = await this.prisma.featureRequest.findMany({
      where: {
        workspaceId,
        status: query.status,
      },
      include: featureRequestVoteCountSelect,
      orderBy:
        query.sort === 'top'
          ? [{ votes: { _count: 'desc' } }, { createdAt: 'desc' }]
          : { createdAt: 'desc' },
    });

    return featureRequests.map(FeatureRequestResponseDto.fromEntity);
  }

  async findOne(id: string): Promise<FeatureRequestResponseDto> {
    const featureRequest = await this.prisma.featureRequest.findUnique({
      where: { id },
      include: featureRequestVoteCountSelect,
    });

    if (!featureRequest) {
      throw new NotFoundException(`Feature request ${id} not found`);
    }

    return FeatureRequestResponseDto.fromEntity(featureRequest);
  }

  async findOneForWorkspace(
    workspaceId: string,
    id: string,
  ): Promise<FeatureRequestResponseDto> {
    const featureRequest = await this.prisma.featureRequest.findUnique({
      where: { id },
      include: featureRequestVoteCountSelect,
    });

    if (!featureRequest || featureRequest.workspaceId !== workspaceId) {
      throw new NotFoundException(
        `Feature request ${id} not found for workspace ${workspaceId}`,
      );
    }

    return FeatureRequestResponseDto.fromEntity(featureRequest);
  }

  async update(
    id: string,
    updateFeatureRequestDto: UpdateFeatureRequestDto,
  ): Promise<FeatureRequestResponseDto> {
    await this.findOne(id);

    const featureRequest = await this.prisma.featureRequest.update({
      where: { id },
      data: updateFeatureRequestDto,
      include: featureRequestVoteCountSelect,
    });

    return FeatureRequestResponseDto.fromEntity(featureRequest);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.featureRequest.delete({ where: { id } });
  }
}
