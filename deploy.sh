#!/usr/bin/env bash
set -e

# ==============================================================
# Chekameh Automated Deploy Script
# Pushes local changes to GitHub & deploys to the Linux server
# ==============================================================

SERVER_DIR="/var/www/chekameh_test"
HOSTS=("vivobook" "vivobook-ts")

echo "🚀 [1/3] Pushing to GitHub..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin "$CURRENT_BRANCH"

echo ""
echo "🔄 [2/3] Connecting to server to update deployment..."

CONNECTED=false
for HOST in "${HOSTS[@]}"; do
  if ssh -o BatchMode=yes -o ConnectTimeout=4 "$HOST" "echo ping" >/dev/null 2>&1; then
    TARGET_HOST="$HOST"
    CONNECTED=true
    echo "  ✓ Connected via $TARGET_HOST"
    break
  fi
done

if [ "$CONNECTED" = false ]; then
  echo "❌ Error: Could not connect to server via vivobook or vivobook-ts."
  echo "   Please check your network or Tailscale connection."
  exit 1
fi

ssh "$TARGET_HOST" "bash -s" <<EOF
set -e
echo "  Pulling latest changes in $SERVER_DIR..."
cd "$SERVER_DIR"
git fetch origin main
git reset --hard origin/main
echo "  ✓ Server updated to: \$(git log -1 --format='%h - %s')"
EOF

echo ""
echo "✨ [3/3] Deployment complete! Site updated on https://chekameh.xyz"
