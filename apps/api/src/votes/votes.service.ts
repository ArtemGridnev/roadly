import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FeatureRequestsService } from '../feature-requests/feature-requests.service';
import { CreateVoteDto } from './dto/create-vote.dto';
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
    await this.assertVotingOpen(requestId);

    try {
      const vote = await this.prisma.vote.create({
        data: { ...createVoteDto, requestId },
      });

      return VoteResponseDto.fromEntity(vote);
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async findVotedRequestIds(
    contactId: string,
    requestIds: string[],
  ): Promise<Set<string>> {
    const votes = await this.prisma.vote.findMany({
      where: { contactId, requestId: { in: requestIds } },
      select: { requestId: true },
    });

    return new Set(votes.map((vote) => vote.requestId));
  }

  async removeForContact(requestId: string, contactId: string): Promise<void> {
    await this.assertVotingOpen(requestId);

    const { count } = await this.prisma.vote.deleteMany({
      where: { requestId, contactId },
    });

    if (count === 0) {
      throw new NotFoundException(
        `Contact ${contactId} has not voted for feature request ${requestId}`,
      );
    }
  }

  private async assertVotingOpen(requestId: string): Promise<void> {
    const featureRequest = await this.featureRequestsService.findOne(requestId);

    if (featureRequest.status === RequestStatus.SHIPPED) {
      throw new ConflictException(
        'Voting is closed for shipped feature requests',
      );
    }
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
