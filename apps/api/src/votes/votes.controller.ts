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
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { UpdateVoteDto } from './dto/update-vote.dto';
import { FindVotesQueryDto } from './dto/find-votes-query.dto';
import { VoteResponseDto } from './dto/vote-response.dto';

@Controller('feature-requests/:requestId/votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  create(
    @Param('requestId') requestId: string,
    @Body() createVoteDto: CreateVoteDto,
  ): Promise<VoteResponseDto> {
    return this.votesService.create(requestId, createVoteDto);
  }

  @Get()
  findAll(
    @Param('requestId') requestId: string,
    @Query() query: FindVotesQueryDto,
  ): Promise<VoteResponseDto[]> {
    return this.votesService.findAll(requestId, query);
  }

  @Get(':id')
  findOne(
    @Param('requestId') requestId: string,
    @Param('id') id: string,
  ): Promise<VoteResponseDto> {
    return this.votesService.findOne(requestId, id);
  }

  @Patch(':id')
  update(
    @Param('requestId') requestId: string,
    @Param('id') id: string,
    @Body() updateVoteDto: UpdateVoteDto,
  ): Promise<VoteResponseDto> {
    return this.votesService.update(requestId, id, updateVoteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('requestId') requestId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.votesService.remove(requestId, id);
  }
}
