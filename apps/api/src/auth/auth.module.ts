import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AgentsModule } from 'src/agents/agents.module';
import { WorkspacesModule } from 'src/workspaces/workspaces.module';
import { ContactsModule } from 'src/contacts/contacts.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { AccessTokenAuthGuard } from './guards/access-token-auth.guard';
import { RefreshTokensModule } from 'src/refresh-tokens/refresh-tokens.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    AgentsModule,
    RefreshTokensModule,
    WorkspacesModule,
    ContactsModule,
    PassportModule,
    JwtModule.register({}),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
  ],
  providers: [
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    LocalStrategy,
    { provide: APP_GUARD, useClass: AccessTokenAuthGuard },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
