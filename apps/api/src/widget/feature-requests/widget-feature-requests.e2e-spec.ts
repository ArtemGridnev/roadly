import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { prisma } from '../../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import {
  CONTACT_ID_HEADER,
  WIDGET_KEY_HEADER,
} from '../../auth/constants/widget-headers';
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
          .set(CONTACT_ID_HEADER, contactId)
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
          .set(CONTACT_ID_HEADER, otherContact.id)
          .expect(200);

        expect(
          hasVotedById(response.body as WidgetFeatureRequestResponseDto[]),
        ).toEqual({ [votedId]: false, [unvotedId]: false });
      });

      it('is false everywhere without a contact id header', async () => {
        const response = await request(app.getHttpServer())
          .get('/widget/feature-requests')
          .set(WIDGET_KEY_HEADER, widgetKey)
          .expect(200);

        expect(
          hasVotedById(response.body as WidgetFeatureRequestResponseDto[]),
        ).toEqual({ [votedId]: false, [unvotedId]: false });
      });

      it('rejects a contact id that does not belong to the workspace', async () => {
        await request(app.getHttpServer())
          .get('/widget/feature-requests')
          .set(WIDGET_KEY_HEADER, widgetKey)
          .set(CONTACT_ID_HEADER, 'does-not-exist')
          .expect(401);
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

  describe('POST /widget/feature-requests', () => {
    it('creates a feature request scoped to the resolved workspace and contact', async () => {
      const response = await request(app.getHttpServer())
        .post('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set(CONTACT_ID_HEADER, contactId)
        .send({ title: 'Dark mode', description: 'Please add dark mode' })
        .expect(201);

      const body = response.body as FeatureRequestResponseDto;

      expect(body).toMatchObject({
        title: 'Dark mode',
        description: 'Please add dark mode',
        workspaceId,
        authorId: contactId,
      });
    });

    it('rejects a request missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set(CONTACT_ID_HEADER, contactId)
        .send({ description: 'no title' })
        .expect(400);
    });

    it('rejects a client-supplied workspaceId or authorId', async () => {
      await request(app.getHttpServer())
        .post('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set(CONTACT_ID_HEADER, contactId)
        .send({
          title: 'Dark mode',
          description: 'Please add dark mode',
          workspaceId: 'attacker-workspace',
          authorId: 'attacker-contact',
        })
        .expect(400);
    });

    it('rejects a request missing the contact id header', async () => {
      await request(app.getHttpServer())
        .post('/widget/feature-requests')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .send({ title: 'Dark mode', description: 'Please add dark mode' })
        .expect(401);
    });

    it('rejects a contact id that belongs to a different workspace', async () => {
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
        .set(CONTACT_ID_HEADER, otherContact.id)
        .send({ title: 'Dark mode', description: 'Please add dark mode' })
        .expect(401);
    });
  });
});
