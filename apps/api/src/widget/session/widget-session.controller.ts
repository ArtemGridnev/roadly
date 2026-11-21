import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateContactDto } from '../../contacts/dto/create-contact.dto';
import { WidgetAuth } from '../../auth/decorators/widget-auth.decorator';
import { CurrentWorkspace } from '../../auth/decorators/current-workspace.decorator';
import { WidgetThrottlerGuard } from '../../auth/guards/widget-throttler.guard';
import type { ResolvedWorkspace } from '../../auth/types/auth-context';
import { WidgetSessionService } from './widget-session.service';
import { CreateSignedSessionDto } from './dto/create-signed-session.dto';
import { WidgetSessionResponseDto } from './dto/widget-session-response.dto';

@WidgetAuth()
@UseGuards(WidgetThrottlerGuard)
@Throttle({ default: { ttl: 60_000, limit: 60 } })
@Controller('widget/session')
export class WidgetSessionController {
  constructor(private readonly widgetSessionService: WidgetSessionService) {}

  @Post('unsigned')
  createUnsigned(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Body() identifyContactDto: CreateContactDto,
  ): Promise<WidgetSessionResponseDto> {
    return this.widgetSessionService.createUnsigned(
      workspace.id,
      identifyContactDto,
    );
  }

  @Post('signed')
  createSigned(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Body() { token }: CreateSignedSessionDto,
  ): Promise<WidgetSessionResponseDto> {
    return this.widgetSessionService.createSigned(workspace.id, token);
  }
}
