import { prisma } from '../prisma-test-client';

export async function truncateAll() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('_prisma_migrations')
  `;

  if (tables.length === 0) return;

  const names = tables.map((t) => `"public"."${t.tablename}"`).join(', ');

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE;`,
  );
}
