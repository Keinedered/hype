#!/usr/bin/env bash
# ============================================================
# Nextcloud — Fix "untrusted domain" (idempotent)
# Adds domain to trusted_domains, sets overwrite* params,
# optionally configures trusted_proxies.
#
# Usage:
#   sudo bash ops/nextcloud_fix_untrusted_domain.sh
#   sudo bash ops/nextcloud_fix_untrusted_domain.sh --domain graph-ranepa.ru
#   sudo bash ops/nextcloud_fix_untrusted_domain.sh --domain graph-ranepa.ru --proxy 172.17.0.0/16
# ============================================================
set -euo pipefail

# ---- Defaults & args --------------------------------------
DOMAIN="graph-ranepa.ru"
PROXY_CIDR=""
PROTOCOL="https"
DRY_RUN=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --domain)   DOMAIN="$2"; shift 2 ;;
        --proxy)    PROXY_CIDR="$2"; shift 2 ;;
        --protocol) PROTOCOL="$2"; shift 2 ;;
        --dry-run)  DRY_RUN=1; shift ;;
        -h|--help)
            echo "Usage: sudo bash $0 [--domain DOMAIN] [--proxy CIDR] [--protocol https] [--dry-run]"
            exit 0 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# ---- Helpers -----------------------------------------------
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

section()  { echo -e "\n${BOLD}=== $1 ===${NC}"; }
ok()       { echo -e "  ${GREEN}OK${NC}: $1"; }
warn()     { echo -e "  ${YELLOW}WARN${NC}: $1"; }
fail()     { echo -e "  ${RED}FAIL${NC}: $1"; }
info()     { echo -e "  $1"; }

run_occ() {
    if [[ "$DRY_RUN" -eq 1 ]]; then
        info "[DRY-RUN] $OCC_CMD $*"
        return 0
    fi
    $OCC_CMD "$@"
}

# ---- 1. Detect installation --------------------------------
section "1. Detecting Nextcloud"

INSTALL_TYPE="unknown"
NC_CONTAINER=""
OCC_CMD=""
NC_CONFIG_PATH=""

# Docker
if command -v docker &>/dev/null; then
    NC_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i nextcloud | head -1 || true)
    if [[ -z "$NC_CONTAINER" ]]; then
        NC_CONTAINER=$(docker ps --format '{{.Names}}\t{{.Image}}' | grep -i nextcloud | awk '{print $1}' | head -1 || true)
    fi
    if [[ -n "$NC_CONTAINER" ]]; then
        INSTALL_TYPE="docker"
        NC_CONFIG_PATH="/var/www/html/config/config.php"
        OCC_CMD="docker exec -u www-data ${NC_CONTAINER} php occ"
        ok "Docker container: ${NC_CONTAINER}"
    fi
fi

# Snap
if [[ "$INSTALL_TYPE" == "unknown" ]] && command -v snap &>/dev/null && snap list nextcloud &>/dev/null 2>&1; then
    INSTALL_TYPE="snap"
    NC_CONFIG_PATH="/var/snap/nextcloud/current/nextcloud/config/config.php"
    OCC_CMD="nextcloud.occ"
    ok "Snap installation"
fi

# Bare metal
if [[ "$INSTALL_TYPE" == "unknown" ]]; then
    for candidate in /var/www/nextcloud /var/www/html/nextcloud /usr/share/nextcloud; do
        if [[ -f "${candidate}/config/config.php" ]]; then
            INSTALL_TYPE="bare_metal"
            NC_CONFIG_PATH="${candidate}/config/config.php"
            OCC_CMD="sudo -u www-data php ${candidate}/occ"
            ok "Bare metal: ${candidate}"
            break
        fi
    done
fi

if [[ "$INSTALL_TYPE" == "unknown" ]]; then
    fail "Nextcloud not found. Cannot proceed."
    exit 1
fi

# ---- 2. Backup config.php ----------------------------------
section "2. Backup config.php"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

if [[ "$DRY_RUN" -eq 1 ]]; then
    info "[DRY-RUN] Would backup config.php"
else
    if [[ "$INSTALL_TYPE" == "docker" ]]; then
        docker exec "$NC_CONTAINER" cp "$NC_CONFIG_PATH" "${NC_CONFIG_PATH}.bak.${TIMESTAMP}"
        ok "Backup: ${NC_CONFIG_PATH}.bak.${TIMESTAMP} (inside container)"
    elif [[ -f "$NC_CONFIG_PATH" ]]; then
        cp "$NC_CONFIG_PATH" "${NC_CONFIG_PATH}.bak.${TIMESTAMP}"
        ok "Backup: ${NC_CONFIG_PATH}.bak.${TIMESTAMP}"
    fi
fi

# ---- 3. Add domain to trusted_domains ----------------------
section "3. Add '${DOMAIN}' to trusted_domains"

# Find the next free index
NEXT_IDX=0
while true; do
    existing=$(run_occ config:system:get trusted_domains "$NEXT_IDX" 2>/dev/null || true)
    if [[ -z "$existing" ]]; then
        break
    fi
    if [[ "$existing" == "$DOMAIN" ]]; then
        ok "'${DOMAIN}' already in trusted_domains at index ${NEXT_IDX} — skipping"
        NEXT_IDX=-1
        break
    fi
    NEXT_IDX=$((NEXT_IDX + 1))
done

