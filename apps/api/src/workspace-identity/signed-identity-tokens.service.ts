import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  validateSync,
} from 'class-validator';
import { WorkspaceIdentityService } from './workspace-identity.service';

const MAX_TOKEN_LIFETIME_SECONDS = 60 * 60;
const CLOCK_TOLERANCE_SECONDS = 60;

export interface VerifiedSignedIdentity {
  claims: SignedIdentityClaims;
  signedWithCurrentSecret: boolean;
}

export class SignedIdentityClaims {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly user_id!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly name?: string;

  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @IsNumber()
  readonly exp!: number;
}

@Injectable()
export class SignedIdentityTokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly workspaceIdentityService: WorkspaceIdentityService,
  ) {}

  async verify(
    workspaceId: string,
    token: string,
  ): Promise<VerifiedSignedIdentity> {
    const secrets =
      await this.workspaceIdentityService.findVerificationSecrets(workspaceId);

    for (const [index, secret] of secrets.entries()) {
      const payload = this.verifySignature(token, secret);

      if (payload) {
        return {
          claims: this.validateClaims(payload),
          signedWithCurrentSecret: index === 0,
        };
      }
    }

    throw new UnauthorizedException('Invalid identity token');
  }

  private verifySignature(token: string, secret: string): unknown {
    try {
      return this.jwtService.verify<object>(token, {
        secret,
        algorithms: ['HS256'],
        clockTolerance: CLOCK_TOLERANCE_SECONDS,
      });
    } catch {
      return null;
    }
  }

  private validateClaims(payload: unknown): SignedIdentityClaims {
    const claims =
      typeof payload === 'object'
        ? plainToInstance(SignedIdentityClaims, payload)
        : null;
    const secondsLeft = (claims?.exp ?? 0) - Date.now() / 1000;

    if (
      !claims ||
      validateSync(claims).length > 0 ||
      secondsLeft > MAX_TOKEN_LIFETIME_SECONDS + CLOCK_TOLERANCE_SECONDS
    ) {
      throw new UnauthorizedException('Invalid identity token');
    }

    return claims;
  }
}
