import { prisma } from '@pedaki/db';
import { logger } from '@pedaki/logger';
import { DOCKER_IMAGE } from '@pedaki/pulumi/utils/docker.js';
import { invitationService } from '@pedaki/services/invitation/invitation.service.js';
import { resourceService } from '@pedaki/services/resource/resource.service.js';
import { workspaceService } from '@pedaki/services/workspace/workspace.service.js';
import { env } from '~/env.ts';
// import { PrismaInstrumentation } from '@prisma/instrumentation';
import { initTelemetry } from '@pedaki/logger/telemetry.js';

const WORKSPACE_SUBDOMAIN = 'demo';
const PEDAKI_BILLING_EMAIL = 'demo@pedaki.fr';
const PEDAKI_BILLING_NAME = 'Pedaki';

const BASE_PARAMETERS = {
  subdomain: WORKSPACE_SUBDOMAIN,
  vpc: {
    provider: 'aws',
    region: 'eu-west-3',
  },
  server: {
    size: 'small',
    environment_variables: {
      IS_DEMO: 'true',
      PEDAKI_BILLING_EMAIL: PEDAKI_BILLING_EMAIL,
      PEDAKI_BILLING_NAME: PEDAKI_BILLING_NAME,
      PEDAKI_BILLING_PASSWORD: 'demo',
    },
  },
  database: {
    size: 'small',
  },
  dns: {
    subdomain: 'demo',
  },
  workspace: {
    subdomain: WORKSPACE_SUBDOMAIN,
  },
} as const;

const stackParameters = (workspaceId: string, subscriptionId: number, authToken: string) =>
  ({
    ...BASE_PARAMETERS,
    workspace: {
      ...BASE_PARAMETERS.workspace,
      id: workspaceId,
      subscriptionId,
    },
    server: {
      ...BASE_PARAMETERS.server,
      environment_variables: {
        ...BASE_PARAMETERS.server.environment_variables,
        PEDAKI_AUTH_TOKEN: authToken,
      },
    },
  }) as const;

const main = async () => {
  initTelemetry([
    // new PrismaInstrumentation(),
  ]);

  const profiler = logger.startTimer();

  logger.info(
    "Starting cron 'cron-demo-community'",
    `This will use the ${DOCKER_IMAGE} docker image`,
  );
  await prisma.$connect();

  const response = await workspaceService.getLatestSubscription(WORKSPACE_SUBDOMAIN);

  let subscriptionId: number;
  let workspaceId: string;
  let authToken = '';

  if (response) {
    const { subscriptionId: previousSubscriptionId, workspaceId: previousWorkspaceId } = response;
    if (env.DELETE_OLD_STACK) {
      logger.info(`Deleting previous stack for subscription ${previousSubscriptionId}`);
      await resourceService.deleteStack(
        stackParameters(previousWorkspaceId, previousSubscriptionId, authToken),
      );
    } else {
      logger.info(
        `DELETE_OLD_STACK is false, keeping previous stack for subscription ${previousSubscriptionId}`,
      );
    }

    subscriptionId = previousSubscriptionId;
    workspaceId = previousWorkspaceId;
    const token = await workspaceService.registerNewWorkspaceToken({
      workspaceId: previousWorkspaceId,
    });
    authToken = `${previousWorkspaceId}:${token}`;

    // Update subscription
    await workspaceService.updateWorkspaceSubscriptionStripeData({
      subscriptionId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
      endedAt: null,
      cancelAt: null,
      canceledAt: null,
    });

    await workspaceService.updateExpectedStatus({
      workspaceId,
      status: 'CREATING',
    });
  } else {
    logger.info('No previous subscription found, creating a new one');
    const {
      subscriptionId: newSubscriptionId,
      authToken: newAuthToken,
      workspaceId: newWorkspaceId,
    } = await workspaceService.createWorkspace({
      workspace: {
        creationData: BASE_PARAMETERS,
        subdomain: WORKSPACE_SUBDOMAIN,
        billing: {
          email: PEDAKI_BILLING_EMAIL,
          name: PEDAKI_BILLING_NAME,
        },
        name: 'Demo',
      },
      subscription: {
        subscriptionId: 'sub_00000000000000',
        customerId: 'cus_00000000000000',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
      },
    });

    subscriptionId = newSubscriptionId;
    authToken = newAuthToken;
    workspaceId = newWorkspaceId;
  }

  try {
    await invitationService.addPendingInvite(workspaceId, 'developers@pedaki.fr', 'Developers');
  } catch (error) {
    logger.error('Error while adding pending invite', error);
  }

  await resourceService.upsertStack(stackParameters(workspaceId, subscriptionId, authToken));

  profiler.done({ message: "Finished cron 'cron-demo-community'" });
};
void main()
  .catch(logger.error)
  .finally(() => void prisma.$disconnect())
  .then(() => {
    logger.info("Exiting cron 'cron-demo-community'");
  });
