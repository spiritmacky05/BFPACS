#!/bin/bash
# generate_secrets.sh — Creates a production-ready .env file with secure random secrets.
# Run once on the server before the first `docker compose up -d`.
#
# Usage:
#   bash generate_secrets.sh
#   docker compose up -d --build

set -e

ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
    echo "⚠️  .env already exists. Delete it first if you want to regenerate."
    exit 1
fi

# Generate a secure 64-byte base64 JWT secret
JWT_SECRET=$(openssl rand -base64 48)

echo "Enter a strong DB password (or press Enter to auto-generate):"
read -r -s DB_PASSWORD_INPUT
if [ -z "$DB_PASSWORD_INPUT" ]; then
    DB_PASSWORD_INPUT=$(openssl rand -base64 24 | tr -d '/+=')
    echo "Auto-generated DB password."
fi

cat > "$ENV_FILE" <<EOF
# BFPACS Production Secrets — DO NOT COMMIT THIS FILE
# Generated on $(date -u +"%Y-%m-%d %H:%M UTC")

DB_PASSWORD=${DB_PASSWORD_INPUT}
JWT_SECRET=${JWT_SECRET}
GIN_MODE=release
EOF

chmod 600 "$ENV_FILE"

echo ""
echo "✅ .env created with secure secrets."
echo "   DB_PASSWORD and JWT_SECRET are set."
echo ""
echo "Next steps:"
echo "  docker compose up -d --build"
