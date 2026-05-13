FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY admin/package*.json ./admin/
RUN npm install --workspace admin --include-workspace-root --legacy-peer-deps

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.base.json ./
COPY admin ./admin
RUN npm --workspace admin run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY --from=builder /app/admin/.next/standalone ./
COPY --from=builder /app/admin/.next/static ./admin/.next/static
COPY --from=builder /app/admin/public ./admin/public
EXPOSE 3001
CMD ["node", "admin/server.js"]
