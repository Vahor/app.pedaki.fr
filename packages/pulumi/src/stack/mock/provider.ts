import type { StackOutputs, StackParameters, StackProvider, WorkspaceInstance } from '~/type.ts';

export class TestServerProvider implements StackProvider<'test'> {
  stacks: WorkspaceInstance[] = [];

  // eslint-disable-next-line @typescript-eslint/require-await
  public async create(params: StackParameters<'test'>): Promise<StackOutputs> {
    const newStack: WorkspaceInstance = {
      workspaceId: params.workspaceId,
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

    return {
      machinePublicIp: newStack.server.machinePublicIp,
      publicHostName: 'test',
    };
  }

  public delete(params: StackParameters<'test'>): Promise<void> {
    this.stacks = this.stacks.filter(stack => stack.workspaceId !== params.workspaceId);
    return Promise.resolve(undefined);
  }
}
