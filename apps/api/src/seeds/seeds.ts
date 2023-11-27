import { logger } from '@pedaki/logger';

// eslint-disable-next-line @typescript-eslint/require-await
export const seedDatabase = async () => {
  const profiler = logger.startTimer();
  profiler.done({ message: 'Seeding database' });
};
