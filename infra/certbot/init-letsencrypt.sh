#!/usr/bin/env sh
set -eu

if [ ! -f ".env.production" ]; then
  echo ".env.production not found"
  exit 1
fi

set -a
. ./.env.production
set +a

if [ -z "${APP_DOMAIN:-}" ] || [ -z "${API_DOMAIN:-}" ]; then
  echo "APP_DOMAIN and API_DOMAIN are required"
  exit 1
fi

mkdir -p "infra/certbot/conf/live/${APP_DOMAIN}" "infra/certbot/conf/live/${API_DOMAIN}"

create_dummy_cert() {
  domain="$1"
  if [ -f "infra/certbot/conf/live/${domain}/fullchain.pem" ]; then
    return
  fi

  echo "Creating temporary self-signed certificate for ${domain}"
  docker run --rm \
    -v "$(pwd)/infra/certbot/conf:/etc/letsencrypt" \
    alpine/openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "/etc/letsencrypt/live/${domain}/privkey.pem" \
    -out "/etc/letsencrypt/live/${domain}/fullchain.pem" \
    -subj "/CN=${domain}"
}

create_dummy_cert "$APP_DOMAIN"
create_dummy_cert "$API_DOMAIN"

docker compose -f docker-compose.prod.yml --env-file .env.production up -d nginx

docker compose -f docker-compose.prod.yml --env-file .env.production run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$APP_DOMAIN" \
  --email "${LETSENCRYPT_EMAIL:-ops@${APP_DOMAIN}}" \
  --agree-tos \
  --no-eff-email \
  --force-renewal

docker compose -f docker-compose.prod.yml --env-file .env.production run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$API_DOMAIN" \
  --email "${LETSENCRYPT_EMAIL:-ops@${APP_DOMAIN}}" \
  --agree-tos \
  --no-eff-email \
  --force-renewal

docker compose -f docker-compose.prod.yml --env-file .env.production restart nginx
