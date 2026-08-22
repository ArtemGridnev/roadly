import { WorkspaceMember } from '@prisma/client';

export class WorkspaceMemberResponseDto {
  readonly id: string;
  readonly workspaceId: string;
  readonly agentId: string;
  readonly createdAt: Date;

  constructor(workspaceMember: WorkspaceMember) {
    this.id = workspaceMember.id;
    this.workspaceId = workspaceMember.workspaceId;
    this.agentId = workspaceMember.agentId;
    this.createdAt = workspaceMember.createdAt;
  }

  static fromEntity(
    workspaceMember: WorkspaceMember,
  ): WorkspaceMemberResponseDto {
    return new WorkspaceMemberResponseDto(workspaceMember);
  }
}
