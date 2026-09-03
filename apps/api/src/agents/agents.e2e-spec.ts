import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { prisma } from '../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { loginAsNewAgent } from 'test/utils/auth';
import { AgentResponseDto } from './dto/agent-response.dto';

describe('AgentsController (e2e)', () => {
  let app: INestApplication;
  let agentCookie: string;

  beforeAll(async () => {
    app = await createTestingApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    agentCookie = await loginAsNewAgent(app);
  });

  function authed(method: 'get' | 'post' | 'patch' | 'delete', url: string) {
    return request(app.getHttpServer())
      [method](url)
      .set('Cookie', [agentCookie]);
  }

  describe('POST /agents', () => {
    it('creates an agent', async () => {
      const response = await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'super-secret',
        })
        .expect(201);

      const body = response.body as AgentResponseDto & {
        passwordHash?: string;
      };

      expect(body).toMatchObject({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });
      expect(body.id).toEqual(expect.any(String));
      expect(body.passwordHash).toBeUndefined();
    });

    it('rejects a request missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/agents')
        .send({ email: 'jane@example.com' })
        .expect(400);
    });

    it('rejects an invalid email', async () => {
      await request(app.getHttpServer())
        .post('/agents')
        .send({ name: 'Jane Doe', email: 'not-an-email', password: 'secretpw' })
        .expect(400);
    });

    it('rejects a password shorter than 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'short',
        })
        .expect(400);
    });

    it('rejects unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'super-secret',
          notAllowed: 'nope',
        })
        .expect(400);
    });

    it('rejects a duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'super-secret',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: 'Jane Impostor',
          email: 'jane@example.com',
          password: 'another-secret',
        })
        .expect(409);
    });
  });

  describe('GET /agents', () => {
    it('lists agents', async () => {
      await prisma.agent.create({
        data: { name: 'A', email: 'a@example.com', passwordHash: 'hash-a' },
      });
      await prisma.agent.create({
        data: { name: 'B', email: 'b@example.com', passwordHash: 'hash-b' },
      });

      const response = await authed('get', '/agents').expect(200);

      const body = response.body as AgentResponseDto[];

      // includes the acting agent created in beforeEach plus the two above
      expect(body.length).toBeGreaterThanOrEqual(2);
      expect(body.every((agent) => !('passwordHash' in agent))).toBe(true);
    });

    it('rejects a request with no access token', async () => {
      await request(app.getHttpServer()).get('/agents').expect(401);
    });
  });

  describe('GET /agents/:id', () => {
    it('returns a single agent', async () => {
      const agent = await prisma.agent.create({
        data: { name: 'A', email: 'a@example.com', passwordHash: 'hash-a' },
      });

      const response = await authed('get', `/agents/${agent.id}`).expect(200);

      const body = response.body as AgentResponseDto;

      expect(body.id).toBe(agent.id);
    });

    it('returns 404 for an unknown id', async () => {
      await authed('get', '/agents/does-not-exist').expect(404);
    });
  });

  describe('PATCH /agents/:id', () => {
    it('updates an agent', async () => {
      const agent = await prisma.agent.create({
        data: { name: 'A', email: 'a@example.com', passwordHash: 'hash-a' },
      });

      const response = await authed('patch', `/agents/${agent.id}`)
        .send({ name: 'A Updated' })
        .expect(200);

      const body = response.body as AgentResponseDto;

      expect(body.name).toBe('A Updated');
      expect(body.email).toBe('a@example.com');
    });

    it('rehashes the password when updated', async () => {
      const agent = await prisma.agent.create({
        data: { name: 'A', email: 'a@example.com', passwordHash: 'hash-a' },
      });

      await authed('patch', `/agents/${agent.id}`)
        .send({ password: 'new-secret-pw' })
        .expect(200);

      const updated = await prisma.agent.findUniqueOrThrow({
        where: { id: agent.id },
      });

      expect(updated.passwordHash).not.toBe('hash-a');
    });

    it('returns 404 when updating an unknown id', async () => {
      await authed('patch', '/agents/does-not-exist')
        .send({ name: 'A Updated' })
        .expect(404);
    });

    it('returns 409 when the update creates a duplicate email', async () => {
      await prisma.agent.create({
        data: { name: 'A', email: 'a@example.com', passwordHash: 'hash-a' },
      });
      const agent = await prisma.agent.create({
        data: { name: 'B', email: 'b@example.com', passwordHash: 'hash-b' },
      });

      await authed('patch', `/agents/${agent.id}`)
        .send({ email: 'a@example.com' })
        .expect(409);
    });
  });

  describe('DELETE /agents/:id', () => {
    it('deletes an agent', async () => {
      const agent = await prisma.agent.create({
        data: { name: 'A', email: 'a@example.com', passwordHash: 'hash-a' },
      });

      await authed('delete', `/agents/${agent.id}`).expect(204);

      await authed('get', `/agents/${agent.id}`).expect(404);
    });

    it('returns 404 when deleting an unknown id', async () => {
      await authed('delete', '/agents/does-not-exist').expect(404);
    });
  });
});
