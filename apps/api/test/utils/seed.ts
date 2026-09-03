import { prisma } from '../prisma-test-client';

export async function seedWorkspaceWithContact() {
  const workspace = await prisma.workspace.create({
    data: { name: 'Acme', slug: `acme-${Date.now()}-${Math.random()}` },
  });
  const contact = await prisma.contact.create({
    data: {
      workspaceId: workspace.id,
      externalId: 'ext-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
    },
  });

  return {
    workspaceId: workspace.id,
    authorId: contact.id,
    widgetKey: workspace.widgetKey,
    contactExternalId: contact.externalId,
  };
}
