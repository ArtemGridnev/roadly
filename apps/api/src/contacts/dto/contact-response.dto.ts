import { Contact } from '@prisma/client';

export class ContactResponseDto {
  readonly id: string;
  readonly workspaceId: string;
  readonly externalId: string;
  readonly name: string | null;
  readonly email: string | null;
  readonly emailVerifiedAt: Date | null;
  readonly createdAt: Date;

  constructor(contact: Contact) {
    this.id = contact.id;
    this.workspaceId = contact.workspaceId;
    this.externalId = contact.externalId;
    this.name = contact.name;
    this.email = contact.email;
    this.emailVerifiedAt = contact.emailVerifiedAt;
    this.createdAt = contact.createdAt;
  }

  static fromEntity(contact: Contact): ContactResponseDto {
    return new ContactResponseDto(contact);
  }
}
