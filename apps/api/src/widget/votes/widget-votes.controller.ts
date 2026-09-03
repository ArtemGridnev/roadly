import { Controller, Param, Post } from '@nestjs/common';
import { VotesService } from '../../votes/votes.service';
import { FeatureRequestsService } from '../../feature-requests/feature-requests.service';
import { VoteResponseDto } from '../../votes/dto/vote-response.dto';
import { WidgetAuth } from '../../auth/decorators/widget-auth.decorator';
import { RequireContact } from '../../auth/decorators/require-contact.decorator';
import { CurrentWorkspace } from '../../auth/decorators/current-workspace.decorator';
import { CurrentContact } from '../../auth/decorators/current-contact.decorator';
import type {
  ResolvedContact,
  ResolvedWorkspace,
} from '../../auth/types/auth-context';

@WidgetAuth()
@RequireContact()
@Controller('widget/feature-requests/:requestId/votes')
export class WidgetVotesController {
  constructor(
    private readonly votesService: VotesService,
    private readonly featureRequestsService: FeatureRequestsService,
  ) {}

  @Post()
  async create(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @CurrentContact() contact: ResolvedContact,
    @Param('requestId') requestId: string,
  ): Promise<VoteResponseDto> {
    await this.featureRequestsService.findOneForWorkspace(
      workspace.id,
      requestId,
    );

    return this.votesService.create(requestId, { contactId: contact.id });
  }
}
