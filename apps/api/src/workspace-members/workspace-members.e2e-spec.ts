import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { prisma } from '../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { WorkspaceMemberResponseDto } from './dto/workspace-member-response.dto';

describe('WorkspaceMembersController (e2e)', () => {
  let app: INestApplication;
  let workspaceId: string;
  let agentId: string;

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

    const agent = await prisma.agent.create({
      data: {
        name: 'Jane Doe',
        email: `jane-${Date.now()}-${Math.random()}@example.com`,
        passwordHash: 'hash',
      },
    });
    agentId = agent.id;
  });

  describe('POST /workspaces/:workspaceId/members', () => {
    it('creates a workspace member', async () => {
      const response = await request(app.getHttpServer())
        .post(`/workspaces/${workspaceId}/members`)
        .send({ agentId })
        .expect(201);

      const body = response.body as WorkspaceMemberResponseDto;

      expect(body).toMatchObject({ workspaceId, agentId });
      expect(body.id).toEqual(expect.any(String));
    });

    it('rejects a request missing required fields', async () => {
      await request(app.getHttpServer())
        .post(`/workspaces/${workspaceId}/members`)
        .send({})
        .expect(400);
    });

    it('rejects unknown fields', async () => {
      await request(app.getHttpServer())
        .post(`/workspaces/${workspaceId}/members`)
        .send({ agentId, notAllowed: 'nope' })
        .expect(400);
    });

    it('rejects a duplicate membership for the same agent', async () => {
      await prisma.workspaceMember.create({ data: { agentId, workspaceId } });

      await request(app.getHttpServer())
        .post(`/workspaces/${workspaceId}/members`)
        .send({ agentId })
        .expect(409);
    });

    it('returns 404 for an unknown workspace', async () => {
      await request(app.getHttpServer())
        .post('/workspaces/does-not-exist/members')
        .send({ agentId })
        .expect(404);
    });
  });

  describe('GET /workspaces/:workspaceId/members', () => {
    it('lists members of a workspace', async () => {
      const otherAgent = await prisma.agent.create({
        data: {
          name: 'John Roe',
          email: `john-${Date.now()}-${Math.random()}@example.com`,
          passwordHash: 'hash',
        },
      });
      await prisma.workspaceMember.create({ data: { agentId, workspaceId } });
      await prisma.workspaceMember.create({
        data: { agentId: otherAgent.id, workspaceId },
      });

      const response = await request(app.getHttpServer())
        .get(`/workspaces/${workspaceId}/members`)
        .expect(200);

      const body = response.body as WorkspaceMemberResponseDto[];

      expect(body).toHaveLength(2);
    });

    it('returns 404 for an unknown workspace', async () => {
      await request(app.getHttpServer())
        .get('/workspaces/does-not-exist/members')
        .expect(404);
    });
  });

  describe('GET /workspaces/:workspaceId/members/:id', () => {
    it('returns a single workspace member', async () => {
      const member = await prisma.workspaceMember.create({
        data: { agentId, workspaceId },
      });

      const response = await request(app.getHttpServer())
        .get(`/workspaces/${workspaceId}/members/${member.id}`)
        .expect(200);

      const body = response.body as WorkspaceMemberResponseDto;

      expect(body.id).toBe(member.id);
    });

    it('returns 404 for an unknown id', async () => {
      await request(app.getHttpServer())
        .get(`/workspaces/${workspaceId}/members/does-not-exist`)
        .expect(404);
    });

    it('returns 404 when the member belongs to a different workspace', async () => {
      const otherWorkspace = await prisma.workspace.create({
        data: { name: 'Other', slug: `other-${Date.now()}-${Math.random()}` },
      });
      const member = await prisma.workspaceMember.create({
        data: { agentId, workspaceId: otherWorkspace.id },
      });

      await request(app.getHttpServer())
        .get(`/workspaces/${workspaceId}/members/${member.id}`)
        .expect(404);
    });
  });

  describe('DELETE /workspaces/:workspaceId/members/:id', () => {
    it('deletes a workspace member', async () => {
      const member = await prisma.workspaceMember.create({
        data: { agentId, workspaceId },
      });

      await request(app.getHttpServer())
        .delete(`/workspaces/${workspaceId}/members/${member.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/workspaces/${workspaceId}/members/${member.id}`)
        .expect(404);
    });

    it('returns 404 when deleting an unknown id', async () => {
      await request(app.getHttpServer())
        .delete(`/workspaces/${workspaceId}/members/does-not-exist`)
        .expect(404);
    });
  });
});