if [[ "$NEXT_IDX" -ge 0 ]]; then
    run_occ config:system:set trusted_domains "$NEXT_IDX" --value="$DOMAIN"
    ok "Added '${DOMAIN}' at trusted_domains[${NEXT_IDX}]"
fi

# ---- 4. Set overwrite* parameters --------------------------
section "4. Set overwrite parameters"

run_occ config:system:set overwrite.cli.url --value="${PROTOCOL}://${DOMAIN}"
ok "overwrite.cli.url = ${PROTOCOL}://${DOMAIN}"

run_occ config:system:set overwriteprotocol --value="$PROTOCOL"
ok "overwriteprotocol = ${PROTOCOL}"

run_occ config:system:set overwritehost --value="$DOMAIN"
ok "overwritehost = ${DOMAIN}"

# ---- 5. Trusted proxies (if specified) ---------------------
section "5. Trusted proxies"

if [[ -n "$PROXY_CIDR" ]]; then
    # Find next free index for trusted_proxies
    PROXY_IDX=0
    while true; do
        existing=$(run_occ config:system:get trusted_proxies "$PROXY_IDX" 2>/dev/null || true)
        if [[ -z "$existing" ]]; then
            break
        fi
        if [[ "$existing" == "$PROXY_CIDR" ]]; then
            ok "'${PROXY_CIDR}' already in trusted_proxies — skipping"
            PROXY_IDX=-1
            break
        fi
        PROXY_IDX=$((PROXY_IDX + 1))
    done

    if [[ "$PROXY_IDX" -ge 0 ]]; then
        run_occ config:system:set trusted_proxies "$PROXY_IDX" --value="$PROXY_CIDR"
        ok "Added '${PROXY_CIDR}' at trusted_proxies[${PROXY_IDX}]"
    fi

    # Check host nginx forwards required headers
    echo ""
    info "Verify your reverse proxy forwards these headers:"
    info "  proxy_set_header Host \$host;"
    info "  proxy_set_header X-Real-IP \$remote_addr;"
    info "  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
    info "  proxy_set_header X-Forwarded-Proto \$scheme;"
    echo ""

    NGINX_OK=0
    for dir in /etc/nginx/sites-enabled /etc/nginx/conf.d; do
        if [[ -d "$dir" ]] && grep -rq "X-Forwarded-Proto" "$dir" 2>/dev/null; then
            ok "X-Forwarded-Proto found in ${dir}"
            NGINX_OK=1
        fi
    done
    if [[ "$NGINX_OK" -eq 0 ]]; then
        warn "X-Forwarded-Proto NOT found in nginx config — add it to your proxy block!"
    fi
else
    info "No --proxy specified, skipping trusted_proxies setup"
    info "If behind a reverse proxy, re-run with: --proxy 172.17.0.0/16"
fi

# ---- 6. Verify config --------------------------------------
section "6. Verify applied config"

info "trusted_domains:"
for i in 0 1 2 3 4 5; do
    val=$($OCC_CMD config:system:get trusted_domains "$i" 2>/dev/null || true)
    if [[ -n "$val" ]]; then
        info "    [$i] = $val"
    else
        break
    fi
done

info "overwrite.cli.url  = $($OCC_CMD config:system:get overwrite.cli.url 2>/dev/null || echo '(not set)')"
info "overwriteprotocol  = $($OCC_CMD config:system:get overwriteprotocol 2>/dev/null || echo '(not set)')"
info "overwritehost      = $($OCC_CMD config:system:get overwritehost 2>/dev/null || echo '(not set)')"

info "trusted_proxies:"
for i in 0 1 2 3 4 5; do
    val=$($OCC_CMD config:system:get trusted_proxies "$i" 2>/dev/null || true)
    if [[ -n "$val" ]]; then
        info "    [$i] = $val"
    else
        if [[ "$i" -eq 0 ]]; then info "    (not set)"; fi
        break
    fi
done

# ---- 7. Restart instructions --------------------------------
section "7. Restart services"

echo ""
info "Run these commands to apply changes:"
echo ""

if [[ "$INSTALL_TYPE" == "docker" ]]; then
    COMPOSE_DIR=$(docker inspect "$NC_CONTAINER" --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' 2>/dev/null || true)
    COMPOSE_CFG=$(docker inspect "$NC_CONTAINER" --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}' 2>/dev/null || true)

    if [[ -n "$COMPOSE_DIR" ]]; then
        info "  cd ${COMPOSE_DIR}"
        if [[ -n "$COMPOSE_CFG" ]]; then
            info "  docker compose -f $(basename "$COMPOSE_CFG") restart"
        else
            info "  docker compose restart"
        fi
    else
        info "  docker restart ${NC_CONTAINER}"
    fi

    # Host nginx if present
    if systemctl is-active nginx &>/dev/null 2>&1; then
        echo ""
        info "  sudo systemctl reload nginx   # host reverse proxy"
    fi
elif [[ "$INSTALL_TYPE" == "snap" ]]; then
    info "  sudo snap restart nextcloud"
else
    info "  sudo systemctl restart php*-fpm"
    info "  sudo systemctl reload nginx    # or: sudo systemctl reload apache2"
fi

echo ""
info "Verify with:"
info "  curl -I https://${DOMAIN}"
info "  # Expected: HTTP/2 200 (or 302 redirect to login)"

echo ""
ok "Done. Config backup: ${NC_CONFIG_PATH}.bak.${TIMESTAMP}"
