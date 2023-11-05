import * as cloudflare from "@pulumi/cloudflare";
import * as pulumi from '@pulumi/pulumi';
import type {StackParameters} from "~/type.ts";
import {env} from "~/env.ts";

export interface DnsArgs {
    publicIp: pulumi.Output<string>;
    tags: Record<string, string>;
    stackParameters: StackParameters<'aws'>;
}

export class Dns extends pulumi.ComponentResource {

    constructor(name: string, args: DnsArgs, opts?: pulumi.ComponentResourceOptions) {
        super('custom:resource:Dns', name, args, opts);

        const recordName = `${name}-record`;

        const _  = new cloudflare.Record(recordName, {
            name: args.stackParameters.identifier,
            type: 'A',
            value: args.publicIp,
            zoneId: env.CLOUDFLARE_ZONE_ID,
            proxied: true,
            ttl: 3600
        });
    }

}