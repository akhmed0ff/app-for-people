FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY driver/package*.json ./driver/
RUN npm install --workspace driver --include-workspace-root

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=development
ENV EXPO_NO_TELEMETRY=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/driver/node_modules ./driver/node_modules
COPY package*.json ./
COPY tsconfig.base.json ./
COPY driver ./driver
WORKDIR /app/driver
EXPOSE 8082
CMD ["npx", "expo", "start", "--host", "0.0.0.0", "--port", "8082", "--non-interactive"]
