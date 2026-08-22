import { Workspace } from '@prisma/client';

export class WorkspaceResponseDto {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly widgetKey: string;
  readonly createdAt: Date;

  constructor(workspace: Workspace) {
    this.id = workspace.id;
    this.name = workspace.name;
    this.slug = workspace.slug;
    this.widgetKey = workspace.widgetKey;
    this.createdAt = workspace.createdAt;
  }

  static fromEntity(workspace: Workspace): WorkspaceResponseDto {
    return new WorkspaceResponseDto(workspace);
  }
}
