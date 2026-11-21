import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { IdentitySecretCipherService } from './identity-secret-cipher.service';
import { IdentitySecretResponseDto } from './dto/identity-secret-response.dto';
import { UpdateWorkspaceIdentityDto } from './dto/update-workspace-identity.dto';
import { WorkspaceIdentityResponseDto } from './dto/workspace-identity-response.dto';

const PREVIOUS_SECRET_OVERLAP_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class WorkspaceIdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: IdentitySecretCipherService,
  ) {}

  async getStatus(workspaceId: string): Promise<WorkspaceIdentityResponseDto> {
    const workspace = await this.findWorkspace(workspaceId);
    const contact = await this.prisma.contact.findFirst({
      where: { workspaceId },
      select: { id: true },
    });

    return new WorkspaceIdentityResponseDto({
      widgetConnected: contact !== null,
      signedIdentityConnected: workspace.signedIdentityConnectedAt !== null,
      hasSecret: workspace.identitySecret !== null,
      requireSignedIdentity: workspace.requireSignedIdentity,
    });
  }

  async rotateSecret(workspaceId: string): Promise<IdentitySecretResponseDto> {
    const workspace = await this.findWorkspace(workspaceId);
    const secret = randomBytes(32).toString('base64url');

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        identitySecret: this.cipher.encrypt(secret),
        previousIdentitySecret: workspace.identitySecret,
        previousIdentitySecretExpiresAt: workspace.identitySecret
          ? new Date(Date.now() + PREVIOUS_SECRET_OVERLAP_MS)
          : null,
        signedIdentityConnectedAt: null,
      },
    });

    return new IdentitySecretResponseDto(secret);
  }

  async update(
    workspaceId: string,
    { requireSignedIdentity }: UpdateWorkspaceIdentityDto,
  ): Promise<WorkspaceIdentityResponseDto> {
    const workspace = await this.findWorkspace(workspaceId);

    if (requireSignedIdentity && !workspace.signedIdentityConnectedAt) {
      throw new ConflictException(
        'Signed identity can only be required once a token signed with the current secret has been used',
      );
    }

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { requireSignedIdentity },
    });

    return this.getStatus(workspaceId);
  }

  async markSignedIdentityConnected(workspaceId: string): Promise<void> {
    await this.prisma.workspace.updateMany({
      where: { id: workspaceId, signedIdentityConnectedAt: null },
      data: { signedIdentityConnectedAt: new Date() },
    });
  }

  async findVerificationSecrets(workspaceId: string): Promise<string[]> {
    const workspace = await this.findWorkspace(workspaceId);
    const previousIsActive =
      workspace.previousIdentitySecretExpiresAt !== null &&
      workspace.previousIdentitySecretExpiresAt > new Date();

    return [
      workspace.identitySecret,
      previousIsActive ? workspace.previousIdentitySecret : null,
    ]
      .filter((secret) => secret !== null)
      .map((secret) => this.cipher.decrypt(secret));
  }

  private async findWorkspace(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    return workspace;
  }
}
