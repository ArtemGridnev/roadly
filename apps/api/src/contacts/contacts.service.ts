import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactResponseDto } from './dto/contact-response.dto';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async create(
    workspaceId: string,
    createContactDto: CreateContactDto,
  ): Promise<ContactResponseDto> {
    await this.workspacesService.findOne(workspaceId);

    try {
      const contact = await this.prisma.contact.create({
        data: { ...createContactDto, workspaceId },
      });

      return ContactResponseDto.fromEntity(contact);
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async findAll(workspaceId: string): Promise<ContactResponseDto[]> {
    await this.workspacesService.findOne(workspaceId);

    const contacts = await this.prisma.contact.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return contacts.map(ContactResponseDto.fromEntity);
  }

  async findOne(workspaceId: string, id: string): Promise<ContactResponseDto> {
    await this.workspacesService.findOne(workspaceId);

    const contact = await this.prisma.contact.findUnique({ where: { id } });

    if (!contact || contact.workspaceId !== workspaceId) {
      throw new NotFoundException(
        `Contact ${id} not found for workspace ${workspaceId}`,
      );
    }

    return ContactResponseDto.fromEntity(contact);
  }

  async update(
    workspaceId: string,
    id: string,
    updateContactDto: UpdateContactDto,
  ): Promise<ContactResponseDto> {
    await this.findOne(workspaceId, id);

    try {
      const contact = await this.prisma.contact.update({
        where: { id },
        data: updateContactDto,
      });

      return ContactResponseDto.fromEntity(contact);
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async remove(workspaceId: string, id: string): Promise<void> {
    await this.findOne(workspaceId, id);

    await this.prisma.contact.delete({ where: { id } });
  }

  private mapKnownError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(
        'A contact with this externalId already exists in this workspace',
      );
    }

    return error;
  }
}
