import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { prisma } from '../../../test/prisma-test-client';
import { createTestingApp } from 'test/utils/create-testing-app';
import { WIDGET_KEY_HEADER } from '../../auth/constants/widget-headers';
import { ContactResponseDto } from '../../contacts/dto/contact-response.dto';

describe('WidgetContactsController (e2e)', () => {
  let app: INestApplication;
  let workspaceId: string;
  let widgetKey: string;

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

  describe('POST /widget/contacts', () => {
    it('creates a contact when the externalId is new', async () => {
      const response = await request(app.getHttpServer())
        .post('/widget/contacts')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .send({ externalId: 'ext-1', name: 'Jane Doe', email: 'jane@example.com' })
        .expect(201);

      const body = response.body as ContactResponseDto;

      expect(body).toMatchObject({
        workspaceId,
        externalId: 'ext-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
      });
      expect(body.id).toEqual(expect.any(String));
    });

    it('returns the existing contact and refreshes its data when the externalId already exists', async () => {
      const existing = await prisma.contact.create({
        data: {
          workspaceId,
          externalId: 'ext-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      });

      const response = await request(app.getHttpServer())
        .post('/widget/contacts')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .send({ externalId: 'ext-1', name: 'Jane Updated', email: 'jane2@example.com' })
        .expect(201);

      const body = response.body as ContactResponseDto;

      expect(body.id).toBe(existing.id);
      expect(body.name).toBe('Jane Updated');
      expect(body.email).toBe('jane2@example.com');

      expect(await prisma.contact.count({ where: { workspaceId } })).toBe(1);
    });

    it('rejects a request missing the widget key header', async () => {
      await request(app.getHttpServer())
        .post('/widget/contacts')
        .send({ externalId: 'ext-1', name: 'Jane Doe', email: 'jane@example.com' })
        .expect(401);
    });

    it('rejects a request with an unknown widget key', async () => {
      await request(app.getHttpServer())
        .post('/widget/contacts')
        .set(WIDGET_KEY_HEADER, 'does-not-exist')
        .send({ externalId: 'ext-1', name: 'Jane Doe', email: 'jane@example.com' })
        .expect(401);
    });

    it('rejects a request missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/widget/contacts')
        .set(WIDGET_KEY_HEADER, widgetKey)
        .send({ name: 'Jane Doe' })
        .expect(400);
    });
  });
});
