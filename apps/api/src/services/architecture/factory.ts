import { AwsServerProvider } from './stack/aws/stack.ts';
import { TestServerProvider } from './stack/mock/stack.ts';
import { PulumiUtils } from './stack/shared.ts';
import type { Provider, ServerProvider, WorkspaceInstance } from './stack/type.ts';

const providers = {
  AWS: new AwsServerProvider(),
  test: new TestServerProvider(),
} as const;

class ServerProviderFactory {
  public init(): Promise<Awaited<void>[]> {
    return Promise.all(Object.values(providers).map(provider => provider.init()));
  }

  public getProvider<P extends Provider>(provider: P): ServerProvider<P> {
    return providers[provider] as ServerProvider<P>;
  }

  public async listStacks(): Promise<WorkspaceInstance[]> {
    return await PulumiUtils.listStacksWithProperties().then(stacks =>
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
