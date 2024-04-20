import { VERSION } from "@pedaki/logger/version.js";
import { env } from "~/env.ts";

export const DOCKER_IMAGE = `${env.APP_DOCKER_HOST}/${env.APP_DOCKER_ORGANISATION}/${env.APP_DOCKER_PACKAGE_NAME}:${VERSION}`;
export const CLI_DOCKER_IMAGE = `${env.APP_DOCKER_HOST}/${env.APP_DOCKER_ORGANISATION}/${env.APP_DOCKER_PACKAGE_NAME}-cli:${VERSION}`;
export const CADDY_DOCKER_IMAGE = `${env.APP_DOCKER_HOST}/${env.APP_DOCKER_ORGANISATION}/caddy-cloudflare:latest`;
