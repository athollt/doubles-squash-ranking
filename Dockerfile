# syntax = docker/dockerfile:1

# Node version matches local dev (CHANGELOG step 01); openssl needed by Prisma.
ARG NODE_VERSION=22.16.0

# --- Base -------------------------------------------------------------------
FROM node:${NODE_VERSION}-slim AS base
LABEL fly_launch_runtime="Next.js/Prisma"
WORKDIR /app
ENV NODE_ENV="production"


# --- Build ------------------------------------------------------------------
# Builds the standalone server. Runs the project's real prod build
# (`next build --webpack`) so Serwist emits the PWA service worker
# (CHANGELOG step 13 — Turbopack/default builder skips the webpack plugin).
FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp openssl pkg-config python-is-python3

# Install all deps (incl. dev) for the build.
COPY package-lock.json package.json ./
RUN npm ci --include=dev

# Generate the Prisma client (into app/generated/prisma) before the build.
COPY prisma ./prisma
RUN npx prisma generate

# Build the standalone Next.js server (webpack → Serwist sw.js emitted).
COPY . .
RUN npm run build


# --- Runner -----------------------------------------------------------------
# Runtime: the standalone server + static/public assets, plus the full build
# node_modules and prisma/ so two things work without hand-picking transitive
# deps: (1) the running server's Prisma access (the pg driver adapter is
# constructed in bundled app code, so Next's standalone tracer misses it), and
# (2) the Fly release_command `npx prisma migrate deploy` (+ the documented
# `prisma db seed` first-admin step, which needs tsx/esbuild). Trading image
# size for robustness — see DECISIONS / step 14.4.
FROM base

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y openssl && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Next.js standalone output (server.js + traced node_modules) …
COPY --from=build /app/.next/standalone ./
# … overlaid with the full build node_modules (prisma CLI, adapter-pg, tsx,
# dotenv, esbuild — everything the release/seed and runtime DB access need).
COPY --from=build /app/node_modules ./node_modules
# Static assets and public dir are NOT traced into standalone — copy explicitly.
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# The generated Prisma client (output: ../app/generated/prisma), imported at
# runtime by lib/prisma.ts; lives under app/, not node_modules.
COPY --from=build /app/app/generated/prisma ./app/generated/prisma
# Schema + migrations + config for the release_command and the seed step.
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000
ENV PORT=3000
CMD [ "node", "server.js" ]
