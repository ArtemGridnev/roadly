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
import { FeatureRequestsService } from './feature-requests.service';
import { CreateFeatureRequestDto } from './dto/create-feature-request.dto';
import { UpdateFeatureRequestDto } from './dto/update-feature-request.dto';
import { FindFeatureRequestsQueryDto } from './dto/find-feature-requests-query.dto';
import { FeatureRequestResponseDto } from './dto/feature-request-response.dto';
import { WorkspaceMembershipGuard } from '../auth/guards/workspace-membership.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import type { ResolvedWorkspace } from '../auth/types/auth-context';

@UseGuards(WorkspaceMembershipGuard)
@Controller('feature-requests')
export class FeatureRequestsController {
  constructor(
    private readonly featureRequestsService: FeatureRequestsService,
  ) {}

  @Post()
  create(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Body() createFeatureRequestDto: CreateFeatureRequestDto,
  ): Promise<FeatureRequestResponseDto> {
    return this.featureRequestsService.create(
      workspace.id,
      createFeatureRequestDto,
    );
  }

  @Get()
  findAll(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Query() query: FindFeatureRequestsQueryDto,
  ): Promise<FeatureRequestResponseDto[]> {
    return this.featureRequestsService.findAll(workspace.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Param('id') id: string,
  ): Promise<FeatureRequestResponseDto> {
    return this.featureRequestsService.findOneForWorkspace(workspace.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Param('id') id: string,
    @Body() updateFeatureRequestDto: UpdateFeatureRequestDto,
  ): Promise<FeatureRequestResponseDto> {
    await this.featureRequestsService.findOneForWorkspace(workspace.id, id);

    return this.featureRequestsService.update(id, updateFeatureRequestDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Param('id') id: string,
  ): Promise<void> {
    await this.featureRequestsService.findOneForWorkspace(workspace.id, id);

    return this.featureRequestsService.remove(id);
  }
}
