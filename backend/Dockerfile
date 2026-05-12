FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install --workspace backend --include-workspace-root

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY package*.json ./
COPY tsconfig.base.json ./
COPY backend ./backend
RUN npm --workspace backend run prisma:generate
RUN npm --workspace backend run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/ecosystem.config.cjs ./backend/ecosystem.config.cjs
WORKDIR /app/backend
EXPOSE 3000
CMD ["npx", "pm2-runtime", "ecosystem.config.cjs"]
