import { Body, Controller, Get, Post } from '@nestjs/common';
import { FeatureRequestsService } from '../../feature-requests/feature-requests.service';
import { FeatureRequestResponseDto } from '../../feature-requests/dto/feature-request-response.dto';
import { CreateWidgetFeatureRequestDto } from './dto/create-widget-feature-request.dto';
import { WidgetAuth } from '../../auth/decorators/widget-auth.decorator';
import { RequireContact } from '../../auth/decorators/require-contact.decorator';
import { CurrentWorkspace } from '../../auth/decorators/current-workspace.decorator';
import { CurrentContact } from '../../auth/decorators/current-contact.decorator';
import type {
  ResolvedContact,
  ResolvedWorkspace,
} from '../../auth/types/auth-context';

@WidgetAuth()
@Controller('widget/feature-requests')
export class WidgetFeatureRequestsController {
  constructor(
    private readonly featureRequestsService: FeatureRequestsService,
  ) {}

  @Get()
  findAll(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
  ): Promise<FeatureRequestResponseDto[]> {
    return this.featureRequestsService.findAll(workspace.id, {});
  }

  @RequireContact()
  @Post()
  create(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @CurrentContact() contact: ResolvedContact,
    @Body() createFeatureRequestDto: CreateWidgetFeatureRequestDto,
  ): Promise<FeatureRequestResponseDto> {
    return this.featureRequestsService.create(workspace.id, {
      ...createFeatureRequestDto,
      authorId: contact.id,
    });
  }
}
