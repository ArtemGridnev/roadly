import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { FeatureRequestsService } from '../feature-requests/feature-requests.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { UpdateVoteDto } from './dto/update-vote.dto';
import { FindVotesQueryDto } from './dto/find-votes-query.dto';
import { VoteResponseDto } from './dto/vote-response.dto';
import { WorkspaceMembershipGuard } from '../auth/guards/workspace-membership.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import type { ResolvedWorkspace } from '../auth/types/auth-context';

@UseGuards(WorkspaceMembershipGuard)
@Controller('feature-requests/:requestId/votes')
export class VotesController {
  constructor(
    private readonly votesService: VotesService,
    private readonly featureRequestsService: FeatureRequestsService,
  ) {}

  @Post()
  async create(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Param('requestId') requestId: string,
    @Body() createVoteDto: CreateVoteDto,
  ): Promise<VoteResponseDto> {
    await this.featureRequestsService.findOneForWorkspace(
      workspace.id,
      requestId,
    );

    return this.votesService.create(requestId, createVoteDto);
  }

  @Get()
  async findAll(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Param('requestId') requestId: string,
    @Query() query: FindVotesQueryDto,
  ): Promise<VoteResponseDto[]> {
    await this.featureRequestsService.findOneForWorkspace(
      workspace.id,
      requestId,
    );

    return this.votesService.findAll(requestId, query);
  }

  @Get(':id')
  async findOne(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Param('requestId') requestId: string,
    @Param('id') id: string,
  ): Promise<VoteResponseDto> {
    await this.featureRequestsService.findOneForWorkspace(
      workspace.id,
      requestId,
    );

    return this.votesService.findOne(requestId, id);
  }

  @Patch(':id')
  async update(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Param('requestId') requestId: string,
    @Param('id') id: string,
    @Body() updateVoteDto: UpdateVoteDto,
  ): Promise<VoteResponseDto> {
    await this.featureRequestsService.findOneForWorkspace(
      workspace.id,
      requestId,
    );

    return this.votesService.update(requestId, id, updateVoteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Param('requestId') requestId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.featureRequestsService.findOneForWorkspace(
      workspace.id,
      requestId,
    );

    return this.votesService.remove(requestId, id);
  }
}
