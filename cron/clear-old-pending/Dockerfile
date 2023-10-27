FROM node:18-slim AS base

RUN apt-get update -y && apt-get install -y openssl curl ca-certificates && apt-get clean

FROM base AS builder
WORKDIR /app

# Install corepack pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

COPY turbo.json ./
COPY .npmrc ./
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY packages/db/package.json ./packages/db/
COPY cron/clear-old-pending/package.json ./cron/clear-old-pending/

RUN --mount=type=cache,id=s/0eb7c8d5-3796-4b22-b0dc-988ca0084b57-/pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY cron/clear-old-pending ./cron/clear-old-pending
COPY packages ./packages
COPY scripts ./scripts

ENV NODE_ENV=production
RUN pnpm build --filter cron-clear-old-pending

# Copy node_modules/.prisma to a tmp folder
RUN mkdir -p tmp
RUN cp -r node_modules/.prisma tmp/.prisma

# Delete node_modules and reinstall only production dependencies
RUN npx rimraf --glob ./**/node_modules
RUN --mount=type=cache,id=s/0eb7c8d5-3796-4b22-b0dc-988ca0084b57-/pnpm,target=/pnpm/store pnpm install --frozen-lockfile --production --filter cron-clear-old-pending

# Copy back node_modules/.prisma
RUN cp -r tmp/.prisma node_modules

FROM base AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/dist ./node_modules/@pedaki/db
COPY --from=builder /app/cron/clear-old-pending/dist ./dist

## Load public env vars
ARG PORT=8000
ARG DATABASE_URL
ARG PRISMA_ENCRYPTION_KEY
ARG PENDING_MAX_AGE

ENV PORT=$PORT
ENV NODE_ENV=production
ENV DATABASE_URL=$DATABASE_URL
ENV PRISMA_ENCRYPTION_KEY=$PRISMA_ENCRYPTION_KEY
ENV PENDING_MAX_AGE=$PENDING_MAX_AGE

EXPOSE $PORT

CMD ["node", "dist/index.js"]