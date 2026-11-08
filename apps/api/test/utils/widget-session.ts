import { INestApplication } from '@nestjs/common';
import { WidgetSessionTokensService } from 'src/auth/widget-session-tokens.service';

export function widgetSessionHeader(
  app: INestApplication,
  contactId: string,
  workspaceId: string,
): string {
  const token = app
    .get(WidgetSessionTokensService, { strict: false })
    .sign({ id: contactId, workspaceId });

  return `Bearer ${token}`;
}
