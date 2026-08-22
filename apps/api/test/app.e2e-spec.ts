import { prisma } from './prisma-test-client';
import { truncateAll } from './utils/truncate';

beforeEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await prisma.$disconnect();
});
