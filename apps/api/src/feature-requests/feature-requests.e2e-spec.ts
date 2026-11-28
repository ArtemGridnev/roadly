import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { RequestStatus } from '@prisma/client';
import { prisma } from '../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import {
  createContact,
  createFeatureRequest,
  createWorkspace,
  seedWorkspaceWithContact,
} from 'test/utils/seed';
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
        })
        .expect(201);

      const body = response.body as FeatureRequestResponseDto;

      expect(body).toMatchObject({
        title: 'Dark mode',
        description: 'Please add dark mode',
        status: RequestStatus.BACKLOG,
        workspaceId,
        authorId: null,
        voteCount: 0,
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
          notAllowed: 'nope',
        })
        .expect(400);
    });

    it('rejects a client-supplied authorId', async () => {
      await authed('post', '/feature-requests')
        .send({
          title: 'Dark mode',
          description: 'Please add dark mode',
          authorId,
        })
        .expect(400);
    });

    it('rejects a client-supplied workspaceId', async () => {
      await authed('post', '/feature-requests')
        .send({
          title: 'Dark mode',
          description: 'Please add dark mode',
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
        })
        .expect(400);
    });

    it('rejects a request when the agent is not a member of the workspace', async () => {
      const otherWorkspace = await createWorkspace();

      await authed('post', '/feature-requests', otherWorkspace.id)
        .send({
          title: 'Dark mode',
          description: 'Please add dark mode',
        })
        .expect(403);
    });
  });

  describe('GET /feature-requests', () => {
    it('lists feature requests for the resolved workspace', async () => {
      await createFeatureRequest(workspaceId, { title: 'A', authorId });
      await createFeatureRequest(workspaceId, {
        title: 'B',
        authorId,
        status: RequestStatus.PLANNED,
      });

      const response = await authed('get', '/feature-requests').expect(200);

      const body = response.body as FeatureRequestResponseDto[];

      expect(body).toHaveLength(2);
    });

    it('includes the author and whether the request was signed, or null for agent-created requests', async () => {
      const signer = await createContact(workspaceId, { externalId: 'ext-2' });
      await createFeatureRequest(workspaceId, { title: 'From user', authorId });
      await createFeatureRequest(workspaceId, {
        title: 'Signed',
        authorId: signer.id,
        authorVerified: true,
      });
      await createFeatureRequest(workspaceId, {
        title: 'Unsigned by the same contact',
        authorId: signer.id,
      });
      await createFeatureRequest(workspaceId, { title: 'From agent' });

      const response = await authed('get', '/feature-requests').expect(200);

      const authorByTitle = Object.fromEntries(
        (response.body as FeatureRequestResponseDto[]).map((featureRequest) => [
          featureRequest.title,
          featureRequest.author,
        ]),
      );
      expect(authorByTitle).toEqual({
        'From user': {
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          verified: false,
        },
        Signed: {
          externalId: 'ext-2',
          name: null,
          email: null,
          verified: true,
        },
        'Unsigned by the same contact': {
          externalId: 'ext-2',
          name: null,
          email: null,
          verified: false,
        },
        'From agent': null,
      });
    });

    it('filters by status', async () => {
      await createFeatureRequest(workspaceId, { title: 'A', authorId });
      await createFeatureRequest(workspaceId, {
        title: 'B',
        authorId,
        status: RequestStatus.PLANNED,
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
      const featureRequest = await createFeatureRequest(workspaceId, {
        title: 'A',
        authorId,
      });

      const response = await authed(
        'get',
        `/feature-requests/${featureRequest.id}`,
      ).expect(200);

      const body = response.body as FeatureRequestResponseDto;

      expect(body.id).toBe(featureRequest.id);
      expect(body.author).toEqual({
        externalId: 'ext-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        verified: false,
      });
    });

    it('returns 404 for an unknown id', async () => {
      await authed('get', '/feature-requests/does-not-exist').expect(404);
    });

    it('returns 404 when the feature request belongs to a different workspace', async () => {
      const { workspaceId: otherWorkspaceId, authorId: otherAuthorId } =
        await seedWorkspaceWithContact();
      const featureRequest = await createFeatureRequest(otherWorkspaceId, {
        title: 'A',
        authorId: otherAuthorId,
      });

      await authed('get', `/feature-requests/${featureRequest.id}`).expect(404);
    });
  });

  describe('PATCH /feature-requests/:id', () => {
    it('updates a feature request', async () => {
      const featureRequest = await createFeatureRequest(workspaceId, {
        title: 'A',
        authorId,
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
      const featureRequest = await createFeatureRequest(otherWorkspaceId, {
        title: 'A',
        authorId: otherAuthorId,
      });

      await authed('patch', `/feature-requests/${featureRequest.id}`)
        .send({ status: RequestStatus.PLANNED })
        .expect(404);
    });
  });

  describe('DELETE /feature-requests/:id', () => {
    it('deletes a feature request', async () => {
      const featureRequest = await createFeatureRequest(workspaceId, {
        title: 'A',
        authorId,
      });

      await authed('delete', `/feature-requests/${featureRequest.id}`).expect(
        204,
      );

      await authed('get', `/feature-requests/${featureRequest.id}`).expect(404);
    });

    it('deletes a feature request that has votes', async () => {
      const featureRequest = await createFeatureRequest(workspaceId, {
        title: 'A',
        authorId,
        votes: { create: { contactId: authorId } },
      });

      await authed('delete', `/feature-requests/${featureRequest.id}`).expect(
        204,
      );

      expect(
        await prisma.vote.count({ where: { requestId: featureRequest.id } }),
      ).toBe(0);
    });

    it('returns 404 when deleting an unknown id', async () => {
      await authed('delete', '/feature-requests/does-not-exist').expect(404);
    });
  });
});
