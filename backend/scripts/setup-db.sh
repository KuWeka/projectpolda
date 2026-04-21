#!/bin/bash

# Helpdesk IT Project - Database Setup Script
# This script initializes the MySQL database with schema and sample data

set -e

echo "=========================================="
echo "Helpdesk IT - Database Setup"
echo "=========================================="

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Database configuration with defaults
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-helpdesk_user}
DB_PASSWORD=${DB_PASSWORD:-helpdesk_pass}
DB_NAME=${DB_NAME:-helpdesk}

echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Check if database exists
echo "Checking database connection..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✓ Database connection successful"
else
  echo "✗ Failed to connect to database"
  echo "Please check your database configuration in .env file"
  exit 1
fi

# Create database if not exists
echo ""
echo "Creating database if not exists..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
echo "✓ Database created or already exists"

# Run schema migration
echo ""
echo "Running schema migration..."
if [ -f "./sql/schema.sql" ]; then
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < ./sql/schema.sql
  echo "✓ Schema migration completed"
else
  echo "✗ Schema file not found: ./sql/schema.sql"
  exit 1
fi

# Run seed data (optional)
echo ""
read -p "Do you want to load sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  if [ -f "./sql/seeds.sql" ]; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < ./sql/seeds.sql
    echo "✓ Sample data loaded"
  else
    echo "⚠ Seed file not found: ./sql/seeds.sql"
  fi
fi

# Create required directories
echo ""
echo "Creating required directories..."
mkdir -p uploads logs
chmod 755 uploads logs
echo "✓ Directories created"

# Initialize cache (Redis)
echo ""
echo "Initializing Redis cache..."
npm run cache:clear || echo "⚠ Cache clearing failed (Redis may not be running)"
echo "✓ Cache initialization completed"

# Create .env file if not exists
echo ""
if [ ! -f .env ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "✓ .env file created - Update with your configuration"
else
  echo "✓ .env file already exists"
fi

echo ""
echo "=========================================="
echo "Setup completed successfully! ✓"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Install dependencies: npm install"
echo "3. Start the server: npm start"
echo ""