import { Prisma } from '@prisma/client';
import { prisma } from '../prisma-test-client';

let sequence = 0;

function next() {
  sequence += 1;
  return sequence;
}

export function createWorkspace(
  data: Partial<Prisma.WorkspaceUncheckedCreateInput> = {},
) {
  return prisma.workspace.create({
    data: { name: 'Acme', slug: `workspace-${next()}`, ...data },
  });
}

export function createAgent(
  data: Partial<Prisma.AgentUncheckedCreateInput> = {},
) {
  return prisma.agent.create({
    data: {
      name: 'Jane Doe',
      email: `agent-${next()}@example.com`,
      passwordHash: 'hash',
      ...data,
    },
  });
}

export function createContact(
  workspaceId: string,
  data: Partial<Prisma.ContactUncheckedCreateInput> = {},
) {
  return prisma.contact.create({
    data: { workspaceId, externalId: `contact-${next()}`, ...data },
  });
}

export function createFeatureRequest(
  workspaceId: string,
  data: Partial<Prisma.FeatureRequestUncheckedCreateInput> = {},
) {
  return prisma.featureRequest.create({
    data: {
      workspaceId,
      title: 'Dark mode',
      description: 'Please add dark mode',
      ...data,
    },
  });
}

export async function seedWorkspaceWithContact() {
  const workspace = await createWorkspace();
  const contact = await createContact(workspace.id, {
    externalId: 'ext-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
  });

  return {
    workspaceId: workspace.id,
    authorId: contact.id,
    widgetKey: workspace.widgetKey,
    contactExternalId: contact.externalId,
  };
}
