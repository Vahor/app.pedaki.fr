import { DOCKER_IMAGE } from '@pedaki/pulumi/utils/docker.js';
import { resourceService } from '@pedaki/services/resource/resource.service.js';
import { workspaceService } from '@pedaki/services/workspace/workspace.service.js';

const WORKSPACE_IDENTIFIER = 'demo';

const stackParameters = (subscriptionId: number) => {
  return {
    identifier: WORKSPACE_IDENTIFIER,
    vpc: {
      provider: 'aws',
      region: 'eu-west-3',
    },
    server: {
      size: 'small',
      environment_variables: {
        IS_DEMO: 'true',
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
      subscriptionId,
    },
  } as const;
};

const main = async () => {
  console.log("Starting cron 'cron-demo-community'");
  console.log(`This will use the ${DOCKER_IMAGE} docker image`);
  await workspaceService.deleteWorkspaceByIdentifier(WORKSPACE_IDENTIFIER);
  const previousSubscriptionId =
    await workspaceService.getLatestSubscriptionId(WORKSPACE_IDENTIFIER);
  console.log({ previousSubscriptionId });
  // await resourceService.deleteStack(stackParameters(previousSubscriptionId));

  const { subscriptionId } = await workspaceService.createWorkspace({
    workspace: {
      identifier: 'demo',
      email: 'developers@pedaki.fr',
      name: 'Demo',
    },
    subscription: {
      subscriptionId: 'sub_00000000000000',
      customerId: 'cus_00000000000000',
    },
  });

  await resourceService.upsertStack(stackParameters(subscriptionId));

  console.log("Finished cron 'cron-demo-community'");
};
main().catch(console.error);
