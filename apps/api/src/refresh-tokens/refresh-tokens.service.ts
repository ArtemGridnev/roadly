import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

interface CreateRefreshTokenInput {
    agentId: string;
    tokenHash: string;
    expiresAt: Date;
}

@Injectable()
export class RefreshTokensService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async create({ agentId, tokenHash, expiresAt }: CreateRefreshTokenInput): Promise<RefreshToken> {
        return this.prisma.refreshToken.create({
            data: { agentId, tokenHash, expiresAt },
        });
    }

    async findValidByTokenHash(tokenHash: string): Promise<RefreshToken> {
        const refreshToken = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
        });

        if (!refreshToken || refreshToken.revokedAt !== null || refreshToken.expiresAt < new Date()) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        return refreshToken;
    }

    async revoke(id: string): Promise<void> {
        await this.prisma.refreshToken.update({
            where: { id },
            data: { revokedAt: new Date() },
        });
    }
}
