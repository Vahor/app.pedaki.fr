import { prisma } from '@pedaki/db';
import { env } from '~/env.ts';

const main = async () => {
  console.log("Starting cron 'clear-old-data'");
  await removeOldPendingWorkspaceCreations();
  await removeOldWorkspaceTokens();
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

const removeOldWorkspaceTokens = async () => {
  const maxAge = 1000 * 60 * env.TOKEN_MAX_AGE;
  const maxDate = new Date(Date.now() - maxAge);

  const result = await prisma.workspaceToken.findMany({
    select: {
      workspaceId: true,
      createdAt: true,
    },
  });

  // group by workspaceId
  const groupedByWorkspaceId = result.reduce(
    (acc, token) => {
      if (!acc[token.workspaceId]) {
        acc[token.workspaceId] = [];
      }
      acc[token.workspaceId]!.push(token);
      return acc;
    },
    {} as Record<string, typeof result>,
  );

  const moreThanOneToken = Object.values(groupedByWorkspaceId).filter(tokens => tokens.length > 1);

  let count = 0;
  for (const tokens of moreThanOneToken) {
    const oldestToken = tokens.toSorted((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    if (!oldestToken) {
      continue;
    }
    const result = await prisma.workspaceToken.deleteMany({
      where: {
        workspaceId: oldestToken.workspaceId,
        createdAt: {
          lte: maxDate,
        },
      },
    });
    count += result.count;
    console.log(
      `[tokens] clear-old-data deleted ${result.count} tokens for workspace ${oldestToken.workspaceId}`,
    );
  }

  console.log(`[tokens] clear-old-data deleted ${count} tokens`);
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
