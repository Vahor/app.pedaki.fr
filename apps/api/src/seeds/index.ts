import { prisma } from '@pedaki/db';
import { seedDatabase } from '~/seeds/seeds.ts';

seedDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
