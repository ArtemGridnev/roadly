import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { prisma } from '../../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import {
  CONTACT_ID_HEADER,
  WIDGET_KEY_HEADER,
} from '../../auth/constants/widget-headers';
import { VoteResponseDto } from '../../votes/dto/vote-response.dto';

describe('WidgetVotesController (e2e)', () => {
  let app: INestApplication;
  let workspaceId: string;
  let widgetKey: string;
  let contactId: string;
  let requestId: string;

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

    const featureRequest = await prisma.featureRequest.create({
      data: {
        title: 'Dark mode',
        description: 'Please add dark mode',
        workspaceId,
        authorId: contactId,
      },
    });
    requestId = featureRequest.id;
  });

  describe('POST /widget/feature-requests/:requestId/votes', () => {
    it('creates a vote for the resolved contact', async () => {
      const response = await request(app.getHttpServer())
        .post(`/widget/feature-requests/${requestId}/votes`)
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set(CONTACT_ID_HEADER, contactId)
        .expect(201);

      const body = response.body as VoteResponseDto;

      expect(body).toMatchObject({ requestId, contactId });
    });

    it('rejects a second vote from the same contact on the same request', async () => {
      await request(app.getHttpServer())
        .post(`/widget/feature-requests/${requestId}/votes`)
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set(CONTACT_ID_HEADER, contactId)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/widget/feature-requests/${requestId}/votes`)
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set(CONTACT_ID_HEADER, contactId)
        .expect(409);
    });

    it('rejects a request missing the widget key header', async () => {
      await request(app.getHttpServer())
        .post(`/widget/feature-requests/${requestId}/votes`)
        .set(CONTACT_ID_HEADER, contactId)
        .expect(401);
    });

    it('rejects a request missing the contact id header', async () => {
      await request(app.getHttpServer())
        .post(`/widget/feature-requests/${requestId}/votes`)
        .set(WIDGET_KEY_HEADER, widgetKey)
        .expect(401);
    });

    it('returns 404 when the feature request belongs to a different workspace', async () => {
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
      const otherFeatureRequest = await prisma.featureRequest.create({
        data: {
          title: 'Other workspace request',
          description: 'Should not be votable from here',
          workspaceId: otherWorkspace.id,
          authorId: otherContact.id,
        },
      });

      await request(app.getHttpServer())
        .post(`/widget/feature-requests/${otherFeatureRequest.id}/votes`)
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set(CONTACT_ID_HEADER, contactId)
        .expect(404);
    });
  });

  describe('DELETE /widget/feature-requests/:requestId/votes', () => {
    it("removes the resolved contact's vote", async () => {
      await prisma.vote.create({ data: { requestId, contactId } });

      await request(app.getHttpServer())
        .delete(`/widget/feature-requests/${requestId}/votes`)
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set(CONTACT_ID_HEADER, contactId)
        .expect(204);

      expect(await prisma.vote.count({ where: { requestId } })).toBe(0);
    });

    it("leaves other contacts' votes in place", async () => {
      const otherContact = await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-2',
          name: 'John Roe',
          email: 'john@example.com',
        },
      });
      await prisma.vote.createMany({
        data: [
          { requestId, contactId },
          { requestId, contactId: otherContact.id },
        ],
      });

      await request(app.getHttpServer())
        .delete(`/widget/feature-requests/${requestId}/votes`)
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set(CONTACT_ID_HEADER, contactId)
        .expect(204);

      const remaining = await prisma.vote.findMany({ where: { requestId } });
      expect(remaining.map((vote) => vote.contactId)).toEqual([
        otherContact.id,
      ]);
    });

    it('allows voting again after the vote is removed', async () => {
      await prisma.vote.create({ data: { requestId, contactId } });

      await request(app.getHttpServer())
        .delete(`/widget/feature-requests/${requestId}/votes`)
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set(CONTACT_ID_HEADER, contactId)
        .expect(204);

      await request(app.getHttpServer())
        .post(`/widget/feature-requests/${requestId}/votes`)
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set(CONTACT_ID_HEADER, contactId)
        .expect(201);
    });

    it('returns 404 when the contact has not voted', async () => {
      await request(app.getHttpServer())
        .delete(`/widget/feature-requests/${requestId}/votes`)
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set(CONTACT_ID_HEADER, contactId)
        .expect(404);
    });

    it('rejects a request missing the contact id header', async () => {
      await request(app.getHttpServer())
        .delete(`/widget/feature-requests/${requestId}/votes`)
        .set(WIDGET_KEY_HEADER, widgetKey)
        .expect(401);
    });

    it('returns 404 when the feature request belongs to a different workspace', async () => {
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
      const otherFeatureRequest = await prisma.featureRequest.create({
        data: {
          title: 'Other workspace request',
          description: 'Should not be unvotable from here',
          workspaceId: otherWorkspace.id,
          authorId: otherContact.id,
        },
      });
      await prisma.vote.create({
        data: { requestId: otherFeatureRequest.id, contactId: otherContact.id },
      });

      await request(app.getHttpServer())
        .delete(`/widget/feature-requests/${otherFeatureRequest.id}/votes`)
        .set(WIDGET_KEY_HEADER, widgetKey)
        .set(CONTACT_ID_HEADER, contactId)
        .expect(404);

      expect(
        await prisma.vote.count({
          where: { requestId: otherFeatureRequest.id },
        }),
      ).toBe(1);
    });
  });
});
