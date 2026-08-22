import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { RequestStatus } from '@prisma/client';
import { prisma } from '../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { seedWorkspaceWithContact } from 'test/utils/seed';
import { FeatureRequestResponseDto } from './dto/feature-request-response.dto';

describe('FeatureRequestsController (e2e)', () => {
  let app: INestApplication;
  let workspaceId: string;
  let authorId: string;

  beforeAll(async () => {
    app = await createTestingApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    ({ workspaceId, authorId } = await seedWorkspaceWithContact());
  });

  describe('POST /feature-requests', () => {
    it('creates a feature request', async () => {
      const response = await request(app.getHttpServer())
        .post('/feature-requests')
        .send({
          title: 'Dark mode',
          description: 'Please add dark mode',
          workspaceId,
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
      await request(app.getHttpServer())
        .post('/feature-requests')
        .send({ description: 'no title' })
        .expect(400);
    });

    it('rejects unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/feature-requests')
        .send({
          title: 'Dark mode',
          description: 'Please add dark mode',
          workspaceId,
          authorId,
          notAllowed: 'nope',
        })
        .expect(400);
    });
  });

  describe('GET /feature-requests', () => {
    it('lists feature requests for a workspace', async () => {
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

      const response = await request(app.getHttpServer())
        .get('/feature-requests')
        .query({ workspaceId })
        .expect(200);

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

      const response = await request(app.getHttpServer())
        .get('/feature-requests')
        .query({ workspaceId, status: RequestStatus.PLANNED })
        .expect(200);

      const body = response.body as FeatureRequestResponseDto[];

      expect(body).toHaveLength(1);
      expect(body[0].status).toBe(RequestStatus.PLANNED);
    });

    it('requires a workspaceId', async () => {
      await request(app.getHttpServer()).get('/feature-requests').expect(400);
    });
  });

  describe('GET /feature-requests/:id', () => {
    it('returns a single feature request', async () => {
      const featureRequest = await prisma.featureRequest.create({
        data: { title: 'A', description: 'A desc', workspaceId, authorId },
      });

      const response = await request(app.getHttpServer())
        .get(`/feature-requests/${featureRequest.id}`)
        .expect(200);

      const body = response.body as FeatureRequestResponseDto;

      expect(body.id).toBe(featureRequest.id);
    });

    it('returns 404 for an unknown id', async () => {
      await request(app.getHttpServer())
        .get('/feature-requests/does-not-exist')
        .expect(404);
    });
  });

  describe('PATCH /feature-requests/:id', () => {
    it('updates a feature request', async () => {
      const featureRequest = await prisma.featureRequest.create({
        data: { title: 'A', description: 'A desc', workspaceId, authorId },
      });

      const response = await request(app.getHttpServer())
        .patch(`/feature-requests/${featureRequest.id}`)
        .send({ status: RequestStatus.IN_PROGRESS })
        .expect(200);

      const body = response.body as FeatureRequestResponseDto;

      expect(body.status).toBe(RequestStatus.IN_PROGRESS);
      expect(body.title).toBe('A');
    });

    it('returns 404 when updating an unknown id', async () => {
      await request(app.getHttpServer())
        .patch('/feature-requests/does-not-exist')
        .send({ status: RequestStatus.PLANNED })
        .expect(404);
    });
  });

  describe('DELETE /feature-requests/:id', () => {
    it('deletes a feature request', async () => {
      const featureRequest = await prisma.featureRequest.create({
        data: { title: 'A', description: 'A desc', workspaceId, authorId },
      });

      await request(app.getHttpServer())
        .delete(`/feature-requests/${featureRequest.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/feature-requests/${featureRequest.id}`)
        .expect(404);
    });

    it('returns 404 when deleting an unknown id', async () => {
      await request(app.getHttpServer())
        .delete('/feature-requests/does-not-exist')
        .expect(404);
    });
  });
});
