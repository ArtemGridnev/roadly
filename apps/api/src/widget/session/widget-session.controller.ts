import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContactsService } from '../../contacts/contacts.service';
import { CreateContactDto } from '../../contacts/dto/create-contact.dto';
import { WidgetAuth } from '../../auth/decorators/widget-auth.decorator';
import { CurrentWorkspace } from '../../auth/decorators/current-workspace.decorator';
import { WidgetThrottlerGuard } from '../../auth/guards/widget-throttler.guard';
import { WidgetSessionTokensService } from '../../auth/widget-session-tokens.service';
import type { ResolvedWorkspace } from '../../auth/types/auth-context';
import { WidgetSessionResponseDto } from './dto/widget-session-response.dto';

@WidgetAuth()
@Controller('widget/session')
export class WidgetSessionController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly widgetSessionTokensService: WidgetSessionTokensService,
  ) {}

  @UseGuards(WidgetThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @Post('unsigned')
  async createUnsigned(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Body() identifyContactDto: CreateContactDto,
  ): Promise<WidgetSessionResponseDto> {
    const contact = await this.contactsService.findOrCreateByExternalId(
      workspace.id,
      identifyContactDto,
    );

    return new WidgetSessionResponseDto(
      this.widgetSessionTokensService.sign(contact),
      contact.id,
    );
  }
}
