import { generateKey } from "@47ng/cloak";
import * as pulumi from "@pulumi/pulumi";

export class EncryptionKey extends pulumi.ComponentResource {
	public readonly key: string;

	constructor(
		name: string,
		args?: Record<string, unknown>,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super("custom:resource:aes-gcm", name, args, opts);

		this.key = generateKey();

		this.registerOutputs({});
	}
}
