import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { prisma } from '../../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { widgetSessionHeader } from 'test/utils/widget-session';
import { WIDGET_KEY_HEADER } from '../../auth/constants/widget-headers';
import { FeatureRequestResponseDto } from '../../feature-requests/dto/feature-request-response.dto';
import { WidgetFeatureRequestResponseDto } from './dto/widget-feature-request-response.dto';

describe('WidgetFeatureRequestsController (e2e)', () => {
  let app: INestApplication;
  let workspaceId: string;
  let widgetKey: string;
  let contactId: string;

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

    const contact = await prisma.contact.create({
      data: {
        workspaceId,
        externalId: 'ext-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
    });
    contactId = contact.id;
  });

  describe('GET /widget/feature-requests', () => {
    it('lists feature requests scoped to the resolved workspace', async () => {
      await prisma.featureRequest.create({
        data: {
          title: 'Dark mode',
          description: 'Please add dark mode',
          workspaceId,
          authorId: contactId,
        },
      });

      const otherWorkspace = await prisma.workspace.create({
        data: { name: 'Other', slug: `other-${Date.now()}-${Math.random()}` },
      });
      const otherContact = await prisma.contact.create({
        data: {
          workspaceId: otherWorkspace.id,
          externalId: 'ext-1',
          name: 'John Roe',
          email: 'john@example.com',
        },
      });
      await prisma.featureRequest.create({
        data: {
          title: 'Other workspace request',
          description: 'Should not appear',
          workspaceId: otherWorkspace.id,
          authorId: otherContact.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .expect(200);

      const body = response.body as FeatureRequestResponseDto[];

      expect(body).toHaveLength(1);
      expect(body[0].title).toBe('Dark mode');
    });

    it('returns the vote count for each feature request', async () => {
      const featureRequest = await prisma.featureRequest.create({
        data: {
          title: 'Dark mode',
          description: 'Please add dark mode',
          workspaceId,
          authorId: contactId,
        },
      });

      const voter = await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-2',
          name: 'John Roe',
          email: 'john@example.com',
        },
      });
      await prisma.vote.createMany({
        data: [
          { requestId: featureRequest.id, contactId },
          { requestId: featureRequest.id, contactId: voter.id },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .expect(200);

      const body = response.body as FeatureRequestResponseDto[];

      expect(body[0].voteCount).toBe(2);
    });

    it('returns a zero vote count for a feature request with no votes', async () => {
      await prisma.featureRequest.create({
        data: {
          title: 'Dark mode',
          description: 'Please add dark mode',
          workspaceId,
          authorId: contactId,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .expect(200);

      const body = response.body as FeatureRequestResponseDto[];

      expect(body[0].voteCount).toBe(0);
    });

    describe('hasVoted', () => {
      let votedId: string;
      let unvotedId: string;

      beforeEach(async () => {
        const voted = await prisma.featureRequest.create({
          data: {
            title: 'Voted',
            description: 'Voted',
            workspaceId,
            authorId: contactId,
          },
        });
        const unvoted = await prisma.featureRequest.create({
          data: {
            title: 'Unvoted',
            description: 'Unvoted',
            workspaceId,
            authorId: contactId,
          },
        });
        votedId = voted.id;
        unvotedId = unvoted.id;

        await prisma.vote.create({ data: { requestId: votedId, contactId } });
      });

      const hasVotedById = (body: WidgetFeatureRequestResponseDto[]) =>
        Object.fromEntries(
          body.map((featureRequest) => [
            featureRequest.id,
            featureRequest.hasVoted,
          ]),
        );

      it("reflects the identified contact's votes", async () => {
        const response = await request(app.getHttpServer())
          .get('/widget/feature-requests')
          .set(WIDGET_KEY_HEADER, widgetKey)
          .set('Authorization', widgetSessionHeader(app, contactId, workspaceId))
          .expect(200);

        expect(
          hasVotedById(response.body as WidgetFeatureRequestResponseDto[]),
        ).toEqual({ [votedId]: true, [unvotedId]: false });
      });

      it("ignores other contacts' votes", async () => {
        const otherContact = await prisma.contact.create({
          data: {
            workspaceId,
            externalId: 'ext-2',
            name: 'John Roe',
            email: 'john@example.com',
          },
        });

        const response = await request(app.getHttpServer())
          .get('/widget/feature-requests')
          .set(WIDGET_KEY_HEADER, widgetKey)
          .set('Authorization', widgetSessionHeader(app, otherContact.id, otherContact.workspaceId))
          .expect(200);

        expect(
          hasVotedById(response.body as WidgetFeatureRequestResponseDto[]),
        ).toEqual({ [votedId]: false, [unvotedId]: false });
      });

      it('is false everywhere without a session token', async () => {
        const response = await request(app.getHttpServer())
          .get('/widget/feature-requests')
          .set(WIDGET_KEY_HEADER, widgetKey)
          .expect(200);

        expect(
          hasVotedById(response.body as WidgetFeatureRequestResponseDto[]),
        ).toEqual({ [votedId]: false, [unvotedId]: false });
      });

      it('rejects a contact that does not belong to the workspace', async () => {
        await request(app.getHttpServer())
          .get('/widget/feature-requests')
          .set(WIDGET_KEY_HEADER, widgetKey)
          .set('Authorization', widgetSessionHeader(app, 'does-not-exist', workspaceId))
          .expect(401);
      });
    });

    describe('isMine', () => {
      let mineId: string;
      let othersId: string;
      let otherContactId: string;

      beforeEach(async () => {
        const otherContact = await prisma.contact.create({
          data: {
            workspaceId,
            externalId: 'ext-2',
            name: 'John Roe',
            email: 'john@example.com',
          },
        });
        otherContactId = otherContact.id;

        const mine = await prisma.featureRequest.create({
          data: {
            title: 'Mine',
            description: 'Mine',
            workspaceId,
            authorId: contactId,
          },
        });
        const others = await prisma.featureRequest.create({
          data: {
            title: 'Others',
            description: 'Others',
            workspaceId,
            authorId: otherContactId,
          },
        });
        mineId = mine.id;
        othersId = others.id;
      });

      const isMineById = (body: WidgetFeatureRequestResponseDto[]) =>
        Object.fromEntries(
          body.map((featureRequest) => [
            featureRequest.id,
            featureRequest.isMine,
          ]),
        );

      it("marks only the identified contact's requests", async () => {
        const response = await request(app.getHttpServer())
          .get('/widget/feature-requests')
          .set(WIDGET_KEY_HEADER, widgetKey)
          .set('Authorization', widgetSessionHeader(app, contactId, workspaceId))
          .expect(200);

        expect(
          isMineById(response.body as WidgetFeatureRequestResponseDto[]),
        ).toEqual({ [mineId]: true, [othersId]: false });
      });

      it('is false everywhere without a session token', async () => {
        const response = await request(app.getHttpServer())
          .get('/widget/feature-requests')
          .set(WIDGET_KEY_HEADER, widgetKey)
          .expect(200);

        expect(
          isMineById(response.body as WidgetFeatureRequestResponseDto[]),
        ).toEqual({ [mineId]: false, [othersId]: false });
      });

      it("never exposes another contact's id", async () => {
        const response = await request(app.getHttpServer())
          .get('/widget/feature-requests')
          .set(WIDGET_KEY_HEADER, widgetKey)
          .set('Authorization', widgetSessionHeader(app, contactId, workspaceId))
          .expect(200);

        expect(JSON.stringify(response.body)).not.toContain(otherContactId);
      });

      it("never exposes any author's name or email", async () => {
        const response = await request(app.getHttpServer())
          .get('/widget/feature-requests')
          .set(WIDGET_KEY_HEADER, widgetKey)
          .set('Authorization', widgetSessionHeader(app, contactId, workspaceId))
          .expect(200);

        const serialized = JSON.stringify(response.body);
        expect(serialized).not.toContain('john@example.com');
        expect(serialized).not.toContain('John Roe');
        expect(serialized).not.toContain('jane@example.com');
        expect(
          (response.body as Record<string, unknown>[]).every(
            (featureRequest) => !('author' in featureRequest),
          ),
        ).toBe(true);
      });
    });

    describe('sorting', () => {
      let oldPopularId: string;
      let newUnpopularId: string;
      let midTiedOlderId: string;
      let midTiedNewerId: string;

      beforeEach(async () => {
        const voters = await Promise.all(
          [1, 2, 3].map((n) =>
            prisma.contact.create({
              data: {
                workspaceId,
                externalId: `voter-${n}`,
                name: `Voter ${n}`,
                email: `voter${n}@example.com`,
              },
            }),
          ),
        );

        const createRequest = (title: string, createdAt: string) =>
          prisma.featureRequest.create({
            data: {
              title,
              description: title,
              workspaceId,
              authorId: contactId,
              createdAt: new Date(createdAt),
            },
          });

        const oldPopular = await createRequest('Old popular', '2026-01-01');
        const midTiedOlder = await createRequest('Mid tied older', '2026-02-01');
        const midTiedNewer = await createRequest('Mid tied newer', '2026-03-01');
        const newUnpopular = await createRequest('New unpopular', '2026-04-01');

        oldPopularId = oldPopular.id;
        midTiedOlderId = midTiedOlder.id;
        midTiedNewerId = midTiedNewer.id;
        newUnpopularId = newUnpopular.id;

        await prisma.vote.createMany({
          data: [
            ...voters.map((voter) => ({
              requestId: oldPopular.id,
              contactId: voter.id,
            })),
            { requestId: midTiedOlder.id, contactId: voters[0].id },
            { requestId: midTiedNewer.id, contactId: voters[0].id },
          ],
        });
      });

      const listIds = async (query: string) => {
        const response = await request(app.getHttpServer())
          .get(`/widget/feature-requests${query}`)
          .set(WIDGET_KEY_HEADER, widgetKey)
          .expect(200);

        return (response.body as FeatureRequestResponseDto[]).map(
          (featureRequest) => featureRequest.id,
        );
      };

      it('orders by vote count when sort=top, breaking ties by newest', async () => {
        expect(await listIds('?sort=top')).toEqual([
          oldPopularId,
          midTiedNewerId,
          midTiedOlderId,
          newUnpopularId,
        ]);
      });

      it('orders by creation date when sort=newest', async () => {
        expect(await listIds('?sort=newest')).toEqual([
          newUnpopularId,
          midTiedNewerId,
          midTiedOlderId,
          oldPopularId,
        ]);
      });

      it('defaults to newest when no sort is given', async () => {
        expect(await listIds('')).toEqual(await listIds('?sort=newest'));
      });

      it('rejects an unknown sort value', async () => {
        await request(app.getHttpServer())
          .get('/widget/feature-requests?sort=oldest')
          .set(WIDGET_KEY_HEADER, widgetKey)
          .expect(400);
      });

      it('rejects the admin-only status filter', async () => {
        await request(app.getHttpServer())
          .get('/widget/feature-requests?status=SHIPPED')
          .set(WIDGET_KEY_HEADER, widgetKey)
          .expect(400);
      });
    });

    it('leaves out shipped feature requests', async () => {
      const open = await prisma.featureRequest.create({
        data: {
          title: 'Dark mode',
          description: 'Please add dark mode',
          workspaceId,
          authorId: contactId,
          status: 'IN_PROGRESS',
        },
      });
      await prisma.featureRequest.create({
        data: {
          title: 'CSV export',
          description: 'Already shipped',
          workspaceId,
          authorId: contactId,
          status: 'SHIPPED',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set('Authorization', widgetSessionHeader(app, contactId, workspaceId))
        .expect(200);

      expect(
        (response.body as WidgetFeatureRequestResponseDto[]).map(
          (featureRequest) => featureRequest.id,
        ),
      ).toEqual([open.id]);
    });

    it('rejects a request missing the widget key header', async () => {
      await request(app.getHttpServer())
        .get('/widget/feature-requests')
        .expect(401);
    });

    it('rejects a request with an unknown widget key', async () => {
      await request(app.getHttpServer())
        .get('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, 'does-not-exist')
        .expect(401);
    });
  });

  describe('GET /widget/feature-requests/mine', () => {
    let otherContactId: string;

    beforeEach(async () => {
      const otherContact = await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-2',
          name: 'John Roe',
          email: 'john@example.com',
        },
      });
      otherContactId = otherContact.id;
    });

    const createRequest = (
      title: string,
      authorId: string,
      createdAt: string,
      status: 'BACKLOG' | 'SHIPPED' = 'BACKLOG',
    ) =>
      prisma.featureRequest.create({
        data: {
          title,
          description: title,
          workspaceId,
          authorId,
          status,
          createdAt: new Date(createdAt),
        },
      });

    const listMine = async (query = '') => {
      const response = await request(app.getHttpServer())
        .get(`/widget/feature-requests/mine${query}`)
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set('Authorization', widgetSessionHeader(app, contactId, workspaceId))
        .expect(200);

      return response.body as WidgetFeatureRequestResponseDto[];
    };

    it("lists only the identified contact's requests, shipped included", async () => {
      const backlog = await createRequest('Mine', contactId, '2026-01-01');
      const shipped = await createRequest(
        'Mine shipped',
        contactId,
        '2026-02-01',
        'SHIPPED',
      );
      await createRequest('Others', otherContactId, '2026-03-01');

      const body = await listMine();

      expect(body.map((featureRequest) => featureRequest.id)).toEqual([
        shipped.id,
        backlog.id,
      ]);
      expect(body.every((featureRequest) => featureRequest.isMine)).toBe(true);
    });

    it('marks the author vote as hasVoted', async () => {
      await request(app.getHttpServer())
        .post('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set('Authorization', widgetSessionHeader(app, contactId, workspaceId))
        .send({ title: 'Dark mode', description: 'Please add dark mode' })
        .expect(201);

      const [featureRequest] = await listMine();

      expect(featureRequest).toMatchObject({ hasVoted: true, voteCount: 1 });
    });

    it('orders by vote count when sort=top', async () => {
      const older = await createRequest('Older', contactId, '2026-01-01');
      const newer = await createRequest('Newer', contactId, '2026-02-01');
      await prisma.vote.create({
        data: { requestId: older.id, contactId: otherContactId },
      });

      const body = await listMine('?sort=top');

      expect(body.map((featureRequest) => featureRequest.id)).toEqual([
        older.id,
        newer.id,
      ]);
    });

    it('rejects a request missing a session token', async () => {
      await request(app.getHttpServer())
        .get('/widget/feature-requests/mine')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .expect(401);
    });

    it('rejects a session for a contact that belongs to a different workspace', async () => {
      const otherWorkspace = await prisma.workspace.create({
        data: { name: 'Other', slug: `other-${Date.now()}-${Math.random()}` },
      });
      const outsider = await prisma.contact.create({
        data: {
          workspaceId: otherWorkspace.id,
          externalId: 'ext-1',
          name: 'John Roe',
          email: 'john@example.com',
        },
      });

      await request(app.getHttpServer())
        .get('/widget/feature-requests/mine')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set('Authorization', widgetSessionHeader(app, outsider.id, outsider.workspaceId))
        .expect(401);
    });
  });

  describe('POST /widget/feature-requests', () => {
    it('creates a feature request scoped to the resolved workspace and contact', async () => {
      const response = await request(app.getHttpServer())
        .post('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set('Authorization', widgetSessionHeader(app, contactId, workspaceId))
        .send({ title: 'Dark mode', description: 'Please add dark mode' })
        .expect(201);

      const body = response.body as WidgetFeatureRequestResponseDto;

      expect(body).toMatchObject({
        title: 'Dark mode',
        description: 'Please add dark mode',
        workspaceId,
        hasVoted: true,
        isMine: true,
      });
      expect(body).not.toHaveProperty('authorId');
      expect(body).not.toHaveProperty('author');
    });

    it("casts the author's vote on the new feature request", async () => {
      const response = await request(app.getHttpServer())
        .post('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set('Authorization', widgetSessionHeader(app, contactId, workspaceId))
        .send({ title: 'Dark mode', description: 'Please add dark mode' })
        .expect(201);

      const body = response.body as WidgetFeatureRequestResponseDto;
      const votes = await prisma.vote.findMany({
        where: { requestId: body.id },
      });

      expect(body.voteCount).toBe(1);
      expect(votes.map((vote) => vote.contactId)).toEqual([contactId]);
    });

    it('rejects a request missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set('Authorization', widgetSessionHeader(app, contactId, workspaceId))
        .send({ description: 'no title' })
        .expect(400);
    });

    it('rejects a client-supplied workspaceId or authorId', async () => {
      await request(app.getHttpServer())
        .post('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set('Authorization', widgetSessionHeader(app, contactId, workspaceId))
        .send({
          title: 'Dark mode',
          description: 'Please add dark mode',
          workspaceId: 'attacker-workspace',
          authorId: 'attacker-contact',
        })
        .expect(400);
    });

    it('rejects a request missing a session token', async () => {
      await request(app.getHttpServer())
        .post('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .send({ title: 'Dark mode', description: 'Please add dark mode' })
        .expect(401);
    });

    it('rejects a session for a contact that belongs to a different workspace', async () => {
      const otherWorkspace = await prisma.workspace.create({
        data: { name: 'Other', slug: `other-${Date.now()}-${Math.random()}` },
      });
      const otherContact = await prisma.contact.create({
        data: {
          workspaceId: otherWorkspace.id,
          externalId: 'ext-1',
          name: 'John Roe',
          email: 'john@example.com',
        },
      });

      await request(app.getHttpServer())
        .post('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set('Authorization', widgetSessionHeader(app, otherContact.id, otherContact.workspaceId))
        .send({ title: 'Dark mode', description: 'Please add dark mode' })
        .expect(401);
    });

    it('rate limits creating after 10 requests a minute, leaving the list readable', async () => {
      const body = { title: 'Dark mode', description: 'Please add dark mode' };

      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer())
          .post('/widget/feature-requests')
          .set(WIDGET_KEY_HEADER, widgetKey)
          .set('Authorization', widgetSessionHeader(app, contactId, workspaceId))
          .send(body)
          .expect(201);
      }

      await request(app.getHttpServer())
        .post('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set('Authorization', widgetSessionHeader(app, contactId, workspaceId))
        .send(body)
        .expect(429);

      await request(app.getHttpServer())
        .get('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .expect(200);
    });
  });
});
