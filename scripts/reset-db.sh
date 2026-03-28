#!/bin/bash
# Quick database reset script
# Usage: npm run db:reset

DB_USER="saintsea_pressure"
DB_PASS="pressurepressure"
DB_NAME="saintsea_pressure-engine"

echo "🔄 Resetting database..."

# Drop and recreate database (suppress warnings)
if mysql -u $DB_USER -p$DB_PASS -e "DROP DATABASE IF EXISTS \`$DB_NAME\`; CREATE DATABASE \`$DB_NAME\`;" 2>/dev/null; then
  echo "✅ Database reset complete"
  echo "📝 Tables will be auto-created on first request"
else
  echo "❌ Database reset failed - check MySQL credentials"
  exit 1
fi
