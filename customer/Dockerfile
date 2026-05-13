FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY customer/package*.json ./customer/
RUN npm install --workspace customer --include-workspace-root --legacy-peer-deps

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=development
ENV EXPO_NO_TELEMETRY=1
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.base.json ./
COPY customer ./customer
WORKDIR /app/customer
EXPOSE 8081
CMD ["npx", "expo", "start", "--host", "0.0.0.0", "--port", "8081", "--non-interactive"]
