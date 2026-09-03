import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactResponseDto } from './dto/contact-response.dto';
import { WorkspaceMembershipGuard } from '../auth/guards/workspace-membership.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import type { ResolvedWorkspace } from '../auth/types/auth-context';

@UseGuards(WorkspaceMembershipGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Body() createContactDto: CreateContactDto,
  ): Promise<ContactResponseDto> {
    return this.contactsService.create(workspace.id, createContactDto);
  }

  @Get()
  findAll(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
  ): Promise<ContactResponseDto[]> {
    return this.contactsService.findAll(workspace.id);
  }

  @Get(':id')
  findOne(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Param('id') id: string,
  ): Promise<ContactResponseDto> {
    return this.contactsService.findOne(workspace.id, id);
  }

  @Patch(':id')
  update(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
  ): Promise<ContactResponseDto> {
    return this.contactsService.update(workspace.id, id, updateContactDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentWorkspace() workspace: ResolvedWorkspace,
    @Param('id') id: string,
  ): Promise<void> {
    return this.contactsService.remove(workspace.id, id);
  }
}
