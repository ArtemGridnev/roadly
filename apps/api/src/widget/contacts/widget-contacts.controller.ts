import { Body, Controller, Post } from '@nestjs/common';
import { ContactsService } from '../../contacts/contacts.service';
import { CreateContactDto } from '../../contacts/dto/create-contact.dto';
import { ContactResponseDto } from '../../contacts/dto/contact-response.dto';
import { WidgetAuth } from '../../auth/decorators/widget-auth.decorator';
import { CurrentWorkspace } from '../../auth/decorators/current-workspace.decorator';
import type { ResolvedWorkspace } from '../../auth/types/auth-context';

@WidgetAuth()
@Controller('widget/contacts')
export class WidgetContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  identify(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Body() identifyContactDto: CreateContactDto,
  ): Promise<ContactResponseDto> {
    return this.contactsService.findOrCreateByExternalId(
      workspace.id,
      identifyContactDto,
    );
  }
}
