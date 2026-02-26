#!/usr/bin/env bash
set -euo pipefail
cd /opt/graph
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm --entrypoint "certbot" certbot certonly --manual --preferred-challenges dns -d graph-ranepa.ru --email admin@graph-ranepa.ru --agree-tos --no-eff-email
