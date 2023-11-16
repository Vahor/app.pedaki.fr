import { prisma } from '@pedaki/db';
import { DOCKER_IMAGE } from '@pedaki/pulumi/utils/docker.js';
import { resourceService } from '@pedaki/services/resource/resource.service.js';
import { workspaceService } from '@pedaki/services/workspace/workspace.service.js';
import { env } from '~/env.ts';

const WORKSPACE_IDENTIFIER = 'demo';
const PEDAKI_BILLING_EMAIL = 'developers@pedaki.fr';
const PEDAKI_BILLING_NAME = 'Pedaki';

const BASE_PARAMETERS = {
  identifier: WORKSPACE_IDENTIFIER,
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
    },
  },
  database: {
    size: 'small',
  },
  dns: {
    subdomain: 'demo',
  },
  workspace: {
    identifier: WORKSPACE_IDENTIFIER,
  },
} as const;

const stackParameters = (subscriptionId: number, authToken: string) =>
  ({
    ...BASE_PARAMETERS,
    workspace: {
      ...BASE_PARAMETERS.workspace,
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
  console.log("Starting cron 'cron-demo-community'");
  console.log(`This will use the ${DOCKER_IMAGE} docker image`);
  await prisma.$connect();

  const previousSubscriptionId =
    await workspaceService.getLatestSubscriptionId(WORKSPACE_IDENTIFIER);

  let subscriptionId: number;
  let authToken = '';

  if (previousSubscriptionId) {
    if (env.DELETE_OLD_STACK) {
      console.log(`Deleting previous stack for subscription ${previousSubscriptionId}`);
      await resourceService.deleteStack(stackParameters(previousSubscriptionId, authToken));
    } else {
      console.log(
        `DELETE_OLD_STACK is false, keeping previous stack for subscription ${previousSubscriptionId}`,
      );
    }

    subscriptionId = previousSubscriptionId;

    // Update token
    const { id } = await prisma.workspace.findUniqueOrThrow({
      where: {
        identifier: WORKSPACE_IDENTIFIER,
      },
      select: {
        id: true,
      },
    });
    authToken = await workspaceService.registerNewWorkspaceToken({ workspaceId: id });

    // Update subscription
    await workspaceService.updateWorkspaceSubscriptionStripeData({
      subscriptionId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
    });
  } else {
    console.log('No previous subscription found, creating a new one');
    const { subscriptionId: newSubscriptionId, authToken: newAuthToken } =
      await workspaceService.createWorkspace({
        workspace: {
          creationData: BASE_PARAMETERS,
          identifier: WORKSPACE_IDENTIFIER,
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
  }

  await resourceService.upsertStack(stackParameters(subscriptionId, authToken));

  console.log("Finished cron 'cron-demo-community'");
};
void main()
  .catch(console.error)
  .finally(() => void prisma.$disconnect())
  .then(() => {
    console.log("Exiting cron 'cron-demo-community'");
  });
