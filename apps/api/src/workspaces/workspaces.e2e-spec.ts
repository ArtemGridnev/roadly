import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { prisma } from '../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';

describe('WorkspacesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /workspaces', () => {
    it('creates a workspace', async () => {
      const response = await request(app.getHttpServer())
        .post('/workspaces')
        .send({ name: 'Acme', slug: 'acme' })
        .expect(201);

      const body = response.body as WorkspaceResponseDto;

      expect(body).toMatchObject({ name: 'Acme', slug: 'acme' });
      expect(body.id).toEqual(expect.any(String));
      expect(body.widgetKey).toEqual(expect.any(String));
    });

    it('rejects a request missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/workspaces')
        .send({ name: 'Acme' })
        .expect(400);
    });

    it('rejects unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/workspaces')
        .send({ name: 'Acme', slug: 'acme', notAllowed: 'nope' })
        .expect(400);
    });

    it('rejects a duplicate slug', async () => {
      await request(app.getHttpServer())
        .post('/workspaces')
        .send({ name: 'Acme', slug: 'acme' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/workspaces')
        .send({ name: 'Acme Impostor', slug: 'acme' })
        .expect(409);
    });
  });

  describe('GET /workspaces', () => {
    it('lists workspaces', async () => {
      await prisma.workspace.create({ data: { name: 'A', slug: 'a' } });
      await prisma.workspace.create({ data: { name: 'B', slug: 'b' } });

      const response = await request(app.getHttpServer())
        .get('/workspaces')
        .expect(200);

      const body = response.body as WorkspaceResponseDto[];

      expect(body).toHaveLength(2);
    });
  });

  describe('GET /workspaces/:id', () => {
    it('returns a single workspace', async () => {
      const workspace = await prisma.workspace.create({
        data: { name: 'A', slug: 'a' },
      });

      const response = await request(app.getHttpServer())
        .get(`/workspaces/${workspace.id}`)
        .expect(200);

      const body = response.body as WorkspaceResponseDto;

      expect(body.id).toBe(workspace.id);
    });

    it('returns 404 for an unknown id', async () => {
      await request(app.getHttpServer())
        .get('/workspaces/does-not-exist')
        .expect(404);
    });
  });

  describe('PATCH /workspaces/:id', () => {
    it('updates a workspace', async () => {
      const workspace = await prisma.workspace.create({
        data: { name: 'A', slug: 'a' },
      });

      const response = await request(app.getHttpServer())
        .patch(`/workspaces/${workspace.id}`)
        .send({ name: 'A Updated' })
        .expect(200);

      const body = response.body as WorkspaceResponseDto;

      expect(body.name).toBe('A Updated');
      expect(body.slug).toBe('a');
    });

    it('returns 404 when updating an unknown id', async () => {
      await request(app.getHttpServer())
        .patch('/workspaces/does-not-exist')
        .send({ name: 'A Updated' })
        .expect(404);
    });

    it('returns 409 when the update creates a duplicate slug', async () => {
      await prisma.workspace.create({ data: { name: 'A', slug: 'a' } });
      const workspace = await prisma.workspace.create({
        data: { name: 'B', slug: 'b' },
      });

      await request(app.getHttpServer())
        .patch(`/workspaces/${workspace.id}`)
        .send({ slug: 'a' })
        .expect(409);
    });
  });

  describe('DELETE /workspaces/:id', () => {
    it('deletes a workspace', async () => {
      const workspace = await prisma.workspace.create({
        data: { name: 'A', slug: 'a' },
      });

      await request(app.getHttpServer())
        .delete(`/workspaces/${workspace.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/workspaces/${workspace.id}`)
        .expect(404);
    });

    it('returns 404 when deleting an unknown id', async () => {
      await request(app.getHttpServer())
        .delete('/workspaces/does-not-exist')
        .expect(404);
    });
  });
});
