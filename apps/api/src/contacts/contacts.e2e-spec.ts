import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { prisma } from '../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { loginAsAgentInWorkspace } from 'test/utils/auth';
import { WORKSPACE_ID_HEADER } from '../auth/constants/workspace-header';
import { ContactResponseDto } from './dto/contact-response.dto';

describe('ContactsController (e2e)', () => {
  let app: INestApplication;
  let workspaceId: string;
  let agentCookie: string;

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
    agentCookie = await loginAsAgentInWorkspace(app, workspaceId);
  });

  function authed(method: 'get' | 'post' | 'patch' | 'delete', url: string) {
    return request(app.getHttpServer())
      [method](url)
      .set('Cookie', [agentCookie])
      .set(WORKSPACE_ID_HEADER, workspaceId);
  }

  describe('POST /contacts', () => {
    it('creates a contact', async () => {
      const response = await authed('post', '/contacts')
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
      await authed('post', '/contacts').send({ name: 'Jane Doe' }).expect(400);
    });

    it('rejects an invalid email', async () => {
      await authed('post', '/contacts')
        .send({ externalId: 'ext-1', name: 'Jane Doe', email: 'not-an-email' })
        .expect(400);
    });

    it('rejects unknown fields', async () => {
      await authed('post', '/contacts')
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

      await authed('post', '/contacts')
        .send({
          externalId: 'ext-1',
          name: 'Impostor',
          email: 'other@example.com',
        })
        .expect(409);
    });

    it('rejects a request with no access token', async () => {
      await request(app.getHttpServer())
        .post('/contacts')
        .set(WORKSPACE_ID_HEADER, workspaceId)
        .send({
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
        })
        .expect(401);
    });

    it('rejects a request missing the workspace id header', async () => {
      await request(app.getHttpServer())
        .post('/contacts')
        .set('Cookie', [agentCookie])
        .send({
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
        })
        .expect(400);
    });

    it('rejects a request when the agent is not a member of the workspace', async () => {
      const otherWorkspace = await prisma.workspace.create({
        data: { name: 'Other', slug: `other-${Date.now()}-${Math.random()}` },
      });

      await request(app.getHttpServer())
        .post('/contacts')
        .set('Cookie', [agentCookie])
        .set(WORKSPACE_ID_HEADER, otherWorkspace.id)
        .send({
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
        })
        .expect(403);
    });
  });

  describe('GET /contacts', () => {
    it('lists contacts for the resolved workspace', async () => {
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

      const response = await authed('get', '/contacts').expect(200);

      const body = response.body as ContactResponseDto[];

      expect(body).toHaveLength(2);
    });
  });

  describe('GET /contacts/:id', () => {
    it('returns a single contact', async () => {
      const contact = await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      });

      const response = await authed('get', `/contacts/${contact.id}`).expect(
        200,
      );

      const body = response.body as ContactResponseDto;

      expect(body.id).toBe(contact.id);
    });

    it('returns 404 for an unknown id', async () => {
      await authed('get', '/contacts/does-not-exist').expect(404);
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

      await authed('get', `/contacts/${contact.id}`).expect(404);
    });
  });

  describe('PATCH /contacts/:id', () => {
    it('updates a contact', async () => {
      const contact = await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      });

      const response = await authed('patch', `/contacts/${contact.id}`)
        .send({ name: 'Jane Updated' })
        .expect(200);

      const body = response.body as ContactResponseDto;

      expect(body.name).toBe('Jane Updated');
      expect(body.email).toBe('jane@example.com');
    });

    it('returns 404 when updating an unknown id', async () => {
      await authed('patch', '/contacts/does-not-exist')
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

      await authed('patch', `/contacts/${contact.id}`)
        .send({ externalId: 'ext-1' })
        .expect(409);
    });
  });

  describe('DELETE /contacts/:id', () => {
    it('deletes a contact', async () => {
      const contact = await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      });

      await authed('delete', `/contacts/${contact.id}`).expect(204);

      await authed('get', `/contacts/${contact.id}`).expect(404);
    });

    it('returns 404 when deleting an unknown id', async () => {
      await authed('delete', '/contacts/does-not-exist').expect(404);
    });
  });
});
