import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { FeatureRequestsService } from '../../feature-requests/feature-requests.service';
import { WidgetFeatureRequestsService } from './widget-feature-requests.service';
import { FeatureRequestResponseDto } from '../../feature-requests/dto/feature-request-response.dto';
import { CreateWidgetFeatureRequestDto } from './dto/create-widget-feature-request.dto';
import { FindWidgetFeatureRequestsQueryDto } from './dto/find-widget-feature-requests-query.dto';
import { WidgetFeatureRequestResponseDto } from './dto/widget-feature-request-response.dto';
import { WidgetAuth } from '../../auth/decorators/widget-auth.decorator';
import { RequireContact } from '../../auth/decorators/require-contact.decorator';
import { CurrentWorkspace } from '../../auth/decorators/current-workspace.decorator';
import { CurrentContact } from '../../auth/decorators/current-contact.decorator';
import { OptionalContact } from '../../auth/decorators/optional-contact.decorator';
import type {
  ResolvedContact,
  ResolvedWorkspace,
} from '../../auth/types/auth-context';

@WidgetAuth()
@Controller('widget/feature-requests')
export class WidgetFeatureRequestsController {
  constructor(
    private readonly featureRequestsService: FeatureRequestsService,
    private readonly widgetFeatureRequestsService: WidgetFeatureRequestsService,
  ) {}

  @Get()
  findAll(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @OptionalContact() contact: ResolvedContact | undefined,
    @Query() query: FindWidgetFeatureRequestsQueryDto,
  ): Promise<WidgetFeatureRequestResponseDto[]> {
    return this.widgetFeatureRequestsService.findAll(
      workspace.id,
      contact?.id,
      query,
    );
  }

  @RequireContact()
  @Post()
  create(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @CurrentContact() contact: ResolvedContact,
    @Body() createFeatureRequestDto: CreateWidgetFeatureRequestDto,
  ): Promise<FeatureRequestResponseDto> {
    return this.featureRequestsService.create(
      workspace.id,
      { ...createFeatureRequestDto, authorId: contact.id },
      { withAuthorVote: true },
    );
  }
}
