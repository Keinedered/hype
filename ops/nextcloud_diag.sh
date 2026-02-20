#!/usr/bin/env bash
# ============================================================
# Nextcloud — Diagnostic script (read-only)
# Detects installation type, collects config & logs.
# DOES NOT modify anything.
# Usage: sudo bash ops/nextcloud_diag.sh
# ============================================================
set -euo pipefail

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

# ---- 1. Detect installation type ---------------------------
section "1. Installation type"

INSTALL_TYPE="unknown"
NC_CONTAINER=""
COMPOSE_FILE=""
NC_CONFIG_PATH=""
OCC_CMD=""

# Docker Compose
if command -v docker &>/dev/null; then
    # Try to find a running nextcloud container
    NC_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i nextcloud | head -1 || true)

    if [[ -z "$NC_CONTAINER" ]]; then
        # Try image name
        NC_CONTAINER=$(docker ps --format '{{.Names}}\t{{.Image}}' | grep -i nextcloud | awk '{print $1}' | head -1 || true)
    fi

    if [[ -n "$NC_CONTAINER" ]]; then
        INSTALL_TYPE="docker"
        NC_CONFIG_PATH="/var/www/html/config/config.php"
        OCC_CMD="docker exec -u www-data ${NC_CONTAINER} php occ"
        ok "Docker container found: ${NC_CONTAINER}"

        # Check if managed by compose
        COMPOSE_PROJECT=$(docker inspect "$NC_CONTAINER" --format '{{index .Config.Labels "com.docker.compose.project"}}' 2>/dev/null || true)
        if [[ -n "$COMPOSE_PROJECT" ]]; then
            COMPOSE_DIR=$(docker inspect "$NC_CONTAINER" --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' 2>/dev/null || true)
            COMPOSE_FILE=$(docker inspect "$NC_CONTAINER" --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}' 2>/dev/null || true)
            info "Compose project: ${COMPOSE_PROJECT}"
            info "Compose dir: ${COMPOSE_DIR:-unknown}"
            info "Compose file: ${COMPOSE_FILE:-unknown}"
        fi
    fi
fi

# Snap
if [[ "$INSTALL_TYPE" == "unknown" ]] && command -v snap &>/dev/null && snap list nextcloud &>/dev/null 2>&1; then
    INSTALL_TYPE="snap"
    NC_CONFIG_PATH="/var/snap/nextcloud/current/nextcloud/config/config.php"
    OCC_CMD="nextcloud.occ"
    ok "Snap installation detected"
fi

# Bare metal
if [[ "$INSTALL_TYPE" == "unknown" ]]; then
    for candidate in /var/www/nextcloud /var/www/html/nextcloud /usr/share/nextcloud; do
        if [[ -f "${candidate}/config/config.php" ]]; then
            INSTALL_TYPE="bare_metal"
            NC_CONFIG_PATH="${candidate}/config/config.php"
            OCC_CMD="sudo -u www-data php ${candidate}/occ"
            ok "Bare metal at ${candidate}"
            break
        fi
    done
fi

if [[ "$INSTALL_TYPE" == "unknown" ]]; then
    fail "Could not detect Nextcloud installation"
    info "Searched: docker containers, snap, /var/www/nextcloud, /var/www/html/nextcloud"
    info "If installed elsewhere, set NC_CONFIG_PATH and re-run."
    exit 1
fi

info "Install type: ${INSTALL_TYPE}"

# ---- 2. Web server detection & vhost config ----------------
section "2. Web server"

detect_webserver() {
    if [[ "$INSTALL_TYPE" == "docker" ]]; then
        # Check what runs inside the container or in front of it
        # Nextcloud container itself usually runs Apache
        local server_sw
        server_sw=$(docker exec "$NC_CONTAINER" sh -c 'command -v nginx && echo nginx || (command -v apache2ctl && echo apache) || echo unknown' 2>/dev/null || echo "unknown")
        info "Inside container: ${server_sw}"

        # Check host-level reverse proxy
        if command -v nginx &>/dev/null && systemctl is-active nginx &>/dev/null 2>&1; then
            ok "Host nginx is running (reverse proxy)"
        elif pgrep -x nginx &>/dev/null; then
            ok "Host nginx process found (reverse proxy)"
        fi
    else
        if systemctl is-active nginx &>/dev/null 2>&1; then
            ok "nginx is active"
        elif systemctl is-active apache2 &>/dev/null 2>&1; then
            ok "apache2 is active"
        elif systemctl is-active httpd &>/dev/null 2>&1; then
            ok "httpd is active"
        else
            warn "No known web server detected via systemctl"
        fi
    fi
}

detect_webserver

# Search for vhost/server_name referencing graph-ranepa.ru
section "2a. Vhost / server_name for graph-ranepa.ru"

search_vhost() {
    local found=0

    # Host nginx
    for dir in /etc/nginx/sites-enabled /etc/nginx/conf.d /etc/nginx/sites-available; do
        if [[ -d "$dir" ]]; then
            local matches
            matches=$(grep -rl "graph-ranepa" "$dir" 2>/dev/null || true)
            if [[ -n "$matches" ]]; then
                ok "Found in nginx config:"
                echo "$matches" | while read -r f; do
                    info "  $f"
                    grep -n "server_name\|proxy_pass\|proxy_set_header" "$f" 2>/dev/null | sed 's/^/    /'
                done
                found=1
            fi
        fi
    done

    # Host apache
    for dir in /etc/apache2/sites-enabled /etc/httpd/conf.d; do
        if [[ -d "$dir" ]]; then
            local matches
            matches=$(grep -rl "graph-ranepa" "$dir" 2>/dev/null || true)
            if [[ -n "$matches" ]]; then
                ok "Found in apache config:"
                echo "$matches" | while read -r f; do
                    info "  $f"
                    grep -n "ServerName\|ServerAlias\|ProxyPass\|RequestHeader" "$f" 2>/dev/null | sed 's/^/    /'
                done
                found=1
            fi
        fi
    done

    # Docker: check nginx config inside container
    if [[ "$INSTALL_TYPE" == "docker" ]]; then
        local docker_nginx
        docker_nginx=$(docker ps --format '{{.Names}}' | grep -i nginx | head -1 || true)
        if [[ -n "$docker_nginx" ]]; then
            info "Checking inside docker container: ${docker_nginx}"
            docker exec "$docker_nginx" grep -rn "server_name\|proxy_set_header\|proxy_pass" /etc/nginx/conf.d/ 2>/dev/null | sed 's/^/    /' || true
            found=1
        fi
    fi

    if [[ "$found" -eq 0 ]]; then
        warn "No vhost config found mentioning graph-ranepa"
    fi
}

search_vhost

# ---- 3. Proxy header forwarding ----------------------------
section "2b. Proxy header forwarding (X-Forwarded-*, Host)"

check_proxy_headers() {
    local found=0
    for dir in /etc/nginx /etc/apache2 /etc/httpd; do
        if [[ -d "$dir" ]]; then
            local results
            results=$(grep -rn "X-Forwarded-Proto\|X-Forwarded-For\|X-Real-IP\|proxy_set_header Host\|RequestHeader set X-Forwarded" "$dir" 2>/dev/null || true)
            if [[ -n "$results" ]]; then
                ok "Proxy headers found in ${dir}:"
                echo "$results" | head -20 | sed 's/^/    /'
                found=1
            fi
        fi
    done

    if [[ "$found" -eq 0 ]]; then
        warn "No proxy header forwarding found on host"
    fi
}

check_proxy_headers

# ---- 4. Nextcloud config (via occ) ------------------------
section "3. Nextcloud config.php (key values)"

read_nc_config() {
    if [[ -n "$OCC_CMD" ]]; then
        info "Using occ: ${OCC_CMD}"
        echo ""

        info "trusted_domains:"
        for i in 0 1 2 3 4 5; do
            val=$($OCC_CMD config:system:get trusted_domains "$i" 2>/dev/null || true)
            if [[ -n "$val" ]]; then
                info "    [$i] = $val"
            else
                break
            fi
        done

        echo ""
        info "overwrite.cli.url:"
        info "    $($OCC_CMD config:system:get overwrite.cli.url 2>/dev/null || echo '(not set)')"

        info "overwriteprotocol:"
        info "    $($OCC_CMD config:system:get overwriteprotocol 2>/dev/null || echo '(not set)')"

        info "overwritehost:"
        info "    $($OCC_CMD config:system:get overwritehost 2>/dev/null || echo '(not set)')"

        info "overwritewebroot:"
        info "    $($OCC_CMD config:system:get overwritewebroot 2>/dev/null || echo '(not set)')"

        echo ""
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
    else
        warn "occ not available, trying direct config.php read"
        if [[ "$INSTALL_TYPE" == "docker" ]]; then
            docker exec "$NC_CONTAINER" grep -A 20 "'trusted_domains'" "$NC_CONFIG_PATH" 2>/dev/null | sed 's/^/    /' || fail "Cannot read config.php"
            docker exec "$NC_CONTAINER" grep "overwrite\|trusted_prox" "$NC_CONFIG_PATH" 2>/dev/null | sed 's/^/    /' || true
        elif [[ -f "$NC_CONFIG_PATH" ]]; then
            grep -A 20 "'trusted_domains'" "$NC_CONFIG_PATH" | sed 's/^/    /' || fail "Cannot read config.php"
            grep "overwrite\|trusted_prox" "$NC_CONFIG_PATH" | sed 's/^/    /' || true
        fi
    fi
}

read_nc_config

# ---- 5. Logs -----------------------------------------------
section "4. Recent logs (untrusted domain / host)"

collect_logs() {
    local LOG_LINES=30

    # Nextcloud log
    info "--- Nextcloud log (last ${LOG_LINES} lines with 'trusted' or 'domain') ---"
    if [[ "$INSTALL_TYPE" == "docker" ]]; then
        docker exec "$NC_CONTAINER" sh -c "
            if [ -f /var/www/html/data/nextcloud.log ]; then
                tail -${LOG_LINES} /var/www/html/data/nextcloud.log | grep -i 'trusted\|domain\|untrusted' || echo '    (no matching lines)'
            else
                echo '    nextcloud.log not found at default path'
            fi
        " 2>/dev/null | sed 's/^/    /'
    elif [[ -f /var/www/nextcloud/data/nextcloud.log ]]; then
        tail -"${LOG_LINES}" /var/www/nextcloud/data/nextcloud.log | grep -i 'trusted\|domain\|untrusted' | sed 's/^/    /' || info "    (no matching lines)"
    else
        info "    nextcloud.log not found"
    fi

    echo ""

    # Web server error log
    info "--- Web server error log (last ${LOG_LINES} lines) ---"
    if [[ -f /var/log/nginx/error.log ]]; then
        tail -"${LOG_LINES}" /var/log/nginx/error.log | sed 's/^/    /'
    elif [[ -f /var/log/apache2/error.log ]]; then
        tail -"${LOG_LINES}" /var/log/apache2/error.log | sed 's/^/    /'
    else
        info "    No host web server error log found"
    fi

    echo ""

    # Docker logs
    if [[ "$INSTALL_TYPE" == "docker" && -n "$NC_CONTAINER" ]]; then
        info "--- Docker container logs (last ${LOG_LINES} lines) ---"
        docker logs --tail "$LOG_LINES" "$NC_CONTAINER" 2>&1 | sed 's/^/    /'
    fi
}

collect_logs

# ---- 6. TLS quick check -----------------------------------
section "5. TLS check for graph-ranepa.ru"

if command -v openssl &>/dev/null; then
    info "Checking certificate (timeout 5s)..."
    cert_info=$(echo | timeout 5 openssl s_client -connect graph-ranepa.ru:443 -servername graph-ranepa.ru 2>/dev/null | openssl x509 -noout -subject -issuer -dates -ext subjectAltName 2>/dev/null || true)
    if [[ -n "$cert_info" ]]; then
        ok "Certificate info:"
        echo "$cert_info" | sed 's/^/    /'
    else
        warn "Could not retrieve TLS certificate (DNS not pointing here, or port 443 closed)"
    fi
else
    warn "openssl not installed, skipping TLS check"
fi

# ---- Summary -----------------------------------------------
section "Summary"
info "Install type : ${INSTALL_TYPE}"
info "Container    : ${NC_CONTAINER:-N/A}"
info "Config path  : ${NC_CONFIG_PATH}"
info "occ command  : ${OCC_CMD:-N/A}"
echo ""
info "Next step: run ops/nextcloud_fix_untrusted_domain.sh"
