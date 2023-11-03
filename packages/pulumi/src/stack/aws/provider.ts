import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';
import type { ServerProvider, StackOutputs, StackParameters } from '~/type.ts';
import { PulumiUtils } from '../shared.ts';
import * as backend from './resources/backend.ts';
import * as frontend from './resources/frontend.ts';
import * as network from './resources/network.ts';

export class AwsServerProvider implements ServerProvider<'AWS'> {
  public async create(params: StackParameters): Promise<StackOutputs> {
    const stack = await PulumiUtils.createOrSelectStack(params.workspaceId, this.program(params));
    const upRes = await stack.up({ onOutput: console.info });

    // TODO: throw error if the output are not valid (use zod ?)
    return {
      machinePublicIp: upRes.outputs.machinePublicIp!.value as string,
      publicHostName: upRes.outputs.publicHostName!.value as string,
    };
  }

  public async delete(params: StackParameters): Promise<void> {
    await PulumiUtils.deleteStack(params.workspaceId, this.program(params));
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private program = (params: StackParameters<'AWS'>) => async () => {
    const tags = this.tags(params);

    // Create vpc for the whole stack
    const vpc = new network.Vpc(`${params.workspaceId}-net`, {
      stackParameters: params,
      tags,
    });

    const dbPassword = new random.RandomPassword(`${params.workspaceId}-db-password`, {
      length: 32,
      special: true,
      overrideSpecial: '_%',
    }).result;

    const db = new backend.Db(`${params.workspaceId}-db`, {
      dbName: 'pedaki',
      dbUser: 'pedakiuser',
      dbPassword: dbPassword,
      subnetIds: vpc.subnetIds,
      securityGroupIds: vpc.rdsSecurityGroupIds,
      dbPort: vpc.ports.mysql,
      stackParameters: params,
      tags,
    });

    // Create an EC2 instance
    const server = new frontend.WebService(`${params.workspaceId}-frontend`, {
      dbHost: db.dbHost,
      dbPort: db.dbPort,
      dbName: db.dbName,
      dbUser: db.dbUser,
      dbPassword: db.dbPassword,
      vpcId: vpc.vpcId,
      subnetIds: vpc.subnetIds,
      securityGroupIds: vpc.feSecurityGroupIds,
      stackParameters: params,
      tags,
    });

    // TODO: change variable names
    return {
      machinePublicIp: server.publicIp,
      publicHostName: pulumi.interpolate`http://${server.dnsName}`,
      dbHost: db.dbHost,
      dbPort: db.dbPort,

      // Additional data used for listing stacks
      Provider: 'AWS',
      Region: params.region,
      Size: params.size,
      WorkspaceId: params.workspaceId,
    };
  };

  private tags = (params: StackParameters<'AWS'>) => ({
    WorkspaceId: params.workspaceId,
    Size: params.size,
    Region: params.region,
  });
}
