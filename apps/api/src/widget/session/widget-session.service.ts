import { ForbiddenException, Injectable } from '@nestjs/common';
import { ContactsService } from '../../contacts/contacts.service';
import { CreateContactDto } from '../../contacts/dto/create-contact.dto';
import { WidgetSessionTokensService } from '../../auth/widget-session-tokens.service';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { SignedIdentityTokensService } from '../../workspace-identity/signed-identity-tokens.service';
import { WorkspaceIdentityService } from '../../workspace-identity/workspace-identity.service';
import { WidgetSessionResponseDto } from './dto/widget-session-response.dto';

@Injectable()
export class WidgetSessionService {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly workspacesService: WorkspacesService,
    private readonly widgetSessionTokensService: WidgetSessionTokensService,
    private readonly signedIdentityTokensService: SignedIdentityTokensService,
    private readonly workspaceIdentityService: WorkspaceIdentityService,
  ) {}

  async createUnsigned(
    workspaceId: string,
    identifyContactDto: CreateContactDto,
  ): Promise<WidgetSessionResponseDto> {
    const workspace = await this.workspacesService.findOne(workspaceId);

    if (workspace.requireSignedIdentity) {
      throw new ForbiddenException('This workspace requires signed identity');
    }

    const contact = await this.contactsService.findOrCreateByExternalId(
      workspaceId,
      identifyContactDto,
    );

    return new WidgetSessionResponseDto(
      this.widgetSessionTokensService.sign(contact),
      contact.id,
    );
  }

  async createSigned(
    workspaceId: string,
    token: string,
  ): Promise<WidgetSessionResponseDto> {
    const { claims, signedWithCurrentSecret } =
      await this.signedIdentityTokensService.verify(workspaceId, token);
    const contact = await this.contactsService.upsertVerified(workspaceId, {
      externalId: claims.user_id,
      name: claims.name,
      email: claims.email,
    });

    if (signedWithCurrentSecret) {
      await this.workspaceIdentityService.markSignedIdentityConnected(
        workspaceId,
      );
    }

    return new WidgetSessionResponseDto(
      this.widgetSessionTokensService.sign(contact, true),
      contact.id,
    );
  }
}
