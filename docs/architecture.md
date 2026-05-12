# Architecture

The repository is split by deployable application:

- `backend`: NestJS API and Socket.IO gateway.
- `admin`: Next.js operations panel.
- `customer`: Expo passenger app.
- `driver`: Expo driver app.

Backend code follows clean architecture boundaries:

- `domain`: entities, value objects, enums, and domain rules.
- `application`: use cases and application services.
- `infrastructure`: framework, database, Redis, logging, and external services.
- `interfaces`: HTTP controllers, filters, middleware, and realtime gateways.

Infrastructure is defined in `docker-compose.yml` with PostgreSQL and Redis health checks. Prisma owns schema evolution through checked-in migrations.
