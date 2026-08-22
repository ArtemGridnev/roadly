import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { prisma } from '../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { seedWorkspaceWithContact } from 'test/utils/seed';
import { VoteResponseDto } from './dto/vote-response.dto';

describe('VotesController (e2e)', () => {
  let app: INestApplication;
  let workspaceId: string;
  let contactId: string;
  let requestId: string;

  beforeAll(async () => {
    app = await createTestingApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    ({ workspaceId, authorId: contactId } = await seedWorkspaceWithContact());
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

  describe('POST /feature-requests/:requestId/votes', () => {
    it('creates a vote', async () => {
      const response = await request(app.getHttpServer())
        .post(`/feature-requests/${requestId}/votes`)
        .send({ contactId })
        .expect(201);

      const body = response.body as VoteResponseDto;

      expect(body).toMatchObject({ contactId, requestId });
      expect(body.id).toEqual(expect.any(String));
    });

    it('rejects a request missing required fields', async () => {
      await request(app.getHttpServer())
        .post(`/feature-requests/${requestId}/votes`)
        .send({})
        .expect(400);
    });

    it('rejects unknown fields', async () => {
      await request(app.getHttpServer())
        .post(`/feature-requests/${requestId}/votes`)
        .send({ contactId, notAllowed: 'nope' })
        .expect(400);
    });

    it('rejects a duplicate vote from the same contact', async () => {
      await prisma.vote.create({ data: { contactId, requestId } });

      await request(app.getHttpServer())
        .post(`/feature-requests/${requestId}/votes`)
        .send({ contactId })
        .expect(409);
    });

    it('returns 404 for an unknown feature request', async () => {
      await request(app.getHttpServer())
        .post('/feature-requests/does-not-exist/votes')
        .send({ contactId })
        .expect(404);
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

      const response = await request(app.getHttpServer())
        .get(`/feature-requests/${requestId}/votes`)
        .expect(200);

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

      const response = await request(app.getHttpServer())
        .get(`/feature-requests/${requestId}/votes`)
        .query({ contactId })
        .expect(200);

      const body = response.body as VoteResponseDto[];

      expect(body).toHaveLength(1);
      expect(body[0].contactId).toBe(contactId);
    });

    it('returns 404 for an unknown feature request', async () => {
      await request(app.getHttpServer())
        .get('/feature-requests/does-not-exist/votes')
        .expect(404);
    });
  });

  describe('GET /feature-requests/:requestId/votes/:id', () => {
    it('returns a single vote', async () => {
      const vote = await prisma.vote.create({ data: { contactId, requestId } });

      const response = await request(app.getHttpServer())
        .get(`/feature-requests/${requestId}/votes/${vote.id}`)
        .expect(200);

      const body = response.body as VoteResponseDto;

      expect(body.id).toBe(vote.id);
    });

    it('returns 404 for an unknown id', async () => {
      await request(app.getHttpServer())
        .get(`/feature-requests/${requestId}/votes/does-not-exist`)
        .expect(404);
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

      await request(app.getHttpServer())
        .get(`/feature-requests/${requestId}/votes/${vote.id}`)
        .expect(404);
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

      const response = await request(app.getHttpServer())
        .patch(`/feature-requests/${requestId}/votes/${vote.id}`)
        .send({ contactId: otherContact.id })
        .expect(200);

      const body = response.body as VoteResponseDto;

      expect(body.contactId).toBe(otherContact.id);
      expect(body.requestId).toBe(requestId);
    });

    it('returns 404 when updating an unknown id', async () => {
      await request(app.getHttpServer())
        .patch(`/feature-requests/${requestId}/votes/does-not-exist`)
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

      await request(app.getHttpServer())
        .patch(`/feature-requests/${requestId}/votes/${vote.id}`)
        .send({ contactId })
        .expect(409);
    });
  });

  describe('DELETE /feature-requests/:requestId/votes/:id', () => {
    it('deletes a vote', async () => {
      const vote = await prisma.vote.create({ data: { contactId, requestId } });

      await request(app.getHttpServer())
        .delete(`/feature-requests/${requestId}/votes/${vote.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/feature-requests/${requestId}/votes/${vote.id}`)
        .expect(404);
    });

    it('returns 404 when deleting an unknown id', async () => {
      await request(app.getHttpServer())
        .delete(`/feature-requests/${requestId}/votes/does-not-exist`)
        .expect(404);
    });
  });
});
