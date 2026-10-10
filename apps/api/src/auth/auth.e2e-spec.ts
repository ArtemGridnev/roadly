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

  describe('POST /auth/signup', () => {
    it('creates the agent and signs them in', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: 'Jane Doe', email: 'jane@example.com', password: 'super-secret' })
        .expect(201);

      const cookies = getCookies(response);
      expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
      expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
      expect(response.body.agent).toMatchObject({ name: 'Jane Doe', email: 'jane@example.com' });
      expect(response.body.agent.passwordHash).toBeUndefined();
    });

    it('rejects an already registered email with 409', async () => {
      await createAgent('jane@example.com', 'super-secret');

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: 'Jane Doe', email: 'jane@example.com', password: 'super-secret' })
        .expect(409);
    });

    it('rejects a password shorter than 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: 'Jane Doe', email: 'jane@example.com', password: 'short' })
        .expect(400);
    });


  });

  describe('GET /auth/me', () => {
    it('returns the current agent', async () => {
      await createAgent('jane@example.com', 'super-secret');
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'jane@example.com', password: 'super-secret' })
        .expect(201);
      const accessCookie = getCookies(login).find((c) => c.startsWith('access_token='))!;

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', [accessCookie])
        .expect(200);

      expect(response.body).toMatchObject({ email: 'jane@example.com' });
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('rejects a request with no access token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('returns 401 when the agent no longer exists', async () => {
      const agent = await createAgent('jane@example.com', 'super-secret');
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'jane@example.com', password: 'super-secret' })
        .expect(201);
      const accessCookie = getCookies(login).find((c) => c.startsWith('access_token='))!;

      await prisma.refreshToken.deleteMany({ where: { agentId: agent.id } });
      await prisma.agent.delete({ where: { id: agent.id } });

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', [accessCookie])
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('revokes the refresh token and clears both cookies', async () => {
      await createAgent('jane@example.com', 'super-secret');
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'jane@example.com', password: 'super-secret' })
        .expect(201);
      const refreshCookie = getCookies(login).find((c) => c.startsWith('refresh_token='))!;

      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [refreshCookie])
        .expect(204);

      const cookies = getCookies(response);
      expect(cookies.some((c) => c.startsWith('access_token=;'))).toBe(true);
      expect(cookies.some((c) => c.startsWith('refresh_token=;'))).toBe(true);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [refreshCookie])
        .expect(401);
    });

    it('returns 204 with no session', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(204);
    });

    it('returns 204 with an already revoked refresh token', async () => {
      await createAgent('jane@example.com', 'super-secret');
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'jane@example.com', password: 'super-secret' })
        .expect(201);
      const refreshCookie = getCookies(login).find((c) => c.startsWith('refresh_token='))!;

      await request(app.getHttpServer()).post('/auth/logout').set('Cookie', [refreshCookie]).expect(204);
      await request(app.getHttpServer()).post('/auth/logout').set('Cookie', [refreshCookie]).expect(204);
    });
  });
});
