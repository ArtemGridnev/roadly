import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
import { Agent } from '@prisma/client';
import { AgentsService } from 'src/agents/agents.service';
import { AgentResponseDto } from 'src/agents/dto/agent-response.dto';
import { CreateAgentDto } from 'src/agents/dto/create-agent.dto';
import { AccessTokenPayload } from './dto/access-token-payload.dto';
import { RefreshTokensService } from 'src/refresh-tokens/refresh-tokens.service';
import { RefreshTokenPayload } from './dto/refresh-token-payload.dto';

const ACCESS_TOKEN_TTL = '60m';
const REFRESH_TOKEN_TTL_DAYS = 90;

@Injectable()
export class AuthService {
    constructor(
        private refreshTokensService: RefreshTokensService,
        private agentsService: AgentsService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    async validateUser(email: string, pass: string): Promise<AgentResponseDto> {
        let agent: Agent;

        try {
            agent = await this.agentsService.findByEmail(email);
        } catch {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await compare(pass, agent.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        return AgentResponseDto.fromEntity(agent);
    }

    async login(agent: AgentResponseDto): Promise<{ accessToken: string, refreshToken: string, agent: AgentResponseDto }> {
        return this.issueTokenPair(agent);
    }

    async signup(createAgentDto: CreateAgentDto): Promise<{ accessToken: string, refreshToken: string, agent: AgentResponseDto }> {
        const agent = await this.agentsService.create(createAgentDto);

        return this.issueTokenPair(agent);
    }

    async getCurrentAgent(agentId: string): Promise<AgentResponseDto> {
        try {
            return await this.agentsService.findOne(agentId);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new UnauthorizedException();
            }

            throw error;
        }
    }

    async logout(refreshToken: string): Promise<void> {
        await this.refreshTokensService.revokeByTokenHash(this.hashRefreshToken(refreshToken));
    }

    async validateRefreshToken(refreshToken: string): Promise<void> {
        await this.refreshTokensService.findValidByTokenHash(this.hashRefreshToken(refreshToken));
    }

    async rotateRefreshToken(refreshToken: string): Promise<{ accessToken: string, refreshToken: string, agent: AgentResponseDto }> {
        const refreshTokenData = await this.refreshTokensService.findValidByTokenHash(this.hashRefreshToken(refreshToken));

        await this.refreshTokensService.revoke(refreshTokenData.id);

        const agent = await this.agentsService.findOne(refreshTokenData.agentId);

        return this.issueTokenPair(agent);
    }

    private async issueTokenPair(agent: AgentResponseDto): Promise<{ accessToken: string, refreshToken: string, agent: AgentResponseDto }> {
        const accessTokenPayload: AccessTokenPayload = { username: agent.email, sub: agent.id };
        const accessToken = this.signAccessToken(accessTokenPayload);

        const refreshTokenPayload: RefreshTokenPayload = { sub: agent.id, jti: randomUUID() };
        const refreshToken = this.signRefreshToken(refreshTokenPayload);

        await this.refreshTokensService.create({
            agentId: agent.id,
            tokenHash: this.hashRefreshToken(refreshToken),
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
        });

        return { accessToken, refreshToken, agent };
    }

    private hashRefreshToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    private signAccessToken(payload: AccessTokenPayload): string {
        return this.jwtService.sign(payload, {
            secret: this.configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
            expiresIn: ACCESS_TOKEN_TTL,
        });
    }

    private signRefreshToken(payload: RefreshTokenPayload): string {
        return this.jwtService.sign(payload, {
            secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
            expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
        });
    }
}
