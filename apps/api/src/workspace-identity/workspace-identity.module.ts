import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WorkspaceMembershipGuard } from '../auth/guards/workspace-membership.guard';
import { IdentitySecretCipherService } from './identity-secret-cipher.service';
import { SignedIdentityTokensService } from './signed-identity-tokens.service';
import { WorkspaceIdentityController } from './workspace-identity.controller';
import { WorkspaceIdentityService } from './workspace-identity.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [WorkspaceIdentityController],
  providers: [
    WorkspaceIdentityService,
    IdentitySecretCipherService,
    SignedIdentityTokensService,
    WorkspaceMembershipGuard,
  ],
  exports: [SignedIdentityTokensService, WorkspaceIdentityService],
})
export class WorkspaceIdentityModule {}
