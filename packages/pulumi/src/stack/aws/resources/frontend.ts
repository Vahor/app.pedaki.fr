import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { env } from '~/env.ts';
import type { StackParameters } from '~/type.ts';
import { CADDY_DOCKER_IMAGE, CLI_DOCKER_IMAGE, DOCKER_IMAGE, VERSION } from '~/utils/docker.ts';

export interface WebServiceArgs {
  dbHost: pulumi.Output<string>;
  dbName: pulumi.Output<string>;
  dbUser: pulumi.Output<string>;
  dbPassword: pulumi.Output<string | undefined>;
  dbPort: pulumi.Output<number>;
  dbEncryptionKey: string;
  passwordSalt: string;
  authSecret: string;
  vpcId: pulumi.Output<string>;
  subnetIds: pulumi.Output<string>[];
  securityGroupIds: pulumi.Output<string>[];
  tags: Record<string, string>;
  stackParameters: StackParameters<'aws'>;
}

export class WebService extends pulumi.ComponentResource {
  public readonly publicIp: pulumi.Output<string>;
  public readonly arn: pulumi.Output<string>;

  constructor(name: string, args: WebServiceArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:resource:WebService', name, args, opts);

    // Get the ID for the latest Amazon Linux AMI
    const amiId = aws.ec2
      .getAmi({
        owners: ['amazon'],
        mostRecent: true,
        filters: [
          { name: 'state', values: ['available'] },
          { name: 'name', values: ['al2023-ami-minimal*-x86_64'] },
          { name: 'owner-id', values: ['137112412989'] },
        ],
      })
      .then(ami => ami.id);

    const ec2Name = `${name}-ec2`;
    const ec2 = new aws.ec2.Instance(
      ec2Name,
      {
        instanceType: this.instanceType(args.stackParameters.server.size),
        vpcSecurityGroupIds: args.securityGroupIds,
        subnetId: args.subnetIds[0],
        ami: amiId,
        userData: this.startScript(args),
        userDataReplaceOnChange: true, // Force to recreate the ec2 instance when the script changes
        ipv6AddressCount: 0, // Disable ipv6
        rootBlockDevice: {
          volumeSize: 16,
          volumeType: 'gp3',
          deleteOnTermination: true,
        },
        metadataOptions: {
          httpTokens: 'required',
        },
        tags: {
          ...args.tags,
          Name: ec2Name,
        },
      },
      { parent: this },
    );

    this.publicIp = ec2.publicIp;
    this.arn = ec2.arn;

    this.registerOutputs({});
  }

  private startScript = (args: WebServiceArgs) => {
    let rawEnvFileContent = '';
    for (const [key, value] of Object.entries(args.stackParameters.server.environment_variables)) {
      rawEnvFileContent += `${key}='${value}'\n`;
    }

    const envFileContent = pulumi.interpolate`
${rawEnvFileContent}

NODE_ENV=production

PEDAKI_DOMAIN='${args.stackParameters.workspace.subdomain}.pedaki.fr'
PEDAKI_TAG='${VERSION}'

DATABASE_URL='mysql://${args.dbUser}:${args.dbPassword}@${args.dbHost}:${args.dbPort}/${args.dbName}?sslcacert=/app/certificates/rds-combined-ca-bundle.pem'
PRISMA_ENCRYPTION_KEY='${args.dbEncryptionKey}'

PASSWORD_SALT='${args.passwordSalt}'
NEXTAUTH_SECRET='${args.authSecret}'

RESEND_API_KEY='${env.RESEND_API_KEY}'
RESEND_EMAIL_DOMAIN='pedaki.fr'

PEDAKI_AUTH_TOKEN='${args.stackParameters.server.environment_variables.PEDAKI_AUTH_TOKEN}'
PEDAKI_WORKSPACE_SUBDOMAIN='${args.stackParameters.workspace.subdomain}'
PEDAKI_WORKSPACE_ID='${args.stackParameters.workspace.id}'
`;

    const dockerComposeContent = pulumi.interpolate`
version: '3.8'
name: pedaki
services:
    web:
        image: '${DOCKER_IMAGE}'
        env_file:
            - web-variables.env
        restart: unless-stopped  
        volumes:
            - /app/certificates:/app/certificates
        
    cli:
        image: '${CLI_DOCKER_IMAGE}'
        env_file:
            - web-variables.env
        volumes:
            - /app/certificates:/app/certificates

    caddy:
        image: '${CADDY_DOCKER_IMAGE}'
        restart: unless-stopped
        ports:
            - 80:80
            - 443:443
        volumes:
            - ./Caddyfile:/etc/caddy/Caddyfile
        depends_on:
            - web
`;

    const domain = args.stackParameters.workspace.subdomain + '.pedaki.fr';

    const caddyFileContent = pulumi.interpolate`
{
    email developers@pedaki.fr
    acme_dns cloudflare ${env.CLOUDFLARE_API_TOKEN}
}
https://${domain}, :80, :443 {
    reverse_proxy http://web:8000
    encode zstd gzip
    
    # HSTS (63072000 seconds)
    header / Strict-Transport-Security "max-age=63072000"
    
    # hidden server name
    header -Server
    
    tls {
        dns cloudflare ${env.CLOUDFLARE_API_TOKEN}
        resolvers 1.1.1.1
    }
}
`;

    return pulumi.interpolate`#!/bin/bash
set -e -x
export DEBIAN_FRONTEND=noninteractive

sudo yum update -y
sudo yum install docker wget -y

sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

sudo service docker start

sudo docker login -u ${env.APP_DOCKER_USERNAME} -p ${env.APP_DOCKER_PASSWORD} ${env.APP_DOCKER_HOST}

sudo mkdir /app
sudo chown ec2-user:ec2-user /app
cd /app

echo "${caddyFileContent}" > Caddyfile
echo "${dockerComposeContent}" > docker-compose.yml
echo "${envFileContent}" > web-variables.env

# Increase the maximum number of file descriptors
# https://github.com/quic-go/quic-go/wiki/UDP-Buffer-Sizes
sudo sysctl -w net.core.rmem_max=2500000

# Download aws RDS CA certificate
mkdir -p /app/certificates
sudo wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem -O /app/certificates/rds-combined-ca-bundle.pem

sudo /usr/local/bin/docker-compose pull
sudo /usr/local/bin/docker-compose run --rm cli

# Exit if the cli container failed
if [ $? -ne 0 ]
then
    # TODO: catch error
    echo "Failed to run cli container"
fi

sudo /usr/local/bin/docker-compose up -d caddy web
`;
  };

  private instanceType = (size: StackParameters<'aws'>['server']['size']) => {
    switch (size) {
      case 'small':
        return 't2.micro'; // free tier
    }
  };
}
