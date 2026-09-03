import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { RequestStatus } from '@prisma/client';
import { prisma } from '../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { seedWorkspaceWithContact } from 'test/utils/seed';
import { loginAsAgentInWorkspace } from 'test/utils/auth';
import { WORKSPACE_ID_HEADER } from '../auth/constants/workspace-header';
import { FeatureRequestResponseDto } from './dto/feature-request-response.dto';

describe('FeatureRequestsController (e2e)', () => {
  let app: INestApplication;
  let workspaceId: string;
  let authorId: string;
  let agentCookie: string;

  beforeAll(async () => {
    app = await createTestingApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    ({ workspaceId, authorId } = await seedWorkspaceWithContact());
    agentCookie = await loginAsAgentInWorkspace(app, workspaceId);
  });

  function authed(
    method: 'get' | 'post' | 'patch' | 'delete',
    url: string,
    workspace = workspaceId,
  ) {
    return request(app.getHttpServer())
      [method](url)
      .set('Cookie', [agentCookie])
      .set(WORKSPACE_ID_HEADER, workspace);
  }

  describe('POST /feature-requests', () => {
    it('creates a feature request', async () => {
      const response = await authed('post', '/feature-requests')
        .send({
          title: 'Dark mode',
          description: 'Please add dark mode',
          authorId,
        })
        .expect(201);

      const body = response.body as FeatureRequestResponseDto;

      expect(body).toMatchObject({
        title: 'Dark mode',
        description: 'Please add dark mode',
        status: RequestStatus.BACKLOG,
        workspaceId,
        authorId,
      });
      expect(body.id).toEqual(expect.any(String));
    });

    it('rejects a request missing required fields', async () => {
      await authed('post', '/feature-requests')
        .send({ description: 'no title' })
        .expect(400);
    });

    it('rejects unknown fields', async () => {
      await authed('post', '/feature-requests')
        .send({
          title: 'Dark mode',
          description: 'Please add dark mode',
          authorId,
          notAllowed: 'nope',
        })
        .expect(400);
    });

    it('rejects a client-supplied workspaceId', async () => {
      await authed('post', '/feature-requests')
        .send({
          title: 'Dark mode',
          description: 'Please add dark mode',
          authorId,
          workspaceId: 'attacker-workspace',
        })
        .expect(400);
    });

    it('rejects a request with no access token', async () => {
      await request(app.getHttpServer())
        .post('/feature-requests')
        .set(WORKSPACE_ID_HEADER, workspaceId)
        .send({
          title: 'Dark mode',
          description: 'Please add dark mode',
          authorId,
        })
        .expect(401);
    });

    it('rejects a request missing the workspace id header', async () => {
      await request(app.getHttpServer())
        .post('/feature-requests')
        .set('Cookie', [agentCookie])
        .send({
          title: 'Dark mode',
          description: 'Please add dark mode',
          authorId,
        })
        .expect(400);
    });

    it('rejects a request when the agent is not a member of the workspace', async () => {
      const otherWorkspace = await prisma.workspace.create({
        data: { name: 'Other', slug: `other-${Date.now()}-${Math.random()}` },
      });

      await authed('post', '/feature-requests', otherWorkspace.id)
        .send({
          title: 'Dark mode',
          description: 'Please add dark mode',
          authorId,
        })
        .expect(403);
    });
  });

  describe('GET /feature-requests', () => {
    it('lists feature requests for the resolved workspace', async () => {
      await prisma.featureRequest.create({
        data: { title: 'A', description: 'A desc', workspaceId, authorId },
      });
      await prisma.featureRequest.create({
        data: {
          title: 'B',
          description: 'B desc',
          workspaceId,
          authorId,
          status: RequestStatus.PLANNED,
        },
      });

      const response = await authed('get', '/feature-requests').expect(200);

      const body = response.body as FeatureRequestResponseDto[];

      expect(body).toHaveLength(2);
    });

    it('filters by status', async () => {
      await prisma.featureRequest.create({
        data: { title: 'A', description: 'A desc', workspaceId, authorId },
      });
      await prisma.featureRequest.create({
        data: {
          title: 'B',
          description: 'B desc',
          workspaceId,
          authorId,
          status: RequestStatus.PLANNED,
        },
      });

      const response = await authed('get', '/feature-requests')
        .query({ status: RequestStatus.PLANNED })
        .expect(200);

      const body = response.body as FeatureRequestResponseDto[];

      expect(body).toHaveLength(1);
      expect(body[0].status).toBe(RequestStatus.PLANNED);
    });

    it('rejects a request missing the workspace id header', async () => {
      await request(app.getHttpServer())
        .get('/feature-requests')
        .set('Cookie', [agentCookie])
        .expect(400);
    });
  });

  describe('GET /feature-requests/:id', () => {
    it('returns a single feature request', async () => {
      const featureRequest = await prisma.featureRequest.create({
        data: { title: 'A', description: 'A desc', workspaceId, authorId },
      });

      const response = await authed(
        'get',
        `/feature-requests/${featureRequest.id}`,
      ).expect(200);

      const body = response.body as FeatureRequestResponseDto;

      expect(body.id).toBe(featureRequest.id);
    });

    it('returns 404 for an unknown id', async () => {
      await authed('get', '/feature-requests/does-not-exist').expect(404);
    });

    it('returns 404 when the feature request belongs to a different workspace', async () => {
      const { workspaceId: otherWorkspaceId, authorId: otherAuthorId } =
        await seedWorkspaceWithContact();
      const featureRequest = await prisma.featureRequest.create({
        data: {
          title: 'A',
          description: 'A desc',
          workspaceId: otherWorkspaceId,
          authorId: otherAuthorId,
        },
      });

      await authed('get', `/feature-requests/${featureRequest.id}`).expect(404);
    });
  });

  describe('PATCH /feature-requests/:id', () => {
    it('updates a feature request', async () => {
      const featureRequest = await prisma.featureRequest.create({
        data: { title: 'A', description: 'A desc', workspaceId, authorId },
      });

      const response = await authed(
        'patch',
        `/feature-requests/${featureRequest.id}`,
      )
        .send({ status: RequestStatus.IN_PROGRESS })
        .expect(200);

      const body = response.body as FeatureRequestResponseDto;

      expect(body.status).toBe(RequestStatus.IN_PROGRESS);
      expect(body.title).toBe('A');
    });

    it('returns 404 when updating an unknown id', async () => {
      await authed('patch', '/feature-requests/does-not-exist')
        .send({ status: RequestStatus.PLANNED })
        .expect(404);
    });

    it('returns 404 when updating a feature request from a different workspace', async () => {
      const { workspaceId: otherWorkspaceId, authorId: otherAuthorId } =
        await seedWorkspaceWithContact();
      const featureRequest = await prisma.featureRequest.create({
        data: {
          title: 'A',
          description: 'A desc',
          workspaceId: otherWorkspaceId,
          authorId: otherAuthorId,
        },
      });

      await authed('patch', `/feature-requests/${featureRequest.id}`)
        .send({ status: RequestStatus.PLANNED })
        .expect(404);
    });
  });

  describe('DELETE /feature-requests/:id', () => {
    it('deletes a feature request', async () => {
      const featureRequest = await prisma.featureRequest.create({
        data: { title: 'A', description: 'A desc', workspaceId, authorId },
      });

      await authed('delete', `/feature-requests/${featureRequest.id}`).expect(
        204,
      );

      await authed('get', `/feature-requests/${featureRequest.id}`).expect(404);
    });

    it('returns 404 when deleting an unknown id', async () => {
      await authed('delete', '/feature-requests/does-not-exist').expect(404);
    });
  });
});
