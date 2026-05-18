FROM node:22-bookworm-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY admin/package.json ./admin/

RUN rm -f package-lock.json && npm install --workspace admin --include-workspace-root --legacy-peer-deps --no-audit --no-fund

FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY tsconfig.base.json ./
COPY admin ./admin

RUN npm --workspace admin run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/admin/.next/standalone ./
COPY --from=builder /app/admin/.next/static ./.next/static
COPY --from=builder /app/admin/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "server.js"]
