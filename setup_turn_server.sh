#!/bin/bash
#
# Setup coturn TURN server on a Linux VPS for Riocut / Riocut Sports WebRTC.
# Enables P2P relay when the provider blocks UDP or peers are behind NAT.
#
# Usage (as root):
#   sudo bash setup_turn_server.sh
#
# Optional environment overrides (recommended for prod):
#   TURN_USER=movies          # username (default: movies)
#   TURN_PASSWORD=...         # password (default: random 32-char)
#   TURN_REALM=riocut.com     # realm  (default: riocut.com)
#   TURN_PORT=3478            # listening port
#   TURN_TLS_PORT=5349        # TLS port
#
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
    echo "❌ Run as root:   sudo bash setup_turn_server.sh"
    exit 1
fi

# ---------- Config -----------------------------------------------------------
TURN_USER="${TURN_USER:-riocut}"
TURN_PASSWORD="${TURN_PASSWORD:-$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32 || openssl rand -hex 16)}"
TURN_REALM="${TURN_REALM:-riocut.com}"
TURN_PORT="${TURN_PORT:-3478}"
TURN_TLS_PORT="${TURN_TLS_PORT:-5349}"

# Detect public IP — prefer hostname -I, fall back to curl ifconfig.me.
SERVER_IP="$(hostname -I | awk '{print $1}')"
[[ -z "$SERVER_IP" ]] && SERVER_IP="$(curl -fsS https://ifconfig.me || echo '')"
if [[ -z "$SERVER_IP" ]]; then
    echo "❌ Could not detect server public IP. Set SERVER_IP=... and re-run."
    exit 1
fi

echo "🚀 Riocut TURN Server Setup"
echo "================================"
echo "📍 Server IP:    $SERVER_IP"
echo "👤 TURN user:    $TURN_USER"
echo "🌐 TURN realm:   $TURN_REALM"
echo "🚪 TURN ports:   $TURN_PORT (UDP/TCP), $TURN_TLS_PORT (TLS)"
echo ""

# ---------- Install coturn ---------------------------------------------------
echo "📦 Installing coturn..."
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y coturn >/dev/null
command -v turnserver >/dev/null || {
    echo "❌ coturn install failed. Try: apt-get update && apt-get install -y coturn"
    exit 1
}
echo "✅ coturn installed"

# ---------- Directories ------------------------------------------------------
install -d -o coturn -g coturn /etc/coturn /var/lib/coturn /var/log/coturn || {
    mkdir -p /etc/coturn /var/lib/coturn /var/log/coturn
}

# ---------- Write config -----------------------------------------------------
echo "⚙️  Writing /etc/coturn/turnserver.conf..."
cat > /etc/coturn/turnserver.conf <<EOF
# Riocut TURN Server Configuration
# Generated $(date -u +%Y-%m-%dT%H:%M:%SZ)

# Listen on all interfaces
listening-port=${TURN_PORT}
listening-ip=0.0.0.0
alt-listening-port=${TURN_TLS_PORT}

# Public IP for relay candidates
relay-ip=${SERVER_IP}
external-ip=${SERVER_IP}
realm=${TURN_REALM}

# Static-auth credentials
lt-cred-mech
user=${TURN_USER}:${TURN_PASSWORD}

# Performance + safety
max-bps=1000000
bps-capacity=0
no-tlsv1
no-tlsv1_1
fingerprint
no-multicast-peers
no-cli
mobility

# Logging
log-file=/var/log/coturn/turnserver.log
log-level=info

# Run as coturn user
proc-user=coturn
proc-group=coturn
EOF
chown coturn:coturn /etc/coturn/turnserver.conf
chmod 640 /etc/coturn/turnserver.conf

# Ensure coturn auto-starts on Debian/Ubuntu
if [[ -f /etc/default/coturn ]]; then
    sed -i 's/^#*TURNSERVER_ENABLED=.*/TURNSERVER_ENABLED=1/' /etc/default/coturn
fi

# ---------- Open firewall ----------------------------------------------------
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
    ufw allow ${TURN_PORT}/udp >/dev/null
    ufw allow ${TURN_PORT}/tcp >/dev/null
    ufw allow ${TURN_TLS_PORT}/udp >/dev/null
    ufw allow ${TURN_TLS_PORT}/tcp >/dev/null
    ufw allow 49152:65535/udp >/dev/null
    echo "✅ ufw rules applied"
fi

# ---------- Start service ----------------------------------------------------
echo "🔄 Restarting coturn..."
systemctl restart coturn
systemctl enable coturn >/dev/null
sleep 2
if ! systemctl is-active --quiet coturn; then
    echo "❌ coturn failed to start. Logs:"
    journalctl -u coturn -n 30 --no-pager
    exit 1
fi

ss -tuln | grep -q ":${TURN_PORT}\b" || {
    echo "❌ Port ${TURN_PORT} not listening. Check journalctl -u coturn"
    exit 1
}
echo "✅ coturn listening on :${TURN_PORT}"

# ---------- Summary ----------------------------------------------------------
echo ""
echo "📋 TURN credentials (save these — they are written to .env on app servers):"
echo "  TURN host:                turn:${SERVER_IP}:${TURN_PORT}"
echo "  TURN realm:               ${TURN_REALM}"
echo "  NEXT_PUBLIC_TURN_SERVER=  turn:${SERVER_IP}:${TURN_PORT}"
echo "  NEXT_PUBLIC_TURN_USERNAME=${TURN_USER}"
echo "  TURN_PASSWORD=            ${TURN_PASSWORD}"
echo ""
echo "Update the repo secrets used by .github/workflows/deploy-production.yml:"
echo "  TURN_SERVER       (vars):  turn:${SERVER_IP}:${TURN_PORT}"
echo "  TURN_USERNAME     (vars):  ${TURN_USER}"
echo "  TURN_PASSWORD     (secret): ${TURN_PASSWORD}"
echo ""
echo "ICE config for apps/movies/src/app/watch-together/page.tsx:"
cat <<EOC
iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
        urls: [
            'turn:${SERVER_IP}:${TURN_PORT}?transport=udp',
            'turn:${SERVER_IP}:${TURN_PORT}?transport=tcp',
        ],
        username: '${TURN_USER}',
        credential: '${TURN_PASSWORD}',
    },
]
EOC

echo ""
echo "🔒 Security:"
echo "  • Restart coturn after changing creds:  systemctl restart coturn"
echo "  • Tail logs:                           tail -f /var/log/coturn/turnserver.log"
echo "  • Test from a laptop:                  turnutils_uclient -u ${TURN_USER} -w '${TURN_PASSWORD}' ${SERVER_IP}"
