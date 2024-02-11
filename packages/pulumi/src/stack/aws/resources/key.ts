import { generateKey } from '@47ng/cloak';
import * as pulumi from '@pulumi/pulumi';

export class EncryptionKey extends pulumi.ComponentResource {
  public readonly key: string;

  constructor(name: string, args?: {}, opts?: pulumi.ComponentResourceOptions) {
    super('custom:resource:aes-gcm', name, args, opts);

    do {
      this.key = generateKey();
    } while (this.key.length !== 32);

    this.registerOutputs({});
  }
}
