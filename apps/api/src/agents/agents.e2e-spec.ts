import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestingApp } from 'test/utils/create-testing-app';
import { loginAsNewAgent } from 'test/utils/auth';

describe('Agents routes (e2e)', () => {
  let app: INestApplication;
  let agentCookie: string;

  beforeAll(async () => {
    app = await createTestingApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    agentCookie = await loginAsNewAgent(app);
  });

  it.each([
    ['post', '/agents'],
    ['get', '/agents'],
    ['get', '/agents/some-id'],
    ['patch', '/agents/some-id'],
    ['delete', '/agents/some-id'],
  ] as const)('does not expose %s %s', async (method, url) => {
    await request(app.getHttpServer())
      [method](url)
      .set('Cookie', [agentCookie])
      .expect(404);
  });
});
