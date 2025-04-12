# 2Dots1Line Quick Start Guide

This document provides all the essential commands and procedures for setting up, running, monitoring, and troubleshooting the 2dots1line application.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Initial Setup](#initial-setup)
3. [Starting All Services](#starting-all-services)
4. [Health Checks](#health-checks)
5. [Monitoring Services](#monitoring-services)
6. [Managing the Database](#managing-the-database)
7. [Managing Neo4j](#managing-neo4j)
8. [Managing Weaviate](#managing-weaviate)
9. [Troubleshooting](#troubleshooting)
10. [Development Workflow](#development-workflow)
11. [API Reference](#api-reference)

## System Requirements

- Node.js 16+ (recommended: Node.js 18+)
- Docker and Docker Compose
- PostgreSQL 14+
- Modern web browser (Chrome, Firefox, Safari)
- 8GB+ RAM recommended
- 10GB+ free disk space

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/2dots1line.git
cd 2dots1line
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your settings
nano .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEO4J_URI`: Neo4j connection URI
- `NEO4J_USERNAME`: Neo4j username
- `NEO4J_PASSWORD`: Neo4j password
- `GEMINI_API_KEY`: Google Gemini API key
- `JWT_SECRET`: Secret for JWT authentication
- `PORT`: Server port (default: 3010)

### 4. Start Docker Containers

```bash
# Start Neo4j and Weaviate containers
docker-compose up -d
```

### 5. Initialize the Database

```bash
# Push Prisma schema to the database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

## Starting All Services

### Quick Start (All Services)

```bash
# Start everything with one command
npm run start:all
```

### Start Individual Services

```bash
# Start just the backend server
npm run dev

# Start Neo4j (if using Docker)
docker start 2dots1line-neo4j

# Start Weaviate (if using Docker)
docker start 2dots1line-weaviate

# Start Prisma Studio (database UI)
npx prisma studio
```

### Access the Application

- Web Application: http://localhost:3010
- Prisma Studio: http://localhost:5555
- Neo4j Browser: http://localhost:7474

## Health Checks

### Check Backend Server

```bash
# Check the server health endpoint
curl http://localhost:3010/health
```

Expected response: `{"status":"ok","message":"Server is running"}`

### Check Neo4j

```bash
# Check Neo4j connection
npm run check:neo4j
```

### Check Database

```bash
# Check database connection
npm run check:db
```

### Check All Services

```bash
# Check all service connections
npm run check:all
```

## Monitoring Services

### Monitor Backend Server

```bash
# View server logs
npm run logs:server

# View server logs in real-time
npm run logs:server:watch
```

### Monitor Neo4j

```bash
# View Neo4j logs
docker logs 2dots1line-neo4j

# View Neo4j logs in real-time
docker logs -f 2dots1line-neo4j
```

### Monitor Weaviate

```bash
# View Weaviate logs
docker logs 2dots1line-weaviate

# View Weaviate logs in real-time
docker logs -f 2dots1line-weaviate
```

### Monitor Memory Events

```bash
# View memory processing event logs
tail -f logs/memory_events/memory_events_*.jsonl
```

## Managing the Database

### Start Prisma Studio

```bash
npx prisma studio
```

Access Prisma Studio at http://localhost:5555

### Reset Database

```bash
# Warning: This will delete all data
npx prisma migrate reset
```

### Apply Schema Changes

```bash
# After modifying schema.prisma
npx prisma db push

# Regenerate Prisma client
npx prisma generate
```

### Run Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name description_of_changes

# Apply migrations in production
npx prisma migrate deploy
```

### Backup Database

```bash
# Export database dump
pg_dump -U username -d database_name > backup_$(date +%Y%m%d).sql
```

## Managing Neo4j

### Access Neo4j Browser

Neo4j Browser UI: http://localhost:7474

Default credentials:
- Username: neo4j
- Password: (set in your .env file)

### Neo4j Common Commands

```cypher
// Check database status
CALL dbms.components() YIELD name, versions, edition;

// List all nodes
MATCH (n) RETURN n LIMIT 100;

// Clear database (use with caution)
MATCH (n) DETACH DELETE n;
```

### Reset Neo4j Database

```bash
# Use the reset script
node scripts/reset-neo4j.js

# Or manually clear the database in Neo4j Browser
MATCH (n) DETACH DELETE n;
```

## Managing Weaviate

### Access Weaviate Console

Weaviate Console: http://localhost:8080/v1/console

### Check Weaviate Status

```bash
curl http://localhost:8080/v1/.well-known/ready
```

### Reset Weaviate

```bash
# Use the reset script
node scripts/reset-weaviate-schema.js
```

## Troubleshooting

### Server Won't Start

1. Check if the port is already in use:
   ```bash
   lsof -i :3010
   ```

2. Kill the process using the port:
   ```bash
   kill -9 <PID>
   ```

3. Check environment variables:
   ```bash
   cat .env
   ```

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Check the DATABASE_URL in .env

3. Rebuild Prisma client:
   ```bash
   npx prisma generate
   ```

### Neo4j Connection Issues

1. Verify Neo4j container is running:
   ```bash
   docker ps | grep neo4j
   ```

2. Restart Neo4j container:
   ```bash
   docker restart 2dots1line-neo4j
   ```

3. Check Neo4j logs:
   ```bash
   docker logs 2dots1line-neo4j
   ```

### Memory Processing Failures

1. Check memory event logs:
   ```bash
   tail -f logs/memory_events/memory_events_*.jsonl
   ```

2. Verify Gemini API key is valid in .env

3. Check memoryBroker initialization logs:
   ```bash
   grep "memory broker" logs/app.log
   ```

### Authentication Issues

1. Verify JWT_SECRET is set in .env

2. Clear browser cookies and localStorage

3. Create a test user:
   ```bash
   node scripts/create-test-user.js
   ```

## Development Workflow

### Starting a Development Session

```bash
# 1. Start all services
npm run start:all

# 2. Start the backend server
npm run dev

# 3. Open Prisma Studio
npx prisma studio
```

### Making Code Changes

```bash
# After modifying backend code
# The server should auto-reload with nodemon

# After modifying Prisma schema
npx prisma db push
npx prisma generate
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep="Memory"
```

### Ending a Development Session

```bash
# Stop the server (Ctrl+C in terminal)

# Stop Docker containers
docker-compose down
```

## API Reference

### Authentication

```bash
# Register a new user
curl -X POST http://localhost:3010/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password","email":"test@example.com"}'

# Login
curl -X POST http://localhost:3010/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password"}'
```

### Interactions

```bash
# Create an interaction
curl -X POST http://localhost:3010/api/interactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"session_id":"test-session","interaction_type":"chat","raw_data":{"message":"Hello world"}}'

# Process an interaction
curl -X POST http://localhost:3010/api/interactions/INTERACTION_ID/process \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Memory

```bash
# Search memory
curl -X GET "http://localhost:3010/api/memory/search?query=travel&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Advanced Configuration

See the [Advanced Configuration Guide](./AdvancedConfiguration.md) for:
- Scaling services for production
- Custom embedding models
- Knowledge graph optimization
- Advanced security configuration
