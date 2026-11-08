import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { prisma } from '../../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { WIDGET_KEY_HEADER } from '../../auth/constants/widget-headers';
import { ACCESS_COOKIE_NAME } from '../../auth/utils/authCookie';
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
