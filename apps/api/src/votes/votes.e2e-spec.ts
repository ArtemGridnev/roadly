import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { prisma } from '../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { seedWorkspaceWithContact } from 'test/utils/seed';
import { loginAsAgentInWorkspace } from 'test/utils/auth';
import { WORKSPACE_ID_HEADER } from '../auth/constants/workspace-header';
import { VoteResponseDto } from './dto/vote-response.dto';

describe('VotesController (e2e)', () => {
  let app: INestApplication;
  let workspaceId: string;
  let contactId: string;
  let requestId: string;
  let agentCookie: string;

  beforeAll(async () => {
    app = await createTestingApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    ({ workspaceId, authorId: contactId } = await seedWorkspaceWithContact());
    agentCookie = await loginAsAgentInWorkspace(app, workspaceId);
    const featureRequest = await prisma.featureRequest.create({
      data: {
        title: 'Dark mode',
        description: 'Please add dark mode',
        workspaceId,
        authorId: contactId,
      },
    });
    requestId = featureRequest.id;
  });

  function authed(method: 'get' | 'post' | 'patch' | 'delete', url: string) {
    return request(app.getHttpServer())
      [method](url)
      .set('Cookie', [agentCookie])
      .set(WORKSPACE_ID_HEADER, workspaceId);
  }

  describe('POST /feature-requests/:requestId/votes', () => {
    it('creates a vote', async () => {
      const response = await authed(
        'post',
        `/feature-requests/${requestId}/votes`,
      )
        .send({ contactId })
        .expect(201);

      const body = response.body as VoteResponseDto;

      expect(body).toMatchObject({ contactId, requestId });
      expect(body.id).toEqual(expect.any(String));
    });

    it('rejects a request missing required fields', async () => {
      await authed('post', `/feature-requests/${requestId}/votes`)
        .send({})
        .expect(400);
    });

    it('rejects unknown fields', async () => {
      await authed('post', `/feature-requests/${requestId}/votes`)
        .send({ contactId, notAllowed: 'nope' })
        .expect(400);
    });

    it('rejects a duplicate vote from the same contact', async () => {
      await prisma.vote.create({ data: { contactId, requestId } });

      await authed('post', `/feature-requests/${requestId}/votes`)
        .send({ contactId })
        .expect(409);
    });

    it('returns 404 for an unknown feature request', async () => {
      await authed('post', '/feature-requests/does-not-exist/votes')
        .send({ contactId })
        .expect(404);
    });

    it('returns 404 for a feature request belonging to a different workspace', async () => {
      const { workspaceId: otherWorkspaceId, authorId: otherContactId } =
        await seedWorkspaceWithContact();
      const otherRequest = await prisma.featureRequest.create({
        data: {
          title: 'Other',
          description: 'Other desc',
          workspaceId: otherWorkspaceId,
          authorId: otherContactId,
        },
      });

      await authed('post', `/feature-requests/${otherRequest.id}/votes`)
        .send({ contactId })
        .expect(404);
    });

    it('rejects a request with no access token', async () => {
      await request(app.getHttpServer())
        .post(`/feature-requests/${requestId}/votes`)
        .set(WORKSPACE_ID_HEADER, workspaceId)
        .send({ contactId })
        .expect(401);
    });
  });

  describe('GET /feature-requests/:requestId/votes', () => {
    it('lists votes for a feature request', async () => {
      const otherContact = await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-2',
          name: 'John Roe',
          email: 'john@example.com',
        },
      });
      await prisma.vote.create({ data: { contactId, requestId } });
      await prisma.vote.create({
        data: { contactId: otherContact.id, requestId },
      });

      const response = await authed(
        'get',
        `/feature-requests/${requestId}/votes`,
      ).expect(200);

      const body = response.body as VoteResponseDto[];

      expect(body).toHaveLength(2);
    });

    it('filters by contactId', async () => {
      const otherContact = await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-2',
          name: 'John Roe',
          email: 'john@example.com',
        },
      });
      await prisma.vote.create({ data: { contactId, requestId } });
      await prisma.vote.create({
        data: { contactId: otherContact.id, requestId },
      });

      const response = await authed(
        'get',
        `/feature-requests/${requestId}/votes`,
      )
        .query({ contactId })
        .expect(200);

      const body = response.body as VoteResponseDto[];

      expect(body).toHaveLength(1);
      expect(body[0].contactId).toBe(contactId);
    });

    it('returns 404 for an unknown feature request', async () => {
      await authed('get', '/feature-requests/does-not-exist/votes').expect(404);
    });
  });

  describe('GET /feature-requests/:requestId/votes/:id', () => {
    it('returns a single vote', async () => {
      const vote = await prisma.vote.create({ data: { contactId, requestId } });

      const response = await authed(
        'get',
        `/feature-requests/${requestId}/votes/${vote.id}`,
      ).expect(200);

      const body = response.body as VoteResponseDto;

      expect(body.id).toBe(vote.id);
    });

    it('returns 404 for an unknown id', async () => {
      await authed(
        'get',
        `/feature-requests/${requestId}/votes/does-not-exist`,
      ).expect(404);
    });

    it('returns 404 when the vote belongs to a different feature request', async () => {
      const otherRequest = await prisma.featureRequest.create({
        data: {
          title: 'Other',
          description: 'Other desc',
          workspaceId,
          authorId: contactId,
        },
      });
      const vote = await prisma.vote.create({
        data: { contactId, requestId: otherRequest.id },
      });

      await authed(
        'get',
        `/feature-requests/${requestId}/votes/${vote.id}`,
      ).expect(404);
    });
  });

  describe('PATCH /feature-requests/:requestId/votes/:id', () => {
    it('updates a vote', async () => {
      const vote = await prisma.vote.create({ data: { contactId, requestId } });
      const otherContact = await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-2',
          name: 'John Roe',
          email: 'john@example.com',
        },
      });

      const response = await authed(
        'patch',
        `/feature-requests/${requestId}/votes/${vote.id}`,
      )
        .send({ contactId: otherContact.id })
        .expect(200);

      const body = response.body as VoteResponseDto;

      expect(body.contactId).toBe(otherContact.id);
      expect(body.requestId).toBe(requestId);
    });

    it('returns 404 when updating an unknown id', async () => {
      await authed(
        'patch',
        `/feature-requests/${requestId}/votes/does-not-exist`,
      )
        .send({ contactId })
        .expect(404);
    });

    it('returns 409 when the update creates a duplicate vote', async () => {
      const otherContact = await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-2',
          name: 'John Roe',
          email: 'john@example.com',
        },
      });
      const vote = await prisma.vote.create({
        data: { contactId: otherContact.id, requestId },
      });
      await prisma.vote.create({ data: { contactId, requestId } });

      await authed('patch', `/feature-requests/${requestId}/votes/${vote.id}`)
        .send({ contactId })
        .expect(409);
    });
  });

  describe('DELETE /feature-requests/:requestId/votes/:id', () => {
    it('deletes a vote', async () => {
      const vote = await prisma.vote.create({ data: { contactId, requestId } });

      await authed(
        'delete',
        `/feature-requests/${requestId}/votes/${vote.id}`,
      ).expect(204);

      await authed(
        'get',
        `/feature-requests/${requestId}/votes/${vote.id}`,
      ).expect(404);
    });

    it('returns 404 when deleting an unknown id', async () => {
      await authed(
        'delete',
        `/feature-requests/${requestId}/votes/does-not-exist`,
      ).expect(404);
    });
  });
});
