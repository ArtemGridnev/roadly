import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { hash } from 'bcryptjs';
import { prisma } from '../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createAgent(email: string, password: string) {
    return prisma.agent.create({
      data: { name: 'Jane Doe', email, passwordHash: await hash(password, 10) },
    });
  }

  function getCookies(response: request.Response): string[] {
    return response.get('Set-Cookie') as unknown as string[];
  }

  describe('POST /auth/login', () => {
    it('logs in with valid credentials and sets access and refresh cookies', async () => {
      await createAgent('jane@example.com', 'super-secret');

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'jane@example.com', password: 'super-secret' })
        .expect(201);

      const cookies = getCookies(response);
      expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
      expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
      expect(response.body.message).toBe('Login successfully');
      expect(response.body.agent).toMatchObject({ email: 'jane@example.com' });
      expect(response.body.agent.passwordHash).toBeUndefined();
    });

    it('rejects an unknown email with 401, not 404', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'whatever1' })
        .expect(401);
    });

    it('rejects an incorrect password', async () => {
      await createAgent('jane@example.com', 'super-secret');

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'jane@example.com', password: 'wrong-password' })
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    async function loginAndGetCookies(email: string, password: string): Promise<string[]> {
      await createAgent(email, password);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(201);

      return getCookies(response);
    }

    it('rotates the token pair for a valid refresh token', async () => {
      const cookies = await loginAndGetCookies('jane@example.com', 'super-secret');
      const refreshCookie = cookies.find((c) => c.startsWith('refresh_token='))!;

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [refreshCookie])
        .expect(201);

      expect(response.body.agent).toMatchObject({ email: 'jane@example.com' });

      const newCookies = getCookies(response);
      expect(newCookies.some((c) => c.startsWith('access_token='))).toBe(true);
      expect(newCookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
    });

    it('rejects reuse of an already-rotated refresh token', async () => {
      const cookies = await loginAndGetCookies('jane@example.com', 'super-secret');
      const refreshCookie = cookies.find((c) => c.startsWith('refresh_token='))!;

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [refreshCookie])
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [refreshCookie])
        .expect(401);
    });

    it('rejects a request with no refresh token', async () => {
      await request(app.getHttpServer()).post('/auth/refresh').expect(401);
    });
  });
});
