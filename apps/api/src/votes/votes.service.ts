import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FeatureRequestsService } from '../feature-requests/feature-requests.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { UpdateVoteDto } from './dto/update-vote.dto';
import { FindVotesQueryDto } from './dto/find-votes-query.dto';
import { VoteResponseDto } from './dto/vote-response.dto';

@Injectable()
export class VotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featureRequestsService: FeatureRequestsService,
  ) {}

  async create(
    requestId: string,
    createVoteDto: CreateVoteDto,
  ): Promise<VoteResponseDto> {
    await this.featureRequestsService.findOne(requestId);

    try {
      const vote = await this.prisma.vote.create({
        data: { ...createVoteDto, requestId },
      });

      return VoteResponseDto.fromEntity(vote);
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async findAll(
    requestId: string,
    query: FindVotesQueryDto,
  ): Promise<VoteResponseDto[]> {
    await this.featureRequestsService.findOne(requestId);

    const votes = await this.prisma.vote.findMany({
      where: { requestId, contactId: query.contactId },
      orderBy: { createdAt: 'desc' },
    });

    return votes.map(VoteResponseDto.fromEntity);
  }

  async findOne(requestId: string, id: string): Promise<VoteResponseDto> {
    await this.featureRequestsService.findOne(requestId);

    const vote = await this.prisma.vote.findUnique({ where: { id } });

    if (!vote || vote.requestId !== requestId) {
      throw new NotFoundException(
        `Vote ${id} not found for feature request ${requestId}`,
      );
    }

    return VoteResponseDto.fromEntity(vote);
  }

  async update(
    requestId: string,
    id: string,
    updateVoteDto: UpdateVoteDto,
  ): Promise<VoteResponseDto> {
    await this.findOne(requestId, id);

    try {
      const vote = await this.prisma.vote.update({
        where: { id },
        data: updateVoteDto,
      });

      return VoteResponseDto.fromEntity(vote);
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async remove(requestId: string, id: string): Promise<void> {
    await this.findOne(requestId, id);

    await this.prisma.vote.delete({ where: { id } });
  }

  private mapKnownError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(
        'Contact has already voted for this request',
      );
    }

    return error;
  }
}
