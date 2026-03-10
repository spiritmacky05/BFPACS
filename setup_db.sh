#!/bin/bash
# BFPACS Database Setup Script
# Run: bash setup_db.sh
# Requires sudo (for postgres user access)

set -e

PG_USER="postgres"
DB_NAME="bfpacs"
DB_OWNER="bfp_admin"
SQL_FILE="./bfpacs_backup.sql"

echo "=== BFPACS Database Setup ==="

# Step 1: Grant CREATEDB to bfp_admin (requires superuser)
echo "[1/4] Granting CREATEDB privilege to bfp_admin..."
sudo -u postgres psql -c "ALTER ROLE bfp_admin CREATEDB;" 2>/dev/null || \
    psql -U postgres -h localhost -c "ALTER ROLE bfp_admin CREATEDB;"

# Step 2: Check if DB exists
echo "[2/4] Checking if bfpacs database exists..."
DB_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -U bfp_admin -h localhost -d postgres \
    -tAc "SELECT 1 FROM pg_database WHERE datname='bfpacs';" 2>/dev/null)

if [ "$DB_EXISTS" = "1" ]; then
    echo "       Database 'bfpacs' already exists. Skipping creation."
else
    echo "       Creating database 'bfpacs'..."
    PGPASSWORD="$DB_PASSWORD" createdb -U bfp_admin -h localhost -O bfp_admin bfpacs
    echo "       Database created."
fi

# Step 3: Enable PostGIS extension (requires superuser)
echo "[3/4] Enabling PostGIS and uuid-ossp extensions..."
sudo -u postgres psql -d bfpacs -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>/dev/null && \
sudo -u postgres psql -d bfpacs -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null && \
sudo -u postgres psql -d bfpacs -c "GRANT ALL ON SCHEMA public TO bfp_admin;" 2>/dev/null || \
    echo "       Note: Extensions may already be installed or need manual setup."

# Step 4: Import backup
echo "[4/4] Importing bfpacs_backup.sql..."
PGPASSWORD="$DB_PASSWORD" psql -U bfp_admin -h localhost -d bfpacs -f "$SQL_FILE" 2>&1 | \
    grep -v "^SET\|^SELECT\|^COPY\|^--\|already exists\|^$" || true

echo ""
echo "=== Setup Complete ==="
echo "Verify with: PGPASSWORD=\"\$DB_PASSWORD\" psql -U bfp_admin -h localhost -d bfpacs -c '\dt'"
