import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { prisma } from '../../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import {
  CONTACT_ID_HEADER,
  WIDGET_KEY_HEADER,
} from '../../auth/constants/widget-headers';
import { FeatureRequestResponseDto } from '../../feature-requests/dto/feature-request-response.dto';

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
