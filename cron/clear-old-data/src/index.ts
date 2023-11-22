import { prisma } from '@pedaki/db';
import { env } from '~/env.ts';

const main = async () => {
  console.log("Starting cron 'clear-old-data'");
  await removeOldPendingWorkspaceCreations();
  await removeOldWorkspaceInvitations();
  console.log("Finished cron 'clear-old-data'");
};

const removeOldPendingWorkspaceCreations = async () => {
  const maxAge = 1000 * 60 * env.PENDING_MAX_AGE;
  const maxDate = new Date(Date.now() - maxAge);

  const result = await prisma.pendingWorkspaceCreation.deleteMany({
    where: {
      createdAt: {
        lte: maxDate,
      },
    },
  });

  const count = result.count;
  console.log(`clear-old-data deleted ${count} pending workspaces`);
};

const removeOldWorkspaceInvitations = async () => {
  const maxAge = 1000 * 60 * env.INVITATION_MAX_AGE;
  const maxDate = new Date(Date.now() - maxAge);

  const result = await prisma.pendingWorkspaceInvite.deleteMany({
    where: {
      createdAt: {
        lte: maxDate,
      },
    },
  });

  const count = result.count;
  console.log(`clear-old-data deleted ${count} workspace invitations`);
};

main()
  .catch(console.error)
  .finally(() => void prisma.$disconnect());
