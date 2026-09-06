# Cloud Run image for the voice relay. Built from the monorepo root so it can
# see the workspace-linked @pukaar/core package.
#   docker build -f apps/relay/Dockerfile -t pukaar-relay .
#
# Runs via tsx directly rather than a tsc-compiled dist/: this service is
# small enough that a separate compile step buys nothing, and it avoids the
# Node ESM strict-extension requirement that a raw `tsc` + `node dist/*.js`
# production run would otherwise impose on every relative import across both
# this app and packages/core.
FROM node:22-slim AS base
WORKDIR /repo
RUN corepack enable

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/core/package.json packages/core/package.json
COPY apps/relay/package.json apps/relay/package.json
RUN pnpm install --filter @pukaar/relay... --frozen-lockfile || pnpm install --filter @pukaar/relay...

FROM deps AS runner
WORKDIR /repo
ENV NODE_ENV=production
COPY packages/core packages/core
COPY apps/relay apps/relay
COPY tsconfig.base.json tsconfig.base.json
EXPOSE 8080
ENV RELAY_PORT=8080
CMD ["pnpm", "--filter", "@pukaar/relay", "start"]
