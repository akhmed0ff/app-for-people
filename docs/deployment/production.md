# Production Deployment Guide

## Overview

Production uses:

- Docker Compose: `docker-compose.prod.yml`
- Nginx reverse proxy with TLS termination
- Certbot for SSL renewal
- PM2 runtime inside the backend container
- PostgreSQL persistent volume and scheduled backups
- Redis AOF persistence
- Prometheus, Grafana, cAdvisor, and node-exporter for monitoring
- JSON logs with Docker log rotation
- GitHub Actions CI/CD over SSH

Mobile apps should be built with EAS or native store pipelines. The production compose runs backend and admin; mobile apps consume `https://API_DOMAIN`.

## Server Requirements

- Ubuntu 22.04+ or similar Linux host
- Docker Engine and Docker Compose plugin
- Ports `80` and `443` open
- DNS:
  - `APP_DOMAIN` points to the server
  - `API_DOMAIN` points to the server

## Environment Setup

Create production env:

```bash
cp .env.production.example .env.production
```

Replace every secret and token. Required high-risk values:

- `POSTGRES_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `MAPBOX_ACCESS_TOKEN`
- `GRAFANA_ADMIN_PASSWORD`
- `CORS_ORIGINS`

Backend production validation refuses placeholder JWT secrets.

## Initial SSL Bootstrap

After DNS is live, run the bootstrap helper. It creates temporary self-signed certificates,
starts Nginx, requests real Let's Encrypt certificates, and reloads Nginx.

```bash
chmod +x infra/certbot/init-letsencrypt.sh
./infra/certbot/init-letsencrypt.sh
```

## Deploy

Build images:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production build
```

Run database and Redis:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d postgres redis
```

Apply migrations:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production --profile tools run --rm backend-migrate
```

Start application:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Check health:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
curl -f https://$API_DOMAIN/api/v1/health
curl -f https://$APP_DOMAIN/health
```

## Monitoring

Start monitoring profile:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production --profile monitoring up -d
```

Grafana is exposed on `GRAFANA_PORT` by default. Restrict this port at firewall level or tunnel over SSH.

## Backups

`postgres-backup` runs `pg_dump` periodically and stores compressed SQL dumps in the `postgres-backups` volume.

Manual backup:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec postgres-backup backup-postgres.sh
```

List backups:

```bash
docker run --rm -v taxi_platform_prod_postgres-backups:/backups alpine ls -lh /backups
```

Restore:

```bash
gzip -dc backup.sql.gz | docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

Test restore regularly on a staging database.

## Logging

- Backend uses Pino JSON logs.
- Nginx writes JSON access logs to `nginx-logs`.
- Docker logging uses `json-file` rotation for app services.

Useful commands:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f backend
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f nginx
```

## Security

Nginx enforces:

- HTTPS redirect
- HSTS
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- baseline CSP
- API rate limiting
- tighter auth rate limiting

Backend enforces:

- required production env vars
- placeholder JWT secret rejection
- Helmet
- CORS allowlist
- validation pipes

## CI/CD

GitHub Actions:

- `.github/workflows/ci.yml`: verify build/lint
- `.github/workflows/deploy.yml`: verify production compose, SSH deploy, build, migrate, restart

Required GitHub secrets:

- `PROD_SSH_HOST`
- `PROD_SSH_USER`
- `PROD_SSH_KEY`
- `PROD_SSH_PORT`
- `PROD_APP_DIR`

The server must already contain `.env.production`.

## Rollback

Rollback to a previous git commit:

```bash
git checkout <commit-sha>
docker compose -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --remove-orphans
```

Database rollbacks should be handled by forward migrations or a tested backup restore.

## Crash Recovery

- Containers use `restart: unless-stopped`.
- Backend runs under `pm2-runtime` cluster mode.
- Docker healthchecks restart unhealthy workflows when paired with external orchestrator/watchdog.
- PostgreSQL and Redis use persistent volumes.
- Redis uses AOF with `appendfsync everysec`.
