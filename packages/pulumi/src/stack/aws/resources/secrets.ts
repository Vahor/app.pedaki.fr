import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { prefixWithSlash } from '~/stack/constants.ts';
import type { StackParameters } from '~/type.ts';

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
    passwordSalt: string;
    authSecret: string;
  };
  pedaki: {
    subdomain: string;
    workspaceId: string;
    authToken: string;
    host: string;
    version: string;
  };
  environment_variables: Record<string, string>;
  tags: Record<string, string>;
  stackParameters: StackParameters<'aws'>;
}

export class Secrets extends pulumi.ComponentResource {
  public readonly dbParameter: pulumi.Output<string>;
  public readonly authParameter: pulumi.Output<string>;
  public readonly pedakiParameter: pulumi.Output<string>;
  public readonly envParameter: pulumi.Output<string>;

  constructor(name: string, args: SecretsArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:resource:Secrets', name, args, opts);

    // create aws secrets for db, auth

    this.dbParameter = this.createSecret(
      `${args.stackParameters.workspace.id}-db`,
      'Database credentials',
      pulumi
        .all([
          args.db.host,
          args.db.name,
          args.db.user,
          args.db.password,
          args.db.port,
          args.db.encryptionKey,
        ])
        .apply(([host, name, user, password, port, encryptionKey]) => {
          return JSON.stringify({
            DATABASE_URL: `mysql://${user}:${password}@${host}:${port}/${name}?sslcert=/app/certs/rds-combined-ca-bundle.pem`,
            PRISMA_ENCRYPTION_KEY: encryptionKey,
          });
        }),
      args.tags,
    );

    this.authParameter = this.createSecret(
      `${args.stackParameters.workspace.id}-auth`,
      'Authentication credentials',
      pulumi
        .all([args.auth.passwordSalt, args.auth.authSecret])
        .apply(([passwordSalt, authSecret]) => {
          return JSON.stringify({
            PASSWORD_SALT: passwordSalt,
            AUTH_SECRET: authSecret,
          });
        }),
      args.tags,
    );

    this.pedakiParameter = this.createSecret(
      `${args.stackParameters.workspace.id}-pedaki`,
      'Pedaki credentials',
      pulumi
        .all([
          args.pedaki.subdomain,
          args.pedaki.workspaceId,
          args.pedaki.authToken,
          args.pedaki.host,
          args.pedaki.version,
        ])
        .apply(([subdomain, workspaceId, authToken, domain, version]) => {
          return JSON.stringify({
            PEDAKI_DOMAIN: domain,
            PEDAKI_VERSION: version,
            PEDAKI_AUTH_TOKEN: authToken,
            PEDAKI_WORKSPACE_ID: workspaceId,
            PEDAKI_WORKSPACE_SUBDOMAIN: subdomain,
          });
        }),
      args.tags,
    );

    this.envParameter = this.createSecret(
      `${args.stackParameters.workspace.id}-env`,
      'Environment credentials',
      pulumi.all([args.environment_variables]).apply(([environment_variables]) => {
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
        type: 'SecureString',
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
