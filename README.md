# Taxi Platform

Production-oriented fullstack taxi application scaffold.

## Apps

- `backend`: NestJS, Prisma, PostgreSQL, Redis, Socket.IO
- `admin`: Next.js admin panel
- `customer`: React Native Expo passenger app
- `driver`: React Native Expo driver app

## Quick Start

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp admin/.env.example admin/.env.local
cp customer/.env.example customer/.env
cp driver/.env.example driver/.env
npm install
npm run dev
```

Run migrations and seed data:

```bash
npm run db:migrate
npm run db:seed
```

## Docker

Build all service images:

```bash
docker compose build
```

Before running production containers, replace `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
database credentials, and Mapbox tokens in `.env`. The backend refuses to start in
`NODE_ENV=production` with placeholder JWT secrets.

Run PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

Apply migrations and seed data:

```bash
docker compose --profile tools run --rm backend-migrate
docker compose --profile tools run --rm backend-seed
```

Run the full stack:

```bash
docker compose up -d
```

Services:

- Backend: http://localhost:3000/api/v1/health
- Admin: http://localhost:3001
- Customer Expo: http://localhost:8081
- Driver Expo: http://localhost:8082

## Production Deployment

See [docs/deployment/production.md](docs/deployment/production.md) for the production Docker,
Nginx, SSL, CI/CD, backup, monitoring, logging, and rollback guide.
