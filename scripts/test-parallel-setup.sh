#!/usr/bin/env bash
# scripts/test-parallel-setup.sh
# Creates one PostgreSQL database per test file for parallel test isolation.
# Reads the base DATABASE_URL from the environment (or .env) and creates
# suffixed databases: citizenos_test_auth, citizenos_test_topic, etc.
#
# Usage: bash scripts/test-parallel-setup.sh [--drop]
#   --drop  Drops and recreates each database (full reset)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Load .env if present (only sets vars that aren't already set)
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -v '^\s*#' "$REPO_ROOT/.env" | grep -v '^\s*$')
  set +a
fi

# Base DB URL must be set
BASE_URL="${DATABASE_URL:?DATABASE_URL must be set}"

# Strip the database name from the URL to get the host/auth portion
# e.g. postgres://user:pass@host:5432/citizenos -> postgres://user:pass@host:5432
BASE_CONN="$(echo "$BASE_URL" | sed 's|/[^/]*$||')"

# Worker definitions: name -> test file(s)
declare -A WORKERS=(
  [auth]="test/api/auth.js"
  [topic]="test/api/topic.js"
  [group]="test/api/group.js"
  [discussion]="test/api/discussion.js"
  [ideation]="test/api/ideation.js"
  [user]="test/api/user.js"
  [search]="test/api/search.js"
  [activity]="test/api/activity.js"
  [partner]="test/api/partner.js"
  [invite]="test/api/invite.js"
  [upload]="test/api/upload.js"
)

DROP=false
if [[ "${1:-}" == "--drop" ]]; then
  DROP=true
fi

echo "==> Setting up parallel test databases..."

for name in "${!WORKERS[@]}"; do
  DB_NAME="citizenos_test_${name}"
  DB_URL="${BASE_CONN}/${DB_NAME}"

  if $DROP; then
    echo "    Dropping $DB_NAME..."
    psql "$BASE_CONN/postgres" -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" > /dev/null 2>&1 || true
  fi

  # Create if it doesn't exist
  if ! psql "$BASE_CONN/postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
    echo "    Creating $DB_NAME..."
    psql "$BASE_CONN/postgres" -c "CREATE DATABASE \"$DB_NAME\" ENCODING 'UTF8';" > /dev/null
    echo "    Loading schema into $DB_NAME..."
    psql "$DB_URL" -f "$REPO_ROOT/db/config/database.sql" > /dev/null
  else
    echo "    $DB_NAME already exists, skipping creation."
  fi
done

echo "==> Done. Databases ready for parallel test run."
echo ""
echo "    Run tests with: npm run test:parallel"
echo "    Or for a clean run: bash scripts/test-parallel-setup.sh --drop && npm run test:parallel"
