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
import { WIDGET_KEY_HEADER } from '../constants/widget-headers';
import { AuthenticatedRequest, ResolvedContact } from '../types/auth-context';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { WorkspaceResponseDto } from '../../workspaces/dto/workspace-response.dto';
import { ContactsService } from '../../contacts/contacts.service';
import { WidgetSessionTokensService } from '../widget-session-tokens.service';

@Injectable()
export class AccessTokenAuthGuard extends AuthGuard('access-token') {
  constructor(
    private reflector: Reflector,
    private workspacesService: WorkspacesService,
    private contactsService: ContactsService,
    private widgetSessionTokensService: WidgetSessionTokensService,
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
    request.workspace = { id: workspace.id };

    const requiresContact = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_CONTACT_KEY,
      [context.getHandler(), context.getClass()],
    );

    const sessionToken = this.extractSessionToken(request);

    if (requiresContact || sessionToken) {
      request.contact = await this.resolveContact(workspace, sessionToken);
    }

    return true;
  }

  private async resolveWorkspace(
    widgetKey: string,
  ): Promise<WorkspaceResponseDto> {
    try {
      return await this.workspacesService.findByWidgetKey(widgetKey);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException(`Invalid ${WIDGET_KEY_HEADER} header`);
      }
      throw error;
    }
  }

  private extractSessionToken(
    request: AuthenticatedRequest,
  ): string | undefined {
    const [scheme, token] = request.header('authorization')?.split(' ') ?? [];

    return scheme === 'Bearer' ? token : undefined;
  }

  private async resolveContact(
    workspace: WorkspaceResponseDto,
    sessionToken: string | undefined,
  ): Promise<ResolvedContact> {
    if (!sessionToken) {
      throw new UnauthorizedException('Missing session token');
    }

    const payload = this.widgetSessionTokensService.verify(sessionToken);

    if (payload?.workspaceId !== workspace.id) {
      throw new UnauthorizedException('Invalid session token');
    }

    if (workspace.requireSignedIdentity && !payload.verified) {
      throw new UnauthorizedException('Signed identity required');
    }

    try {
      const contact = await this.contactsService.findOne(
        workspace.id,
        payload.sub,
      );
      return {
        id: contact.id,
        workspaceId: contact.workspaceId,
        verified: payload.verified === true,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('Invalid session token');
      }
      throw error;
    }
  }
}
