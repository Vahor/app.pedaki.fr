FROM node:18-slim AS base

RUN apt-get update -y && apt-get install -y openssl

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY . .
RUN pnpm install

RUN pnpm build --filter db
##RUN pnpm build --filter api

#FROM base  AS downloader
#WORKDIR /app
#
## Install python as node-gyp requires it
#RUN apt-get update || : && apt-get install -y python3 build-essential
#
#COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#COPY apps/api/package.json ./apps/api/
#COPY turbo.json ./
#COPY .npmrc ./
#
#COPY packages/db/package.json ./packages/db/
#COPY packages/auth/package.json ./packages/auth/
#
#RUN pnpm install --child-concurrency 3 --frozen-lockfile --prefer-offline
#
#FROM base  AS builder
#WORKDIR /app
#
#ARG APP
#
#COPY --from=downloader /app/node_modules ./node_modules
#
#COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
#COPY turbo.json ./
#COPY .npmrc ./
#
## Load public env vars
#ARG PULUMI_ACCESS_TOKEN
#
## Generate prisma client
#COPY packages/db ./packages/db
#RUN pnpm build --filter db
#
#COPY apps/api ./apps/api
#COPY packages ./packages
#
#ARG PORT=8000
#
#ENV PORT=$PORT
#ENV NODE_ENV=production
#ENV SKIP_SERVER_ENV_CHECK=true
#
#RUN pnpm build --filter api

CMD ["sleep", "infinity"]


#FROM base  AS runner
#WORKDIR /app
#
#
#COPY --from=builder /app/node_modules ./node_modules
#COPY --from=builder /app/apps/api/dist ./
#
## Run server.js
#CMD ["node", "./src/index.js"]