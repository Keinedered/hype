# GRAPH Educational Platform — Production Deployment Guide

> Deploy to **graph-ranepe.ru** on a clean Ubuntu server with Docker.

---

## Prerequisites

| Tool | Minimum version |
|------|-----------------|
| Docker | 24+ |
| Docker Compose (plugin) | v2.20+ |
| Git | 2.x |

Verify on the server:

```bash
docker --version
docker compose version
```

---

## 1. Clone the repository

```bash
cd /opt
git clone https://github.com/Keinedered/hype.git graph
cd graph
```

---

## 2. Create the production environment file

```bash
cp .env.prod.example .env.prod
```

Edit `.env.prod` and **replace every `CHANGE_ME` placeholder**:

```bash
nano .env.prod
```

At minimum, change:

| Variable | How to generate |
|----------|-----------------|
| `POSTGRES_PASSWORD` | `openssl rand -base64 24` |
| `DATABASE_URL` | Must contain the same password as above |
| `SECRET_KEY` | `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `CERTBOT_EMAIL` | Your real email for Let's Encrypt notifications |

> **Important:** `DATABASE_URL` must match `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`.

---

## 3. Build and start the stack

```bash
# Build all images (frontend is built inside the nginx image)
docker compose -f docker-compose.prod.yml --env-file .env.prod build

# Start everything (detached)
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

Check that all containers are running:

```bash
docker compose -f docker-compose.prod.yml ps
```

You should see: `graph_db_prod`, `graph_backend_prod`, `graph_nginx_prod`, `graph_certbot` (certbot may exit/restart — that's normal until certs exist).

---

## 4. Initialize the database

Run once after the first deployment:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  exec backend python init_db.py
```

This creates sample tracks, courses, graph nodes, and a demo user (`demo` / `demo123`).
It is **safe to re-run** — it skips initialization if data already exists.

---

## 5. Obtain TLS certificates (Let's Encrypt)

### 5a. Get the initial certificate

Make sure DNS for `graph-ranepe.ru` points to this server's IP, then:

```bash
# Request certificate (HTTP-01 challenge via the running nginx)
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm certbot \
  certonly --webroot -w /var/www/certbot \
  -d graph-ranepe.ru \
  --email reply@graph-ranepa.ru \
  --agree-tos --no-eff-email
```

Replace with your actual email if different from `.env.prod` (`CERTBOT_EMAIL`).

### 5b. Switch to the SSL nginx config

```bash
# Copy the SSL config into the running container
docker cp deploy/nginx/graph-ranepe.ru.ssl.conf \
  graph_nginx_prod:/etc/nginx/conf.d/default.conf

# Reload nginx
docker exec graph_nginx_prod nginx -s reload
```

### 5c. Automatic renewal

The `certbot` container already runs a renewal loop every 12 hours. After renewal, reload nginx:

```bash
# Add to crontab (run as root):
echo "0 5 * * * docker exec graph_nginx_prod nginx -s reload" | crontab -
```

---

## 6. Verify the deployment

```bash
# Backend health
curl -s http://graph-ranepe.ru/health
# Expected: {"status":"ok"}

# API root
curl -s http://graph-ranepe.ru/api/v1/tracks/
# Expected: JSON array of tracks

# Frontend
curl -s -o /dev/null -w "%{http_code}" http://graph-ranepe.ru/
# Expected: 200

# Swagger docs
curl -s -o /dev/null -w "%{http_code}" http://graph-ranepe.ru/docs
# Expected: 200
```

After TLS is active, use `https://` instead.

---

## 7. Common operations

### View logs

```bash
# All services
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f

# Single service
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f backend
```

### Restart a service

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod restart backend
```

### Update to latest code

```bash
cd /opt/graph
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml --env-file .env.prod build
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Stop everything

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down
```

### Stop and remove volumes (DESTROYS DATA)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down -v
```

---

## 8. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `502 Bad Gateway` | Backend not ready. Check: `docker logs graph_backend_prod` |
| `connection refused` on port 80 | Nginx not running. Check: `docker ps` and `docker logs graph_nginx_prod` |
| Database connection error | Verify `DATABASE_URL` in `.env.prod` matches postgres credentials |
| Certbot fails | Ensure DNS A record points to this server; port 80 must be reachable |
| Frontend shows blank page | Check browser console; likely `VITE_API_URL` mismatch — rebuild nginx image |
| `FATAL: DATABASE_URL contains placeholder` | You forgot to update `.env.prod` — edit the passwords |

### Useful debug commands

```bash
# Exec into backend container
docker exec -it graph_backend_prod bash

# Exec into postgres
docker exec -it graph_db_prod psql -U graph_user -d graph_db

# Check nginx config syntax
docker exec graph_nginx_prod nginx -t
```

---

## Architecture overview

```
Internet
   │
   ▼
┌──────────────────────┐
│  Nginx (port 80/443) │  ← serves static frontend + proxies API
│  graph_nginx_prod    │
└──────┬───────────────┘
       │  internal network
       ├─────────────────────────┐
       ▼                         ▼
┌──────────────────┐   ┌────────────────────┐
│  Backend :8000   │   │  PostgreSQL :5432   │
│  graph_backend   │──▶│  graph_db_prod      │
│  (gunicorn)      │   │  (persistent vol)   │
└──────────────────┘   └────────────────────┘
```

Only Nginx is exposed to the internet. Backend and PostgreSQL communicate over the internal Docker network.
