import type { StackOutputs } from '~/output.ts';
import type { StackParameters, StackProvider, WorkspaceInstance } from '~/type.ts';
import { redacted } from '~/utils/redacted.ts';

export class TestServerProvider implements StackProvider<'test'> {
  stacks: WorkspaceInstance[] = [];

  // eslint-disable-next-line @typescript-eslint/require-await
  public async create(params: StackParameters<'test'>): Promise<StackOutputs> {
    const newStack: WorkspaceInstance = {
      identifier: params.identifier,
      server: {
        provider: 'test',
        region: 'us-east-2',
        machinePublicIp:
          Math.floor(Math.random() * 255) +
          1 +
          '.' +
          Math.floor(Math.random() * 255) +
          '.' +
          Math.floor(Math.random() * 255) +
          '.' +
          Math.floor(Math.random() * 255) +
          1,
      },
    };

    this.stacks.push(newStack);

    return [
      {
        type: 'server',
        provider: 'test',
        region: newStack.server.region,
        id: newStack.identifier,
        size: params.server.size,
        environment_variables: redacted(params.server.environment_variables),
      },
    ];
  }

  public delete(params: StackParameters<'test'>): Promise<void> {
    this.stacks = this.stacks.filter(stack => stack.identifier !== params.identifier);
    return Promise.resolve(undefined);
  }
}
