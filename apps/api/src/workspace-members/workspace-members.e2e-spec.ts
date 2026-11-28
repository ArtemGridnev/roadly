import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { prisma } from '../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { createAgent, createWorkspace } from 'test/utils/seed';
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
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const workspace = await createWorkspace();
    workspaceId = workspace.id;
    agentCookie = await loginAsAgentInWorkspace(app, workspaceId);

    const agent = await createAgent();
    agentId = agent.id;
  });

  function authed(method: 'get' | 'post' | 'patch' | 'delete', url: string) {
    return request(app.getHttpServer())
      [method](url)
      .set('Cookie', [agentCookie])
      .set(WORKSPACE_ID_HEADER, workspaceId);
  }

  describe('GET /workspace-members', () => {
    it('lists members of the resolved workspace', async () => {
      const otherAgent = await createAgent({ name: 'John Roe' });
      await prisma.workspaceMember.create({ data: { agentId, workspaceId } });
      await prisma.workspaceMember.create({
        data: { agentId: otherAgent.id, workspaceId },
      });

      const response = await authed('get', '/workspace-members').expect(200);

      const body = response.body as WorkspaceMemberResponseDto[];

      // includes the acting agent's own seeded membership plus the two above
      expect(body.length).toBeGreaterThanOrEqual(2);
    });

    it('rejects a request when the acting agent is not a member of the workspace', async () => {
      const otherWorkspace = await createWorkspace();

      await request(app.getHttpServer())
        .get('/workspace-members')
        .set('Cookie', [agentCookie])
        .set(WORKSPACE_ID_HEADER, otherWorkspace.id)
        .expect(403);
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
      const otherWorkspace = await createWorkspace();
      const member = await prisma.workspaceMember.create({
        data: { agentId, workspaceId: otherWorkspace.id },
      });

      await authed('get', `/workspace-members/${member.id}`).expect(404);
    });
  });
});
