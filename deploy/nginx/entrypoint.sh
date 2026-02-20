#!/bin/sh
# ============================================================
# Nginx entrypoint: use Let's Encrypt cert if available,
# otherwise fall back to self-signed placeholder.
# ============================================================
set -e

LE_CERT="/etc/letsencrypt/live/graph-ranepa.ru/fullchain.pem"
LE_KEY="/etc/letsencrypt/live/graph-ranepa.ru/privkey.pem"
SSL_DIR="/etc/nginx/ssl"

if [ -f "$LE_CERT" ] && [ -f "$LE_KEY" ]; then
    echo "[entrypoint] Using Let's Encrypt certificate"
    cp "$LE_CERT" "$SSL_DIR/fullchain.pem"
    cp "$LE_KEY"  "$SSL_DIR/privkey.pem"
else
    echo "[entrypoint] Let's Encrypt cert not found — using self-signed placeholder"
fi

exec nginx -g 'daemon off;'
