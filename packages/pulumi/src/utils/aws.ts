import { S3Client } from '@aws-sdk/client-s3';
import { env } from '~/env.ts';

export const s3Client = new S3Client({
  region: 'eu-west-3',
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export const STATIC_BUCKET_NAME = 'static.pedaki.fr';
export const FILES_BUCKET_NAME = 'files.pedaki.fr';
export const workspacePrefix = (workspaceId: string) => `w/${workspaceId}`;
