import { env } from '~/env.ts';

export const DOCKER_IMAGE = `${env.APP_DOCKER_HOST}/${env.APP_DOCKER_ORGANISATION}/${env.APP_DOCKER_PACKAGE_NAME}:${env.APP_DOCKER_IMAGE_VERSION}`;
