import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { prisma } from '../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { loginAsAgentInWorkspace, loginAsNewAgent } from 'test/utils/auth';
import { WORKSPACE_ID_HEADER } from '../auth/constants/workspace-header';
import { IdentitySecretResponseDto } from './dto/identity-secret-response.dto';
import { WorkspaceIdentityResponseDto } from './dto/workspace-identity-response.dto';

describe('WorkspaceIdentityController (e2e)', () => {
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

  function authed(method: 'get' | 'post' | 'patch', url: string) {
    return request(app.getHttpServer())
      [method](url)
      .set('Cookie', [agentCookie])
      .set(WORKSPACE_ID_HEADER, workspaceId);
  }

  const getStatus = async () =>
    (await authed('get', '/workspace-identity').expect(200))
      .body as WorkspaceIdentityResponseDto;

  const markConnected = () =>
    prisma.workspace.update({
      where: { id: workspaceId },
      data: { signedIdentityConnectedAt: new Date() },
    });

  const rotateSecret = async () =>
    (
      (await authed('post', '/workspace-identity/secret').expect(201))
        .body as IdentitySecretResponseDto
    ).secret;

  describe('GET /workspace-identity', () => {
    it('reports a fresh workspace as not set up', async () => {
      expect(await getStatus()).toEqual({
        widgetConnected: false,
        signedIdentityConnected: false,
        hasSecret: false,
        requireSignedIdentity: false,
      });
    });

    it('reports the widget connected once a contact exists', async () => {
      await prisma.contact.create({
        data: { workspaceId, externalId: 'ext-1' },
      });

      expect(await getStatus()).toMatchObject({
        widgetConnected: true,
        signedIdentityConnected: false,
      });
    });

    it('reports signed identity connected', async () => {
      await markConnected();

      expect(await getStatus()).toMatchObject({
        signedIdentityConnected: true,
      });
    });

    it('ignores contacts in other workspaces', async () => {
      const otherWorkspace = await prisma.workspace.create({
        data: { name: 'Other', slug: `other-${Date.now()}-${Math.random()}` },
      });
      await prisma.contact.create({
        data: {
          workspaceId: otherWorkspace.id,
          externalId: 'ext-1',
        },
      });

      expect(await getStatus()).toMatchObject({ widgetConnected: false });
    });

    it('rejects an agent outside the workspace', async () => {
      const outsiderCookie = await loginAsNewAgent(app);

      await request(app.getHttpServer())
        .get('/workspace-identity')
        .set('Cookie', [outsiderCookie])
        .set(WORKSPACE_ID_HEADER, workspaceId)
        .expect(403);
    });

    it('rejects a request without an agent', async () => {
      await request(app.getHttpServer())
        .get('/workspace-identity')
        .set(WORKSPACE_ID_HEADER, workspaceId)
        .expect(401);
    });
  });

  describe('POST /workspace-identity/secret', () => {
    it('returns the secret once and stores it encrypted', async () => {
      const secret = await rotateSecret();

      const workspace = await prisma.workspace.findUniqueOrThrow({
        where: { id: workspaceId },
      });
      expect(secret.length).toBeGreaterThanOrEqual(43);
      expect(workspace.identitySecret).not.toContain(secret);
      expect(await getStatus()).toMatchObject({ hasSecret: true });
    });

    it('keeps the previous secret for 24 hours when rotating', async () => {
      await rotateSecret();
      const { identitySecret: first } =
        await prisma.workspace.findUniqueOrThrow({
          where: { id: workspaceId },
        });

      await rotateSecret();

      const workspace = await prisma.workspace.findUniqueOrThrow({
        where: { id: workspaceId },
      });
      expect(workspace.previousIdentitySecret).toBe(first);
      const overlapHours =
        ((workspace.previousIdentitySecretExpiresAt?.getTime() ?? 0) -
          Date.now()) /
        3_600_000;
      expect(overlapHours).toBeGreaterThan(23.9);
      expect(overlapHours).toBeLessThanOrEqual(24);
    });

    it('clears the connected state, so the new secret must be used first', async () => {
      await rotateSecret();
      await markConnected();

      await rotateSecret();

      expect(await getStatus()).toMatchObject({
        signedIdentityConnected: false,
      });
      await authed('patch', '/workspace-identity')
        .send({ requireSignedIdentity: true })
        .expect(409);
    });

    it('rejects an agent outside the workspace', async () => {
      const outsiderCookie = await loginAsNewAgent(app);

      await request(app.getHttpServer())
        .post('/workspace-identity/secret')
        .set('Cookie', [outsiderCookie])
        .set(WORKSPACE_ID_HEADER, workspaceId)
        .expect(403);
    });
  });

  describe('PATCH /workspace-identity', () => {
    it('refuses to require signed identity before a signed session', async () => {
      await prisma.contact.create({
        data: { workspaceId, externalId: 'ext-1' },
      });

      await authed('patch', '/workspace-identity')
        .send({ requireSignedIdentity: true })
        .expect(409);

      expect(await getStatus()).toMatchObject({ requireSignedIdentity: false });
    });

    it('requires signed identity once a signed session has worked', async () => {
      await markConnected();

      const response = await authed('patch', '/workspace-identity')
        .send({ requireSignedIdentity: true })
        .expect(200);

      expect(response.body).toMatchObject({ requireSignedIdentity: true });
    });

    it('can always turn enforcement off', async () => {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { requireSignedIdentity: true },
      });

      await authed('patch', '/workspace-identity')
        .send({ requireSignedIdentity: false })
        .expect(200);

      expect(await getStatus()).toMatchObject({ requireSignedIdentity: false });
    });

    it.each(['yes', 'false', 1])(
      'rejects the non-boolean value %p',
      async (value) => {
        await prisma.workspace.update({
          where: { id: workspaceId },
          data: { requireSignedIdentity: true },
        });

        await authed('patch', '/workspace-identity')
          .send({ requireSignedIdentity: value })
          .expect(400);

        expect(await getStatus()).toMatchObject({
          requireSignedIdentity: true,
        });
      },
    );

    it('rejects an agent outside the workspace', async () => {
      const outsiderCookie = await loginAsNewAgent(app);

      await request(app.getHttpServer())
        .patch('/workspace-identity')
        .set('Cookie', [outsiderCookie])
        .set(WORKSPACE_ID_HEADER, workspaceId)
        .send({ requireSignedIdentity: false })
        .expect(403);
    });
  });
});
