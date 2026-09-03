import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { FeatureRequestsModule } from './feature-requests/feature-requests.module';
import { VotesModule } from './votes/votes.module';
import { AgentsModule } from './agents/agents.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { WorkspaceMembersModule } from './workspace-members/workspace-members.module';
import { ContactsModule } from './contacts/contacts.module';
import { AuthModule } from './auth/auth.module';
import { RefreshTokensService } from './refresh-tokens/refresh-tokens.service';
import { RefreshTokensModule } from './refresh-tokens/refresh-tokens.module';
import { WidgetModule } from './widget/widget.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    FeatureRequestsModule,
    VotesModule,
    AgentsModule,
    WorkspacesModule,
    WorkspaceMembersModule,
    ContactsModule,
    AuthModule,
    RefreshTokensModule,
    WidgetModule,
  ],
  controllers: [AppController],
  providers: [AppService, RefreshTokensService],
})
export class AppModule {}
