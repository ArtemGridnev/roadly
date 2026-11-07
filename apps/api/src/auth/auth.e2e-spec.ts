import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { hash } from 'bcryptjs';
import { prisma } from '../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createTestingApp();
    await app.init();
  });

  afterEach(async () => {
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

    it('rate limits login attempts per email to 5 per minute', async () => {
      await createAgent('jane@example.com', 'super-secret');

      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'jane@example.com', password: 'wrong-password' })
          .expect(401);
      }

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'jane@example.com', password: 'super-secret' })
        .expect(429);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'other@example.com', password: 'whatever1' })
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
        .send({ name: 'Jane Doe', email: 'jane@example.com', password: 'Super-secret1' })
        .expect(201);

      const cookies = getCookies(response);
      expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
      expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
      expect(response.body.agent).toMatchObject({ name: 'Jane Doe', email: 'jane@example.com' });
      expect(response.body.agent.passwordHash).toBeUndefined();
      expect(response.body.agent.language).toBeNull();
    });

    it('saves the language chosen at signup', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: 'Jane Doe', email: 'jane@example.com', password: 'Super-secret1', language: 'he' })
        .expect(201);

      expect(response.body.agent.language).toBe('he');
    });

    it('rejects an unsupported language at signup', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: 'Jane Doe', email: 'jane@example.com', password: 'Super-secret1', language: 'fr' })
        .expect(400);
    });

    it('rejects an already registered email with 409', async () => {
      await createAgent('jane@example.com', 'super-secret');

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: 'Jane Doe', email: 'jane@example.com', password: 'Super-secret1' })
        .expect(409);
    });

    it.each([
      ['shorter than 8 characters', 'Sh0rt'],
      ['missing a lowercase letter', 'SUPER-SECRET1'],
      ['missing an uppercase letter', 'super-secret1'],
      ['missing a number', 'Super-secret'],
    ])('rejects a password %s', async (_, password) => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: 'Jane Doe', email: 'jane@example.com', password })
        .expect(400);
    });

    it('rate limits signups from one IP to 10 per hour', async () => {
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer())
          .post('/auth/signup')
          .send({ name: 'Jane Doe', email: `jane-${i}@example.com`, password: 'Super-secret1' })
          .expect(201);
      }

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: 'Jane Doe', email: 'jane-10@example.com', password: 'Super-secret1' })
        .expect(429);
    });

    it('rejects an invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: 'Jane Doe', email: 'not-an-email', password: 'Super-secret1' })
        .expect(400);
    });

    it('rejects a request missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: 'jane@example.com', password: 'Super-secret1' })
        .expect(400);
    });

    it('rejects unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: 'Jane Doe', email: 'jane@example.com', password: 'Super-secret1', role: 'admin' })
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

  describe('PATCH /auth/me', () => {
    async function loginAndGetAccessCookie(email: string, password: string): Promise<string> {
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(201);

      return getCookies(login).find((c) => c.startsWith('access_token='))!;
    }

    it('saves the language and returns it on later requests', async () => {
      await createAgent('jane@example.com', 'super-secret');
      const accessCookie = await loginAndGetAccessCookie('jane@example.com', 'super-secret');

      const response = await request(app.getHttpServer())
        .patch('/auth/me')
        .set('Cookie', [accessCookie])
        .send({ language: 'he' })
        .expect(200);

      expect(response.body).toMatchObject({ email: 'jane@example.com', language: 'he' });
      expect(response.body.passwordHash).toBeUndefined();

      const me = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', [accessCookie])
        .expect(200);
      expect(me.body.language).toBe('he');

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'jane@example.com', password: 'super-secret' })
        .expect(201);
      expect(login.body.agent.language).toBe('he');
    });

    it('only changes the signed-in agent', async () => {
      const other = await createAgent('other@example.com', 'super-secret');
      await createAgent('jane@example.com', 'super-secret');
      const accessCookie = await loginAndGetAccessCookie('jane@example.com', 'super-secret');

      await request(app.getHttpServer())
        .patch('/auth/me')
        .set('Cookie', [accessCookie])
        .send({ language: 'he' })
        .expect(200);

      const unchanged = await prisma.agent.findUniqueOrThrow({ where: { id: other.id } });
      expect(unchanged.language).toBeNull();
    });

    it.each([
      ['an unsupported language', { language: 'fr' }],
      ['a null language', { language: null }],
      ['a missing language', {}],
      ['other agent fields', { language: 'he', name: 'Renamed' }],
    ])('rejects %s', async (_, body) => {
      await createAgent('jane@example.com', 'super-secret');
      const accessCookie = await loginAndGetAccessCookie('jane@example.com', 'super-secret');

      await request(app.getHttpServer())
        .patch('/auth/me')
        .set('Cookie', [accessCookie])
        .send(body)
        .expect(400);
    });

    it('rejects a request with no access token', async () => {
      await request(app.getHttpServer())
        .patch('/auth/me')
        .send({ language: 'he' })
        .expect(401);
    });

    it('returns 401 when the agent no longer exists', async () => {
      const agent = await createAgent('jane@example.com', 'super-secret');
      const accessCookie = await loginAndGetAccessCookie('jane@example.com', 'super-secret');

      await prisma.refreshToken.deleteMany({ where: { agentId: agent.id } });
      await prisma.agent.delete({ where: { id: agent.id } });

      await request(app.getHttpServer())
        .patch('/auth/me')
        .set('Cookie', [accessCookie])
        .send({ language: 'he' })
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
