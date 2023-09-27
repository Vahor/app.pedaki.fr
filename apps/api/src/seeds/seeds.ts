import { seedPermissions } from '~/seeds/permissions.seed.ts';

export const seedDatabase = async () => {
  console.log('Starting seeds...');
  await seedPermissions();
  console.log('Seeds finished');
};
