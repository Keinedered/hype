# Nextcloud "Untrusted Domain" Fix — Runbook

## Problem

Nextcloud shows **"Access through untrusted domain"** when opening `https://graph-ranepa.ru`.

## Prerequisites

- SSH access to the production server
- `sudo` privileges
- The repo pulled to the server

---

## Steps

### 1. Pull latest changes

```bash
cd /opt/graph
git pull
```

### 2. Run diagnostics (read-only)

```bash
sudo bash ops/nextcloud_diag.sh
```

Review the output. Note:
- Installation type (docker / bare metal / snap)
- Current `trusted_domains` values
- Whether `graph-ranepa.ru` is missing from the list
- Proxy header forwarding status

### 3. Apply the fix

**Basic (no reverse proxy):**

```bash
sudo bash ops/nextcloud_fix_untrusted_domain.sh
```

**With reverse proxy (Docker network):**

```bash
sudo bash ops/nextcloud_fix_untrusted_domain.sh --proxy 172.17.0.0/16
```

**Custom domain:**

```bash
sudo bash ops/nextcloud_fix_untrusted_domain.sh --domain graph-ranepa.ru --proxy 172.17.0.0/16
```

**Dry run (preview without changes):**

```bash
sudo bash ops/nextcloud_fix_untrusted_domain.sh --dry-run
```

### 4. Restart services

The fix script prints the exact restart commands. Common variants:

**Docker Compose:**

```bash
docker compose restart
# If host nginx is the reverse proxy:
sudo systemctl reload nginx
```

**Bare metal:**

```bash
sudo systemctl restart php8.2-fpm
sudo systemctl reload nginx
```

**Snap:**

```bash
sudo snap restart nextcloud
```

### 5. Verify

```bash
curl -I https://graph-ranepa.ru
```

Expected: `HTTP/2 200` or `HTTP/2 302` (redirect to login).

Open `https://graph-ranepa.ru` in browser — should show the Nextcloud login page.

---

## What the fix script does

1. Detects installation type (Docker / bare metal / snap)
2. Backs up `config.php` with a timestamp
3. Adds `graph-ranepa.ru` to `trusted_domains` via `occ` (idempotent)
4. Sets `overwrite.cli.url`, `overwriteprotocol`, `overwritehost`
5. Optionally adds `trusted_proxies` for reverse proxy setups
6. Prints restart commands and verification steps

## Rollback

If something goes wrong, restore the backup:

**Docker:**

```bash
# Find the backup
docker exec CONTAINER_NAME ls /var/www/html/config/config.php.bak.*

# Restore
docker exec CONTAINER_NAME cp /var/www/html/config/config.php.bak.TIMESTAMP /var/www/html/config/config.php
docker compose restart
```

**Bare metal:**

```bash
sudo cp /var/www/nextcloud/config/config.php.bak.TIMESTAMP /var/www/nextcloud/config/config.php
sudo systemctl restart php8.2-fpm
```
