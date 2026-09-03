import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { hash } from 'bcryptjs';
import { prisma } from '../prisma-test-client';

function getCookies(response: request.Response): string[] {
  return response.get('Set-Cookie') as unknown as string[];
}

export async function createAgentInWorkspace(workspaceId: string) {
  const email = `agent-${Date.now()}-${Math.random()}@example.com`;
  const password = 'super-secret';

  const agent = await prisma.agent.create({
    data: { name: 'Test Agent', email, passwordHash: await hash(password, 10) },
  });

  await prisma.workspaceMember.create({
    data: { workspaceId, agentId: agent.id },
  });

  return { agent, email, password };
}

async function login(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(201);

  const accessCookie = getCookies(response).find((c) =>
    c.startsWith('access_token='),
  );

  if (!accessCookie) {
    throw new Error('Login did not return an access token cookie');
  }

  return accessCookie;
}

export async function loginAsAgentInWorkspace(
  app: INestApplication,
  workspaceId: string,
): Promise<string> {
  const { email, password } = await createAgentInWorkspace(workspaceId);
  return login(app, email, password);
}

export async function loginAsNewAgent(app: INestApplication): Promise<string> {
  const email = `agent-${Date.now()}-${Math.random()}@example.com`;
  const password = 'super-secret';

  await prisma.agent.create({
    data: { name: 'Test Agent', email, passwordHash: await hash(password, 10) },
  });

  return login(app, email, password);
}
