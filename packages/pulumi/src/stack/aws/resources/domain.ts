import * as cloudflare from '@pulumi/cloudflare';
import * as pulumi from '@pulumi/pulumi';
import { env } from '~/env.ts';
import type { StackParameters } from '~/type.ts';

export interface DnsArgs {
  publicIp: pulumi.Output<string>;
  tags: Record<string, string>;
  stackParameters: StackParameters<'aws'>;
}

export class Domain extends pulumi.ComponentResource {
  public readonly id: pulumi.Output<string>;
  public readonly value: pulumi.Output<string>;

  constructor(name: string, args: DnsArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:resource:Dns', name, args, opts);

    const recordName = `${name}-record`;

    const record = new cloudflare.Record(recordName, {
      name: args.stackParameters.dns.subdomain,
      type: 'A',
      value: args.publicIp,
      zoneId: env.CLOUDFLARE_ZONE_ID,
      proxied: true,
      ttl: 1, // TTL must be set to 1 when proxied is true
      comment: `Automatically created by Pulumi for ${args.stackParameters.workspace.subdomain}`,
    });

    this.id = record.name;
    this.value = record.value;
  }
}
