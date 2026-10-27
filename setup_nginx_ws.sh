#!/bin/bash
#
# Idempotent nginx patch — wires up WebSocket upgrade for the socket.io
# endpoint of each Riocut-family subdomain. Run on the prod VPS as root.
#
# It assumes the existing server blocks are managed via certbot / sites-available
# and currently proxy_pass to 127.0.0.1:<APP_PORT>.  The script:
#   1. drops a global `map $http_upgrade $connection_upgrade` into conf.d
#   2. for each vhost adds a dedicated `location /api/socketio/` block
#      with proxy_http_version 1.1 + Upgrade + Connection headers
#   3. tests + reloads nginx
#
# Re-running is safe — every change is guarded by a grep.
#
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
    echo "❌ Run as root:  sudo bash setup_nginx_ws.sh"
    exit 1
fi

# host:port pairs to patch (subdomain → upstream app port)
PATCHES=(
    "riocut.com:8000"
    "sports.riocut.com:5555"
    "tv.riocut.com:3333"
)

# ---------- 1. global map for Upgrade header ----------------------------
MAP_FILE=/etc/nginx/conf.d/websocket-upgrade.conf
if ! grep -q "connection_upgrade" "$MAP_FILE" 2>/dev/null; then
    cat > "$MAP_FILE" <<'EOF'
# Required by socket.io / WebSocket upstreams. Loaded at the http {} level
# because it lives in conf.d.
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
EOF
    echo "✅ Wrote $MAP_FILE"
else
    echo "↪️  $MAP_FILE already present, leaving it alone"
fi

# ---------- 2. patch each vhost server block ----------------------------
patch_vhost() {
    local domain="$1"
    local port="$2"
    local conf

    # Find the file that owns this server_name. Prefer sites-enabled (active).
    conf="$(grep -lE "server_name[^;]*\\b${domain//./\\.}\\b" /etc/nginx/sites-enabled/* /etc/nginx/sites-available/* /etc/nginx/conf.d/* 2>/dev/null | head -n1 || true)"
    if [[ -z "$conf" ]]; then
        echo "⚠️  No nginx config found for $domain — skipping"
        return
    fi
    echo "🔧 Patching $conf for $domain → :$port"

    if grep -q "location /api/socketio/" "$conf"; then
        echo "   ↪️  /api/socketio/ block already present"
        return
    fi

    # Backup once per run
    cp -n "$conf" "${conf}.bak.$(date +%s)"

    # Insert before the catch-all `location / {` of the *SSL* server block.
    # We do it with an awk pass keyed on the first occurrence after the
    # matching server_name line — avoids touching unrelated server blocks.
    awk -v port="$port" -v domain="$domain" '
        BEGIN { hit=0; patched=0 }
        # Detect the right server block by its server_name line
        /server_name/ && index($0, domain) { hit=1 }
        # First "location /" inside that block → inject our block just before it
        hit==1 && patched==0 && /^[[:space:]]*location[[:space:]]+\/[[:space:]]*\{/ {
            print "    location /api/socketio/ {"
            print "        proxy_pass http://127.0.0.1:" port ";"
            print "        proxy_http_version 1.1;"
            print "        proxy_set_header Upgrade $http_upgrade;"
            print "        proxy_set_header Connection $connection_upgrade;"
            print "        proxy_set_header Host $host;"
            print "        proxy_set_header X-Real-IP $remote_addr;"
            print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
            print "        proxy_set_header X-Forwarded-Proto $scheme;"
            print "        proxy_read_timeout 86400s;"
            print "        proxy_send_timeout 86400s;"
            print "        proxy_buffering off;"
            print "    }"
            print ""
            patched=1
        }
        { print }
        END { if (!patched) { print "ERR_NOT_PATCHED" > "/dev/stderr"; exit 7 } }
    ' "$conf" > "${conf}.new"

    mv "${conf}.new" "$conf"
    echo "   ✅ Inserted /api/socketio/ block"
}

for pair in "${PATCHES[@]}"; do
    domain="${pair%%:*}"
    port="${pair##*:}"
    patch_vhost "$domain" "$port" || echo "⚠️  Patch of $domain failed (exit $?)"
done

# ---------- 3. validate + reload ---------------------------------------
echo ""
echo "🧪 nginx -t..."
if nginx -t; then
    systemctl reload nginx
    echo "✅ nginx reloaded"
else
    echo "❌ nginx config is invalid — backups left next to each *.bak.* file."
    echo "   Restore with:  cp /etc/nginx/sites-available/<file>.bak.<ts> /etc/nginx/sites-available/<file>"
    exit 1
fi

# ---------- 4. quick smoke test ----------------------------------------
echo ""
echo "🔍 WebSocket upgrade probes (expect '101 Switching Protocols'):"
for pair in "${PATCHES[@]}"; do
    d="${pair%%:*}"
    code=$(curl -sk --max-time 5 \
        -H "Connection: Upgrade" -H "Upgrade: websocket" \
        -H "Sec-WebSocket-Version: 13" \
        -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
        -o /dev/null -w "%{http_code}" \
        "https://$d/api/socketio/?EIO=4&transport=websocket" || echo "ERR")
    printf "   %-22s -> %s\n" "$d" "$code"
done
echo ""
echo "Done. If any showed 400/502 instead of 101 check tail /var/log/nginx/error.log"
