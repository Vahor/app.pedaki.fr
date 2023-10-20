import { prisma } from '@pedaki/db';

// eslint-disable-next-line @typescript-eslint/require-await
const main = async () => {
  console.log("Starting cron 'clear-old-pending'");

  const maxAge = 1000 * 60 * 30; // 30 minutes
  const maxDate = new Date(Date.now() - maxAge);

  // const result = await prisma.pendingWorkspaceCreation.deleteMany({
  //     where: {
  //         createdAt: {
  //             lte: maxDate
  //         }
  //     }
  // })

  // const count = result.count;
  const count = 0;
  console.log(`clear-old-pending deleted ${count} pending workspaces`);
};

main()
  .catch(console.error)
  .finally(() => void prisma.$disconnect());
