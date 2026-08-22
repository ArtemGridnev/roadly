import { Vote } from '@prisma/client';

export class VoteResponseDto {
  readonly id: string;
  readonly contactId: string;
  readonly requestId: string;
  readonly createdAt: Date;

  constructor(vote: Vote) {
    this.id = vote.id;
    this.contactId = vote.contactId;
    this.requestId = vote.requestId;
    this.createdAt = vote.createdAt;
  }

  static fromEntity(vote: Vote): VoteResponseDto {
    return new VoteResponseDto(vote);
  }
}
