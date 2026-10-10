import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { prisma } from '../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { loginAsNewAgent } from 'test/utils/auth';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';

describe('WorkspacesController (e2e)', () => {
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

  describe('POST /workspaces', () => {
    it('creates a workspace', async () => {
      const response = await authed('post', '/workspaces')
        .send({ name: 'Acme', slug: 'acme' })
        .expect(201);

      const body = response.body as WorkspaceResponseDto;

      expect(body).toMatchObject({ name: 'Acme', slug: 'acme' });
      expect(body.id).toEqual(expect.any(String));
      expect(body.widgetKey).toEqual(expect.any(String));
    });

    it('adds the creator as a member', async () => {
      const response = await authed('post', '/workspaces')
        .send({ name: 'Acme', slug: 'acme' })
        .expect(201);

      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId: (response.body as WorkspaceResponseDto).id },
      });

      expect(members).toHaveLength(1);
    });

    it('rejects a request missing required fields', async () => {
      await authed('post', '/workspaces').send({ name: 'Acme' }).expect(400);
    });

    it.each([
      ['too short', 'ab'],
      ['too long', 'a'.repeat(41)],
      ['uppercase', 'Acme'],
      ['leading hyphen', '-acme'],
      ['trailing hyphen', 'acme-'],
      ['double hyphen', 'ac--me'],
      ['invalid character', 'acme_co'],
      ['reserved word', 'settings'],
    ])('rejects a slug that is %s', async (_, slug) => {
      await authed('post', '/workspaces')
        .send({ name: 'Acme', slug })
        .expect(400);
    });

    it('rejects unknown fields', async () => {
      await authed('post', '/workspaces')
        .send({ name: 'Acme', slug: 'acme', notAllowed: 'nope' })
        .expect(400);
    });

    it('rejects a duplicate slug', async () => {
      await authed('post', '/workspaces')
        .send({ name: 'Acme', slug: 'acme' })
        .expect(201);

      await authed('post', '/workspaces')
        .send({ name: 'Acme Impostor', slug: 'acme' })
        .expect(409);
    });

    it('rejects a request with no access token', async () => {
      await request(app.getHttpServer())
        .post('/workspaces')
        .send({ name: 'Acme', slug: 'acme' })
        .expect(401);
    });
  });

  describe('GET /workspaces', () => {
    it("lists only the agent's own workspaces", async () => {
      await authed('post', '/workspaces')
        .send({ name: 'Acme', slug: 'acme' })
        .expect(201);
      await prisma.workspace.create({ data: { name: 'Other', slug: 'other' } });

      const response = await authed('get', '/workspaces').expect(200);

      const body = response.body as WorkspaceResponseDto[];

      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({ slug: 'acme' });
    });
  });

  describe('removed routes', () => {
    it.each(['get', 'patch', 'delete'] as const)(
      'does not expose %s /workspaces/:id',
      async (method) => {
        const workspace = await prisma.workspace.create({
          data: { name: 'Other', slug: 'other' },
        });

        await authed(method, `/workspaces/${workspace.id}`).expect(404);
      },
    );
  });
});
