# Build from the ember/ directory, not from server/ — the server compiles the
# shared rules engine alongside its own code:
#
#   docker build -f server/Dockerfile -t ember-server .
#
# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
WORKDIR /app
# better-sqlite3 falls back to compiling when there is no prebuilt binary.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci
COPY shared ./shared
COPY server ./server
RUN cd server && npx tsc && npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/server/node_modules ./server/node_modules
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/package.json ./server/package.json

ENV PORT=8787
ENV DATABASE_PATH=/data/ember.db
RUN mkdir -p /data
EXPOSE 8787

# One process, and the tables live in its memory — see the README before
# scaling this past a single machine.
CMD ["node", "server/dist/server/src/index.js"]
