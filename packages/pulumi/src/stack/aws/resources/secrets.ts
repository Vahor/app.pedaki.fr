import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { prefixWithSlash } from "~/stack/constants.ts";
import type { StackParameters } from "~/type.ts";
import { workspacePrefix } from "~/utils/aws.ts";

export interface SecretsArgs {
	db: {
		host: pulumi.Output<string>;
		name: pulumi.Output<string>;
		user: pulumi.Output<string>;
		password: pulumi.Output<string | undefined>;
		port: pulumi.Output<number>;
		encryptionKey: string;
	};
	auth: {
		passwordSalt: pulumi.Output<string>;
		authSecret: string;
	};
	pedaki: {
		name: string;
		subdomain: string;
		workspaceId: string;
		authToken: string;
		apiSecret: string;
		host: string;
		version: string;
	};
	environment_variables: Record<string, string>;
	tags: Record<string, string>;
	stackParameters: StackParameters<"aws">;
}

export class Secrets extends pulumi.ComponentResource {
	public readonly dbParameter: pulumi.Output<string>;
	public readonly dbKeyParameter: pulumi.Output<string>;
	public readonly authParameter: pulumi.Output<string>;
	public readonly pedakiParameter: pulumi.Output<string>;
	public readonly envParameter: pulumi.Output<string>;

	constructor(
		name: string,
		args: SecretsArgs,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super("custom:resource:Secrets", name, args, opts);

		this.dbParameter = this.createSecret(
			`${args.stackParameters.workspace.id}-db`,
			"Database credentials",
			pulumi
				.all([
					args.db.host,
					args.db.name,
					args.db.user,
					args.db.password,
					args.db.port,
				])
				.apply(([host, name, user, password, port]) => {
					return JSON.stringify({
						DATABASE_URL: `postgresql://${user}:${password}@${host}:${port}/${name}?sslcert\=/app/certs/rds-combined-ca-bundle.pem`,
					});
				}),
			args.tags,
		);

		this.dbKeyParameter = this.createSecret(
			`${args.stackParameters.workspace.id}-db-key`,
			"Database encryption key",
			pulumi.all([args.db.encryptionKey]).apply(([encryptionKey]) => {
				return JSON.stringify({
					PRISMA_ENCRYPTION_KEY: encryptionKey,
				});
			}),
			args.tags,
		);

		this.authParameter = this.createSecret(
			`${args.stackParameters.workspace.id}-auth`,
			"Authentication credentials",
			pulumi
				.all([
					args.auth.passwordSalt,
					args.auth.authSecret,
					args.pedaki.subdomain,
				])
				.apply(([passwordSalt, authSecret, subdomain]) => {
					return JSON.stringify({
						PASSWORD_SALT: passwordSalt,
						AUTH_SECRET: authSecret,
						AUTH_URL: `https://${subdomain}.pedaki.fr`,
					});
				}),
			args.tags,
		);

		this.pedakiParameter = this.createSecret(
			`${args.stackParameters.workspace.id}-pedaki`,
			"Pedaki credentials",
			pulumi
				.all([
					args.pedaki.name,
					args.pedaki.subdomain,
					args.pedaki.workspaceId,
					args.pedaki.authToken,
					args.pedaki.host,
					args.pedaki.version,
					args.pedaki.apiSecret,
				])
				.apply(
					([
						name,
						subdomain,
						workspaceId,
						authToken,
						hostname,
						version,
						secret,
					]) => {
						return JSON.stringify({
							NEXT_PUBLIC_PEDAKI_NAME: name,
							NEXT_PUBLIC_PEDAKI_HOSTNAME: hostname,
							NEXT_PUBLIC_PEDAKI_SUBDOMAIN: subdomain,
							NEXT_PUBLIC_PUBLIC_FILES_HOST: `https://files.pedaki.fr/${workspacePrefix(
								workspaceId,
							)}`,
							NEXT_PUBLIC_ENCRYPTED_FILES_HOST: `https://encrypted.pedaki.fr/${workspacePrefix(
								workspaceId,
							)}`,
							PEDAKI_TAG: version, // TODO: remove
							NEXT_PUBLIC_PEDAKI_VERSION: version,
							PEDAKI_AUTH_TOKEN: authToken,
							PEDAKI_WORKSPACE_ID: workspaceId,
							PEDAKI_WORKSPACE_SUBDOMAIN: subdomain, // TODO: remove

							API_INTERNAL_SECRET: secret,

							FILE_STORAGE: "s3",
							FILE_STORAGE_S3_REGION: args.stackParameters.region,
							FILE_STORAGE_S3_PUBLIC_BUCKET: "files.pedaki.fr",
							FILE_STORAGE_S3_PRIVATE_BUCKET: "encrypted.pedaki.fr",
							FILE_STORAGE_S3_PREFIX: workspacePrefix(workspaceId),
						});
					},
				),
			args.tags,
		);

		this.envParameter = this.createSecret(
			`${args.stackParameters.workspace.id}-env`,
			"Environment credentials",
			pulumi
				.all([args.environment_variables])
				.apply(([environment_variables]) => {
					return JSON.stringify(environment_variables);
				}),
			args.tags,
		);

		this.registerOutputs({});
	}

	createSecret(
		name: string,
		description: string,
		value: pulumi.Output<string>,
		tags: Record<string, string>,
	) {
		const secret = new aws.ssm.Parameter(
			name,
			{
				name: `/${prefixWithSlash}${name}`,
				description,
				type: "SecureString",
				value: value,
				tags: tags,
			},
			{
				parent: this,
			},
		);

		return secret.name;
	}
}
