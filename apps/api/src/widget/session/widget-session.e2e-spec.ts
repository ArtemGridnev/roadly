import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { prisma } from '../../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { WIDGET_KEY_HEADER } from '../../auth/constants/widget-headers';
import { ACCESS_COOKIE_NAME } from '../../auth/utils/authCookie';
import { WorkspaceIdentityService } from '../../workspace-identity/workspace-identity.service';
import { WidgetSessionResponseDto } from './dto/widget-session-response.dto';

describe('WidgetSessionController (e2e)', () => {
  const identity = {
    externalId: 'ext-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
  };
  const jwtService = new JwtService({});

  let app: INestApplication;
  let workspaceId: string;
  let widgetKey: string;

  const createSession = async (key = widgetKey, body: object = identity) => {
    const response = await request(app.getHttpServer())
      .post('/widget/session/unsigned')
      .set(WIDGET_KEY_HEADER, key)
      .send(body)
      .expect(201);

    return response.body as WidgetSessionResponseDto;
  };

  const listMine = (key: string, token: string) =>
    request(app.getHttpServer())
      .get('/widget/feature-requests/mine')
      .set(WIDGET_KEY_HEADER, key)
      .set('Authorization', `Bearer ${token}`);

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
    widgetKey = workspace.widgetKey;
  });

  describe('POST /widget/session/unsigned', () => {
    it('creates the contact and returns a session', async () => {
      const session = await createSession();

      const contact = await prisma.contact.findUniqueOrThrow({
        where: { id: session.contactId },
      });
      expect(contact).toMatchObject({ workspaceId, ...identity });
      expect(session.sessionToken).toEqual(expect.any(String));
    });

    it('never returns contact details', async () => {
      const response = await request(app.getHttpServer())
        .post('/widget/session/unsigned')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .send(identity)
        .expect(201);

      expect(Object.keys(response.body as object).sort()).toEqual([
        'contactId',
        'sessionToken',
      ]);
    });

    it('never overwrites an existing contact', async () => {
      const first = await createSession();
      const second = await createSession(widgetKey, {
        ...identity,
        name: 'Attacker',
        email: 'attacker@example.com',
      });

      expect(second.contactId).toBe(first.contactId);
      const contact = await prisma.contact.findUniqueOrThrow({
        where: { id: first.contactId },
      });
      expect(contact).toMatchObject(identity);
    });

    it('rejects a missing widget key', async () => {
      await request(app.getHttpServer())
        .post('/widget/session/unsigned')
        .send(identity)
        .expect(401);
    });

    it('rejects an unknown widget key', async () => {
      await request(app.getHttpServer())
        .post('/widget/session/unsigned')
        .set(WIDGET_KEY_HEADER, 'does-not-exist')
        .send(identity)
        .expect(401);
    });

    it('rejects missing fields', async () => {
      await request(app.getHttpServer())
        .post('/widget/session/unsigned')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .send({ name: 'Jane Doe' })
        .expect(400);
    });

    it('rejects an externalId longer than 255 characters', async () => {
      await request(app.getHttpServer())
        .post('/widget/session/unsigned')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .send({ ...identity, externalId: 'x'.repeat(256) })
        .expect(400);
    });

    it('rejects a name longer than 255 characters', async () => {
      await request(app.getHttpServer())
        .post('/widget/session/unsigned')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .send({ ...identity, name: 'x'.repeat(256) })
        .expect(400);
    });

    it('rate limits per workspace after 60 requests a minute', async () => {
      for (let i = 0; i < 60; i++) {
        await createSession();
      }

      await request(app.getHttpServer())
        .post('/widget/session/unsigned')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .send(identity)
        .expect(429);

      const otherWorkspace = await prisma.workspace.create({
        data: { name: 'Other', slug: `other-${Date.now()}-${Math.random()}` },
      });
      await createSession(otherWorkspace.widgetKey);
    });
  });

  describe('POST /widget/session/signed', () => {
    let identitySecret: string;

    const rotateSecret = async (id = workspaceId) =>
      (await app.get(WorkspaceIdentityService).rotateSecret(id)).secret;

    const signIdentity = (
      claims: object,
      options: Record<string, unknown> = {},
      secret = identitySecret,
    ) =>
      jwtService.sign(claims, {
        secret,
        algorithm: 'HS256',
        expiresIn: '1h',
        ...options,
      });

    const createSignedSession = (token: string, key = widgetKey) =>
      request(app.getHttpServer())
        .post('/widget/session/signed')
        .set(WIDGET_KEY_HEADER, key)
        .send({ token });

    const findContact = (externalId = 'ext-1') =>
      prisma.contact.findUniqueOrThrow({
        where: { workspaceId_externalId: { workspaceId, externalId } },
      });

    beforeEach(async () => {
      identitySecret = await rotateSecret();
    });

    it('creates a contact from a token with only user_id', async () => {
      const response = await createSignedSession(
        signIdentity({ user_id: 'ext-1' }),
      ).expect(201);

      const session = response.body as WidgetSessionResponseDto;
      expect(Object.keys(session).sort()).toEqual([
        'contactId',
        'sessionToken',
      ]);
      const contact = await findContact();
      expect(contact).toMatchObject({
        id: session.contactId,
        name: null,
        email: null,
        emailVerifiedAt: null,
      });
      await listMine(widgetKey, session.sessionToken).expect(200);
    });

    it('verifies the email only when the token includes it', async () => {
      await createSignedSession(
        signIdentity({ user_id: 'ext-1', name: 'Jane', email: 'jane@acme.io' }),
      ).expect(201);

      const contact = await findContact();
      expect(contact).toMatchObject({ name: 'Jane', email: 'jane@acme.io' });
      expect(contact.emailVerifiedAt).toEqual(expect.any(Date));
    });

    it('keeps stored values and leaves an unsigned email unverified', async () => {
      await createSession();

      await createSignedSession(signIdentity({ user_id: 'ext-1' })).expect(201);

      const contact = await findContact();
      expect(contact).toMatchObject({ ...identity, emailVerifiedAt: null });
    });

    it('corrects stored values from the claims it carries', async () => {
      await createSession();

      await createSignedSession(
        signIdentity({ user_id: 'ext-1', name: 'Jane Smith' }),
      ).expect(201);

      expect(await findContact()).toMatchObject({
        name: 'Jane Smith',
        email: identity.email,
      });
    });

    it('marks the workspace connected only with the current secret', async () => {
      const previousSecret = identitySecret;
      identitySecret = await rotateSecret();
      const connectedAt = async () =>
        (
          await prisma.workspace.findUniqueOrThrow({
            where: { id: workspaceId },
          })
        ).signedIdentityConnectedAt;

      await createSignedSession(
        signIdentity({ user_id: 'ext-1' }, {}, previousSecret),
      ).expect(201);
      expect(await connectedAt()).toBeNull();

      await createSignedSession(signIdentity({ user_id: 'ext-1' })).expect(201);
      expect(await connectedAt()).toEqual(expect.any(Date));
    });

    it('accepts the previous secret for 24 hours after rotation', async () => {
      const previousSecret = identitySecret;
      identitySecret = await rotateSecret();

      await createSignedSession(signIdentity({ user_id: 'ext-1' })).expect(201);
      await createSignedSession(
        signIdentity({ user_id: 'ext-1' }, {}, previousSecret),
      ).expect(201);

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { previousIdentitySecretExpiresAt: new Date(Date.now() - 1000) },
      });

      await createSignedSession(
        signIdentity({ user_id: 'ext-1' }, {}, previousSecret),
      ).expect(401);
    });

    it.each([
      ['a wrong secret', () => signIdentity({ user_id: 'ext-1' }, {}, 'wrong')],
      [
        'another algorithm',
        () => signIdentity({ user_id: 'ext-1' }, { algorithm: 'HS512' }),
      ],
      [
        'an expired token',
        () => signIdentity({ user_id: 'ext-1' }, { expiresIn: -120 }),
      ],
      [
        'a token valid for more than 1 hour',
        () => signIdentity({ user_id: 'ext-1' }, { expiresIn: '2h' }),
      ],
      [
        'a token without exp',
        () =>
          jwtService.sign(
            { user_id: 'ext-1' },
            { secret: identitySecret, algorithm: 'HS256' },
          ),
      ],
      ['a token without user_id', () => signIdentity({ name: 'Jane' })],
      ['a numeric user_id', () => signIdentity({ user_id: 42 })],
      [
        'an invalid email',
        () => signIdentity({ user_id: 'ext-1', email: 'not-an-email' }),
      ],
      ['garbage', () => 'garbage'],
    ])('rejects %s', async (_case, makeToken) => {
      await createSignedSession(makeToken()).expect(401);

      expect(await prisma.contact.count({ where: { workspaceId } })).toBe(0);
    });

    it('rejects an unsigned alg none token', async () => {
      const encode = (value: object) =>
        Buffer.from(JSON.stringify(value)).toString('base64url');
      const token = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
        user_id: 'ext-1',
        exp: Math.floor(Date.now() / 1000) + 600,
      })}.`;

      await createSignedSession(token).expect(401);
    });

    it("rejects a token signed with another workspace's secret", async () => {
      const otherWorkspace = await prisma.workspace.create({
        data: { name: 'Other', slug: `other-${Date.now()}-${Math.random()}` },
      });
      const otherSecret = await rotateSecret(otherWorkspace.id);

      await createSignedSession(
        signIdentity({ user_id: 'ext-1' }, {}, otherSecret),
      ).expect(401);
    });

    it('rejects every token when the workspace has no secret', async () => {
      const otherWorkspace = await prisma.workspace.create({
        data: { name: 'Other', slug: `other-${Date.now()}-${Math.random()}` },
      });

      await createSignedSession(
        signIdentity({ user_id: 'ext-1' }),
        otherWorkspace.widgetKey,
      ).expect(401);
    });

    it('rejects a missing token', async () => {
      await request(app.getHttpServer())
        .post('/widget/session/signed')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .send({})
        .expect(400);
    });
  });

  describe('signed identity enforcement', () => {
    let identitySecret: string;

    const signedSession = async (userId: string) => {
      const token = jwtService.sign(
        { user_id: userId },
        { secret: identitySecret, algorithm: 'HS256', expiresIn: '1h' },
      );
      const response = await request(app.getHttpServer())
        .post('/widget/session/signed')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .send({ token })
        .expect(201);

      return response.body as WidgetSessionResponseDto;
    };

    const requireSignedIdentity = () =>
      prisma.workspace.update({
        where: { id: workspaceId },
        data: { requireSignedIdentity: true },
      });

    beforeEach(async () => {
      identitySecret = (
        await app.get(WorkspaceIdentityService).rotateSecret(workspaceId)
      ).secret;
    });

    it('allows an unsigned session for an externalId that has signed in, until required', async () => {
      const signed = await signedSession(identity.externalId);

      const unsigned = await createSession();

      expect(unsigned.contactId).toBe(signed.contactId);
    });

    it('marks a request verified only when sent with a signed session', async () => {
      const signed = await signedSession(identity.externalId);
      const unsigned = await createSession();

      for (const [title, session] of [
        ['Signed', signed],
        ['Unsigned', unsigned],
      ] as const) {
        await request(app.getHttpServer())
          .post('/widget/feature-requests')
          .set(WIDGET_KEY_HEADER, widgetKey)
          .set('Authorization', `Bearer ${session.sessionToken}`)
          .send({ title, description: 'desc' })
          .expect(201);
      }

      const requests = await prisma.featureRequest.findMany({
        where: { workspaceId },
        select: { title: true, authorVerified: true },
      });
      expect(
        Object.fromEntries(requests.map((r) => [r.title, r.authorVerified])),
      ).toEqual({
        Signed: true,
        Unsigned: false,
      });
    });

    it('refuses unsigned sessions once required', async () => {
      await signedSession('ext-2');
      await requireSignedIdentity();

      await request(app.getHttpServer())
        .post('/widget/session/unsigned')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .send(identity)
        .expect(403);
    });

    it('ends existing unsigned sessions and keeps signed ones', async () => {
      const unsigned = await createSession();
      const signed = await signedSession('ext-2');

      await requireSignedIdentity();

      await listMine(widgetKey, unsigned.sessionToken).expect(401);
      await listMine(widgetKey, signed.sessionToken).expect(200);
    });

    it('still serves the public list without a session', async () => {
      await requireSignedIdentity();

      await request(app.getHttpServer())
        .get('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .expect(200);
    });
  });

  describe('session token', () => {
    const signWith = (
      secret: string,
      options: Record<string, unknown>,
      payload: object,
    ) => jwtService.sign(payload, { secret, ...options });

    const sessionSecret = () => process.env.WIDGET_SESSION_SECRET as string;

    it('authenticates the contact', async () => {
      const { sessionToken, contactId } = await createSession();

      await prisma.featureRequest.create({
        data: {
          title: 'Dark mode',
          description: 'Please add dark mode',
          workspaceId,
          authorId: contactId,
        },
      });

      const response = await listMine(widgetKey, sessionToken).expect(200);

      expect(response.body).toHaveLength(1);
    });

    it('fails with another workspace key', async () => {
      const { sessionToken } = await createSession();
      const otherWorkspace = await prisma.workspace.create({
        data: { name: 'Other', slug: `other-${Date.now()}-${Math.random()}` },
      });

      await listMine(otherWorkspace.widgetKey, sessionToken).expect(401);
    });

    it('fails once the contact is deleted', async () => {
      const { sessionToken, contactId } = await createSession();

      await prisma.contact.delete({ where: { id: contactId } });

      await listMine(widgetKey, sessionToken).expect(401);
    });

    it('rejects a garbage token, even on a route with no contact required', async () => {
      await listMine(widgetKey, 'garbage').expect(401);
      await request(app.getHttpServer())
        .get('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set('Authorization', 'Bearer garbage')
        .expect(401);
    });

    it('rejects a token signed with another secret', async () => {
      const { contactId } = await createSession();
      const token = signWith(
        'some-other-secret',
        { audience: 'roadly-widget-session' },
        { sub: contactId, workspaceId },
      );

      await listMine(widgetKey, token).expect(401);
    });

    it('rejects an agent access token', async () => {
      const { contactId } = await createSession();
      const token = signWith(
        process.env.ACCESS_TOKEN_SECRET as string,
        {},
        { sub: contactId, workspaceId, username: 'jane@example.com' },
      );

      await listMine(widgetKey, token).expect(401);
    });

    it('rejects a token for another audience', async () => {
      const { contactId } = await createSession();
      const token = signWith(
        sessionSecret(),
        { audience: 'something-else' },
        { sub: contactId, workspaceId },
      );

      await listMine(widgetKey, token).expect(401);
    });

    it('rejects an expired token', async () => {
      const { contactId } = await createSession();
      const token = signWith(
        sessionSecret(),
        { audience: 'roadly-widget-session', expiresIn: -1 },
        { sub: contactId, workspaceId },
      );

      await listMine(widgetKey, token).expect(401);
    });

    it('rejects an unsigned alg none token', async () => {
      const { contactId } = await createSession();
      const encode = (value: object) =>
        Buffer.from(JSON.stringify(value)).toString('base64url');
      const token = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
        sub: contactId,
        workspaceId,
        aud: 'roadly-widget-session',
      })}.`;

      await listMine(widgetKey, token).expect(401);
    });

    it('is not accepted as an agent access token', async () => {
      const { sessionToken } = await createSession();

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `${ACCESS_COOKIE_NAME}=${sessionToken}`)
        .expect(401);
    });
  });
});
