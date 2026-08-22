import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { prisma } from '../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { ContactResponseDto } from './dto/contact-response.dto';

describe('ContactsController (e2e)', () => {
  let app: INestApplication;
  let workspaceId: string;

  beforeAll(async () => {
    app = await createTestingApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const workspace = await prisma.workspace.create({
      data: { name: 'Acme', slug: `acme-${Date.now()}-${Math.random()}` },
    });
    workspaceId = workspace.id;
  });

  describe('POST /workspaces/:workspaceId/contacts', () => {
    it('creates a contact', async () => {
      const response = await request(app.getHttpServer())
        .post(`/workspaces/${workspaceId}/contacts`)
        .send({
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
        })
        .expect(201);

      const body = response.body as ContactResponseDto;

      expect(body).toMatchObject({
        workspaceId,
        externalId: 'ext-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
      });
      expect(body.id).toEqual(expect.any(String));
    });

    it('rejects a request missing required fields', async () => {
      await request(app.getHttpServer())
        .post(`/workspaces/${workspaceId}/contacts`)
        .send({ name: 'Jane Doe' })
        .expect(400);
    });

    it('rejects an invalid email', async () => {
      await request(app.getHttpServer())
        .post(`/workspaces/${workspaceId}/contacts`)
        .send({ externalId: 'ext-1', name: 'Jane Doe', email: 'not-an-email' })
        .expect(400);
    });

    it('rejects unknown fields', async () => {
      await request(app.getHttpServer())
        .post(`/workspaces/${workspaceId}/contacts`)
        .send({
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          notAllowed: 'nope',
        })
        .expect(400);
    });

    it('rejects a duplicate externalId within the same workspace', async () => {
      await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      });

      await request(app.getHttpServer())
        .post(`/workspaces/${workspaceId}/contacts`)
        .send({
          externalId: 'ext-1',
          name: 'Impostor',
          email: 'other@example.com',
        })
        .expect(409);
    });

    it('returns 404 for an unknown workspace', async () => {
      await request(app.getHttpServer())
        .post('/workspaces/does-not-exist/contacts')
        .send({
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
        })
        .expect(404);
    });
  });

  describe('GET /workspaces/:workspaceId/contacts', () => {
    it('lists contacts for a workspace', async () => {
      await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      });
      await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-2',
          name: 'John Roe',
          email: 'john@example.com',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/workspaces/${workspaceId}/contacts`)
        .expect(200);

      const body = response.body as ContactResponseDto[];

      expect(body).toHaveLength(2);
    });

    it('returns 404 for an unknown workspace', async () => {
      await request(app.getHttpServer())
        .get('/workspaces/does-not-exist/contacts')
        .expect(404);
    });
  });

  describe('GET /workspaces/:workspaceId/contacts/:id', () => {
    it('returns a single contact', async () => {
      const contact = await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/workspaces/${workspaceId}/contacts/${contact.id}`)
        .expect(200);

      const body = response.body as ContactResponseDto;

      expect(body.id).toBe(contact.id);
    });

    it('returns 404 for an unknown id', async () => {
      await request(app.getHttpServer())
        .get(`/workspaces/${workspaceId}/contacts/does-not-exist`)
        .expect(404);
    });

    it('returns 404 when the contact belongs to a different workspace', async () => {
      const otherWorkspace = await prisma.workspace.create({
        data: { name: 'Other', slug: `other-${Date.now()}-${Math.random()}` },
      });
      const contact = await prisma.contact.create({
        data: {
          workspaceId: otherWorkspace.id,
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      });

      await request(app.getHttpServer())
        .get(`/workspaces/${workspaceId}/contacts/${contact.id}`)
        .expect(404);
    });
  });

  describe('PATCH /workspaces/:workspaceId/contacts/:id', () => {
    it('updates a contact', async () => {
      const contact = await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/workspaces/${workspaceId}/contacts/${contact.id}`)
        .send({ name: 'Jane Updated' })
        .expect(200);

      const body = response.body as ContactResponseDto;

      expect(body.name).toBe('Jane Updated');
      expect(body.email).toBe('jane@example.com');
    });

    it('returns 404 when updating an unknown id', async () => {
      await request(app.getHttpServer())
        .patch(`/workspaces/${workspaceId}/contacts/does-not-exist`)
        .send({ name: 'Jane Updated' })
        .expect(404);
    });

    it('returns 409 when the update creates a duplicate externalId', async () => {
      await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      });
      const contact = await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-2',
          name: 'John Roe',
          email: 'john@example.com',
        },
      });

      await request(app.getHttpServer())
        .patch(`/workspaces/${workspaceId}/contacts/${contact.id}`)
        .send({ externalId: 'ext-1' })
        .expect(409);
    });
  });

  describe('DELETE /workspaces/:workspaceId/contacts/:id', () => {
    it('deletes a contact', async () => {
      const contact = await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      });

      await request(app.getHttpServer())
        .delete(`/workspaces/${workspaceId}/contacts/${contact.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/workspaces/${workspaceId}/contacts/${contact.id}`)
        .expect(404);
    });

    it('returns 404 when deleting an unknown id', async () => {
      await request(app.getHttpServer())
        .delete(`/workspaces/${workspaceId}/contacts/does-not-exist`)
        .expect(404);
    });
  });
});
