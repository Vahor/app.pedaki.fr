import { prisma } from '@pedaki/db';
import {env} from "~/env.ts";

const main = async () => {
  console.log("Starting cron 'clear-old-pending'");

  const maxAge = 1000 * 60 * env.CRON_INTERVAL_MINUTES;
  const maxDate = new Date(Date.now() - maxAge);

  const result = await prisma.pendingWorkspaceCreation.deleteMany({
      where: {
          createdAt: {
              lte: maxDate
          }
      }
  })

  const count = result.count;
  console.log(`clear-old-pending deleted ${count} pending workspaces`);
};

main()
  .catch(console.error)
  .finally(() => void prisma.$disconnect());
