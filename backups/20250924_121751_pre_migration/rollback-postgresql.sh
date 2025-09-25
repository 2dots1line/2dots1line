#!/bin/bash
# PostgreSQL Rollback Script

echo "🔄 Rolling back PostgreSQL database..."

# Stop any running services that might be using the database
echo "⏹️  Stopping services..."
pm2 stop all 2>/dev/null || true

# Drop and recreate database
echo "🗑️  Dropping existing database..."
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS 2d1l_dev;"
psql -h localhost -U postgres -c "CREATE DATABASE 2d1l_dev;"

# Restore from backup
echo "📥 Restoring database from backup..."
if [ -f "postgresql_custom.dump" ]; then
    echo "⚡ Using custom format restore (faster)..."
    pg_restore -h localhost -U postgres -d 2d1l_dev postgresql_custom.dump
else
    echo "📄 Using SQL format restore..."
    psql -h localhost -U postgres -d 2d1l_dev -f postgresql_complete.sql
fi

echo "✅ PostgreSQL rollback completed"
