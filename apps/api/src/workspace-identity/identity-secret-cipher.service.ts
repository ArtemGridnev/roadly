import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

@Injectable()
export class IdentitySecretCipherService {
  private readonly key: Buffer;

  constructor(configService: ConfigService) {
    this.key = Buffer.from(
      configService.getOrThrow<string>('IDENTITY_SECRET_ENCRYPTION_KEY'),
      'base64',
    );

    if (this.key.length !== KEY_LENGTH) {
      throw new Error(
        `IDENTITY_SECRET_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes, base64-encoded`,
      );
    }
  }

  encrypt(secret: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(secret, 'utf8'),
      cipher.final(),
    ]);

    return [iv, cipher.getAuthTag(), ciphertext]
      .map((part) => part.toString('base64'))
      .join('.');
  }

  decrypt(encrypted: string): string {
    const [iv, authTag, ciphertext] = encrypted
      .split('.')
      .map((part) => Buffer.from(part, 'base64'));
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  }
}
