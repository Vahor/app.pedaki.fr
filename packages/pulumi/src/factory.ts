import type { Provider } from '@pedaki/schema/region.model.ts';
import { PulumiApi } from '~/utils/pulumi-api.ts';
import { AwsServerProvider } from './stack/aws/provider.ts';
import { TestServerProvider } from './stack/mock/provider.ts';
import type { ServerProvider, WorkspaceInstance } from './type.ts';

const providers = {
  AWS: new AwsServerProvider(),
  test: new TestServerProvider(),
} as const;

class ServerProviderFactory {
  public getProvider<P extends Provider>(provider: P): ServerProvider<P> {
    return providers[provider] as ServerProvider<P>;
  }

  public async listStacks(): Promise<WorkspaceInstance[]> {
    return await PulumiApi.listStacksWithProperties().then(stacks =>
      stacks.map(stack => {
        return {
          workspaceId: stack.outputs.WorkspaceId ?? '',
          provider: (stack.outputs.Provider as WorkspaceInstance['provider']) ?? '',
          machinePublicIp: stack.outputs.machinePublicIp ?? '',
          publicHostName: stack.outputs.publicHostName ?? '',
          region: (stack.outputs.Region as WorkspaceInstance['region']) ?? '',
        };
      }),
    );
  }
}

const serverFactory = new ServerProviderFactory();
export { serverFactory };
