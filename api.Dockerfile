FROM node:18-slim AS base

RUN apt-get update -y && apt-get install -y openssl curl ca-certificates


FROM base  AS builder
WORKDIR /app

# Install corepack pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

COPY turbo.json ./
COPY .npmrc ./
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/auth/package.json ./packages/auth/
COPY packages/settings/package.json ./packages/settings/

RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages ./packages

ENV NODE_ENV=production
RUN pnpm build --filter api

FROM base  AS runner
WORKDIR /app

RUN curl -fsSL https://get.pulumi.com | sh
ENV PATH="/root/.pulumi/bin:$PATH"

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/auth/dist ./node_modules/@pedaki/auth
COPY --from=builder /app/packages/settings/dist ./node_modules/@pedaki/settings

## Load public env vars
ARG PULUMI_ACCESS_TOKEN
ARG PORT=8080

ENV PORT=$PORT
ENV PULUMI_ACCESS_TOKEN=$PULUMI_ACCESS_TOKEN

ENV NODE_ENV=production
ENV SKIP_SERVER_ENV_CHECK=true

EXPOSE $PORT

CMD ["node", "dist/index.js"]