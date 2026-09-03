import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { prisma } from '../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { loginAsAgentInWorkspace } from 'test/utils/auth';
import { WORKSPACE_ID_HEADER } from '../auth/constants/workspace-header';
import { WorkspaceMemberResponseDto } from './dto/workspace-member-response.dto';

describe('WorkspaceMembersController (e2e)', () => {
  let app: INestApplication;
  let workspaceId: string;
  let agentId: string;
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

    const agent = await prisma.agent.create({
      data: {
        name: 'Jane Doe',
        email: `jane-${Date.now()}-${Math.random()}@example.com`,
        passwordHash: 'hash',
      },
    });
    agentId = agent.id;
  });

  function authed(method: 'get' | 'post' | 'patch' | 'delete', url: string) {
    return request(app.getHttpServer())
      [method](url)
      .set('Cookie', [agentCookie])
      .set(WORKSPACE_ID_HEADER, workspaceId);
  }

  describe('POST /workspace-members', () => {
    it('creates a workspace member', async () => {
      const response = await authed('post', '/workspace-members')
        .send({ agentId })
        .expect(201);

      const body = response.body as WorkspaceMemberResponseDto;

      expect(body).toMatchObject({ workspaceId, agentId });
      expect(body.id).toEqual(expect.any(String));
    });

    it('rejects a request missing required fields', async () => {
      await authed('post', '/workspace-members').send({}).expect(400);
    });

    it('rejects unknown fields', async () => {
      await authed('post', '/workspace-members')
        .send({ agentId, notAllowed: 'nope' })
        .expect(400);
    });

    it('rejects a duplicate membership for the same agent', async () => {
      await prisma.workspaceMember.create({ data: { agentId, workspaceId } });

      await authed('post', '/workspace-members').send({ agentId }).expect(409);
    });

    it('rejects a request with no access token', async () => {
      await request(app.getHttpServer())
        .post('/workspace-members')
        .set(WORKSPACE_ID_HEADER, workspaceId)
        .send({ agentId })
        .expect(401);
    });

    it('rejects a request missing the workspace id header', async () => {
      await request(app.getHttpServer())
        .post('/workspace-members')
        .set('Cookie', [agentCookie])
        .send({ agentId })
        .expect(400);
    });

    it('rejects a request when the acting agent is not a member of the workspace', async () => {
      const otherWorkspace = await prisma.workspace.create({
        data: { name: 'Other', slug: `other-${Date.now()}-${Math.random()}` },
      });

      await request(app.getHttpServer())
        .post('/workspace-members')
        .set('Cookie', [agentCookie])
        .set(WORKSPACE_ID_HEADER, otherWorkspace.id)
        .send({ agentId })
        .expect(403);
    });
  });

  describe('GET /workspace-members', () => {
    it('lists members of the resolved workspace', async () => {
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

      const response = await authed('get', '/workspace-members').expect(200);

      const body = response.body as WorkspaceMemberResponseDto[];

      // includes the acting agent's own seeded membership plus the two above
      expect(body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /workspace-members/:id', () => {
    it('returns a single workspace member', async () => {
      const member = await prisma.workspaceMember.create({
        data: { agentId, workspaceId },
      });

      const response = await authed(
        'get',
        `/workspace-members/${member.id}`,
      ).expect(200);

      const body = response.body as WorkspaceMemberResponseDto;

      expect(body.id).toBe(member.id);
    });

    it('returns 404 for an unknown id', async () => {
      await authed('get', '/workspace-members/does-not-exist').expect(404);
    });

    it('returns 404 when the member belongs to a different workspace', async () => {
      const otherWorkspace = await prisma.workspace.create({
        data: { name: 'Other', slug: `other-${Date.now()}-${Math.random()}` },
      });
      const member = await prisma.workspaceMember.create({
        data: { agentId, workspaceId: otherWorkspace.id },
      });

      await authed('get', `/workspace-members/${member.id}`).expect(404);
    });
  });

  describe('DELETE /workspace-members/:id', () => {
    it('deletes a workspace member', async () => {
      const member = await prisma.workspaceMember.create({
        data: { agentId, workspaceId },
      });

      await authed('delete', `/workspace-members/${member.id}`).expect(204);

      await authed('get', `/workspace-members/${member.id}`).expect(404);
    });

    it('returns 404 when deleting an unknown id', async () => {
      await authed('delete', '/workspace-members/does-not-exist').expect(404);
    });
  });
});
