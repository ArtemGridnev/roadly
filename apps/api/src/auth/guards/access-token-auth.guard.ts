import {
  Injectable,
  ExecutionContext,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { WIDGET_AUTH_KEY } from '../decorators/widget-auth.decorator';
import { REQUIRE_CONTACT_KEY } from '../decorators/require-contact.decorator';
import {
  CONTACT_ID_HEADER,
  WIDGET_KEY_HEADER,
} from '../constants/widget-headers';
import {
  AuthenticatedRequest,
  ResolvedContact,
  ResolvedWorkspace,
} from '../types/auth-context';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { ContactsService } from '../../contacts/contacts.service';

@Injectable()
export class AccessTokenAuthGuard extends AuthGuard('access-token') {
  constructor(
    private reflector: Reflector,
    private workspacesService: WorkspacesService,
    private contactsService: ContactsService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const isWidgetAuth = this.reflector.getAllAndOverride<boolean>(
      WIDGET_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isWidgetAuth) {
      return this.activateWidgetAuth(context);
    }

    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  private async activateWidgetAuth(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const widgetKey = request.header(WIDGET_KEY_HEADER);
    if (!widgetKey) {
      throw new UnauthorizedException(`Missing ${WIDGET_KEY_HEADER} header`);
    }

    const workspace = await this.resolveWorkspace(widgetKey);
    request.workspace = workspace;

    const requiresContact = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_CONTACT_KEY,
      [context.getHandler(), context.getClass()],
    );

    const contactId = request.header(CONTACT_ID_HEADER);

    if (requiresContact || contactId) {
      request.contact = await this.resolveContact(workspace.id, contactId);
    }

    return true;
  }

  private async resolveWorkspace(
    widgetKey: string,
  ): Promise<ResolvedWorkspace> {
    try {
      const workspace = await this.workspacesService.findByWidgetKey(widgetKey);
      return { id: workspace.id };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException(`Invalid ${WIDGET_KEY_HEADER} header`);
      }
      throw error;
    }
  }

  private async resolveContact(
    workspaceId: string,
    contactId: string | undefined,
  ): Promise<ResolvedContact> {
    if (!contactId) {
      throw new UnauthorizedException(`Missing ${CONTACT_ID_HEADER} header`);
    }

    try {
      const contact = await this.contactsService.findOne(
        workspaceId,
        contactId,
      );
      return { id: contact.id, workspaceId: contact.workspaceId };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException(`Invalid ${CONTACT_ID_HEADER} header`);
      }
      throw error;
    }
  }
}
