# Taxi App

Clean monorepo foundation for a taxi MVP.

## Workspaces

- `backend`: NestJS, Prisma, PostgreSQL, Redis, Socket.IO
- `admin`: Next.js, Tailwind, React Query, Axios
- `customer`: Expo React Native passenger app
- `driver`: Expo React Native driver app
- `packages/shared`: shared TypeScript enums, event names, and DTO-safe types

## Local Development

Install dependencies:

```bash
npm install
```

Start only infrastructure:

```bash
cp .env.example .env
npm run dev:db
```

Run each service separately:

```bash
npm run dev:backend
npm run dev:admin
npm run dev:customer
npm run dev:driver
```

Docker is optional for application services. The backend is designed to run directly on the host with Node.js and a local `.env`.

## Checks

```bash
npm run typecheck
npm run lint
docker compose config --quiet
```
