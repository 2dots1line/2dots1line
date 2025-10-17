# Google Cloud VM Setup and Management Guide

This guide provides step-by-step instructions for deploying and managing the 2D1L application on Google Cloud Compute Engine VM.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [VM Creation and Initial Setup](#vm-creation-and-initial-setup)
3. [Application Deployment](#application-deployment)
4. [Service Management](#service-management)
5. [Database Management](#database-management)
6. [Health Checks and Monitoring](#health-checks-and-monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance and Updates](#maintenance-and-updates)

## Prerequisites

### Local Machine Requirements
- Google Cloud CLI (`gcloud`) installed and authenticated
- Access to project `d1l-460112`
- SSH key pair for VM access
- Git access to repository: `https://github.com/2dots1line/2dots1line.git`

### Google Cloud Setup
- Project ID: `d1l-460112`
- APIs enabled: Compute Engine, Secret Manager, Cloud Logging
- Billing account configured
- Service account with appropriate permissions

## VM Creation and Initial Setup

### 1. Create VM and Install Dependencies

**From your local machine, run:**

```bash
# Make script executable
chmod +x deploy-vm.sh

# Create VM and install dependencies
./deploy-vm.sh
```

**What this script does:**
- Creates VM `twodots-vm` (e2-standard-4, 4 vCPU, 16GB RAM, 100GB SSD)
- Installs Node.js 20, pnpm, PM2, Docker, Docker Compose, gcloud CLI
- Creates firewall rules for ports 80, 443, 3000, 3001
- Sets up SSH key authentication
- Outputs VM external IP address

**Expected output:**
```
VM created successfully!
External IP: 34.67.68.212
SSH command: gcloud compute ssh twodots-vm --zone=us-central1-a
```

### 2. SSH into VM

```bash
# SSH into the VM
gcloud compute ssh twodots-vm --zone=us-central1-a
```

## Application Deployment

### 1. Clone Repository and Setup Environment

**On the VM, run:**

```bash
# Clone repository
cd ~
git clone https://github.com/2dots1line/2dots1line.git 2D1L
cd 2D1L
git checkout compute-engine-deployment

# Make deployment script executable
chmod +x deploy-app.sh

# Run deployment script
./deploy-app.sh
```

**What this script does:**
- Fetches secrets from Google Secret Manager
- Creates production `.env` file
- Installs dependencies with `pnpm install`
- Builds the monorepo with `pnpm build`
- Starts Docker Compose services (databases)
- Starts PM2 services (API Gateway + 11 workers)
- Starts Next.js frontend in production mode
- Sets up systemd services for auto-start

### 2. Manual Deployment (Alternative)

If the automated script fails, run these commands manually:

```bash
# 1. Fetch secrets and create .env
gcloud secrets versions access latest --secret="2d1l-env" > .env

# 2. Install dependencies
pnpm install

# 3. Build application
pnpm build

# 4. Start Docker services
docker-compose -f docker-compose.dev.yml up -d

# 5. Start PM2 services
pm2 start ecosystem.config.js

# 6. Start frontend
cd apps/web-app
pnpm start &
cd ../..

# 7. Setup systemd services
sudo cp 2d1l-docker.service /etc/systemd/system/
sudo systemctl enable 2d1l-docker.service
sudo systemctl start 2d1l-docker.service
```

## Service Management

### 1. Check Service Status

```bash
# Check PM2 processes
pm2 status

# Check Docker containers
docker ps

# Check systemd services
sudo systemctl status 2d1l-docker.service
```

### 2. Start/Stop Services

```bash
# Start all services
pm2 start all
docker-compose -f docker-compose.dev.yml up -d

# Stop all services
pm2 stop all
docker-compose -f docker-compose.dev.yml down

# Restart all services
pm2 restart all
docker-compose -f docker-compose.dev.yml restart
```

### 3. View Logs

```bash
# PM2 logs
pm2 logs api-gateway --lines 50
pm2 logs ingestion-worker --lines 50
pm2 logs all --lines 20

# Docker logs
docker logs postgres-2d1l --tail 50
docker logs neo4j-2d1l --tail 50
docker logs weaviate-2d1l --tail 50
docker logs redis-2d1l --tail 50
docker logs dimension-reducer --tail 50

# System logs
sudo journalctl -u 2d1l-docker.service -f
```

## Database Management

### 1. Database Schema Setup

**If databases are empty (first deployment):**

```bash
# Create PostgreSQL schema
cd packages/database
DATABASE_URL='postgresql://postgres:password123@localhost:5433/twodots1line' npx prisma db push
cd ../..

# Verify tables created
docker exec postgres-2d1l psql -U postgres -d twodots1line -c '\dt'
```

### 2. Database Health Checks

```bash
# PostgreSQL health
docker exec postgres-2d1l pg_isready -U postgres -d twodots1line

# Neo4j health
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "RETURN 1;"

# Weaviate health
curl -s "http://localhost:8080/v1/meta" | jq '.version'

# Redis health
docker exec redis-2d1l redis-cli ping
```

### 3. Database Queries

**PostgreSQL:**
```bash
# Check users table
docker exec postgres-2d1l psql -U postgres -d twodots1line -c "SELECT user_id, email, created_at FROM users ORDER BY created_at DESC LIMIT 5;"

# Check concepts table
docker exec postgres-2d1l psql -U postgres -d twodots1line -c "SELECT concept_id, name, description FROM concepts ORDER BY created_at DESC LIMIT 5;"

# Check memory units
docker exec postgres-2d1l psql -U postgres -d twodots1line -c "SELECT muid, title, content FROM memory_units ORDER BY created_at DESC LIMIT 5;"
```

**Neo4j:**
```bash
# Check all nodes
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "MATCH (n) RETURN labels(n)[0] as type, count(n) as count ORDER BY count DESC;"

# Check specific entity
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "MATCH (n) WHERE n.id = 'YOUR_ENTITY_ID' RETURN n.id, n.name, n.title, labels(n);"

# Check relationships
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "MATCH (n)-[r]->(m) RETURN type(r) as relationship_type, count(r) as count ORDER BY count DESC;"
```

**Weaviate:**
```bash
# Check schema
curl -s "http://localhost:8080/v1/schema" | jq '.classes[] | .class'

# Check objects
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=5" | jq '.objects[] | {id: .id, properties: .properties}'

# Search by entity_id
curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d '{"query": "{ Get { UserKnowledgeItem(where: { path: [\"entity_id\"], operator: Equal, valueString: \"YOUR_ENTITY_ID\" }) { _additional { id }, entity_id, title, entity_type } } }"}' | jq '.data.Get.UserKnowledgeItem[]'
```

## Health Checks and Monitoring

### 1. Application Health Checks

```bash
# API Gateway health
curl -s http://localhost:3001/api/v1/health | jq '.'

# Frontend health
curl -s -I http://localhost:3000 | head -3

# External access test
curl -s http://34.67.68.212:3001/api/v1/health | jq '.'
curl -s -I http://34.67.68.212:3000 | head -3
```

### 2. System Resource Monitoring

```bash
# CPU and memory usage
htop
# or
top

# Disk usage
df -h

# Network connections
netstat -tulpn | grep -E ":(3000|3001|5433|6379|7474|7687|8080)"

# Process monitoring
ps aux | grep -E "(node|docker)" | head -10
```

### 3. Automated Health Check Script

```bash
# Run health check script
chmod +x health-check.sh
./health-check.sh
```

**What the health check does:**
- Tests API Gateway connectivity
- Tests frontend accessibility
- Checks Docker container status
- Monitors PM2 process health
- Restarts failed services automatically
- Logs results to `/var/log/2d1l-health-check.log`

## Troubleshooting

### 1. Common Issues

**Issue: "Registration failed" or database errors**
```bash
# Check if database schema exists
docker exec postgres-2d1l psql -U postgres -d twodots1line -c '\dt'

# If no tables, create schema
cd packages/database
DATABASE_URL='postgresql://postgres:password123@localhost:5433/twodots1line' npx prisma db push
cd ../..
```

**Issue: CORS errors or "Login failed" - Frontend trying to reach localhost**
```bash
# Check current environment variables
grep -E '(NEXT_PUBLIC_API_BASE_URL|FRONTEND_URL)' .env

# If URLs point to localhost instead of VM IP, update them
VM_IP=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google")
sed -i "s|NEXT_PUBLIC_API_BASE_URL=.*|NEXT_PUBLIC_API_BASE_URL=http://$VM_IP:3001|g" .env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://$VM_IP:3000|g" .env

# IMPORTANT: Rebuild frontend to pick up new environment variables
pm2 stop web-app
cd apps/web-app && pnpm build && cd ../..
pm2 start web-app
```

**Issue: Services not starting**
```bash
# Check PM2 status
pm2 status

# Check Docker containers
docker ps -a

# Restart services
pm2 restart all
docker-compose -f docker-compose.dev.yml restart
```

**Issue: External access not working**
```bash
# Check firewall rules
gcloud compute firewall-rules list --filter="name~twodots"

# Check if services are listening
netstat -tulpn | grep -E ":(3000|3001)"

# Test local connectivity first
curl -s http://localhost:3001/api/v1/health
```

**Issue: Out of memory**
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Restart services to free memory
pm2 restart all
docker-compose -f docker-compose.dev.yml restart
```

### 2. Log Analysis

```bash
# Check PM2 logs for errors
pm2 logs --err --lines 100

# Check Docker logs
docker logs postgres-2d1l --tail 100 | grep -i error
docker logs neo4j-2d1l --tail 100 | grep -i error
docker logs weaviate-2d1l --tail 100 | grep -i error

# Check system logs
sudo journalctl -u 2d1l-docker.service --since "1 hour ago"
```

### 3. Database Recovery

**If databases are corrupted:**
```bash
# Stop services
pm2 stop all
docker-compose -f docker-compose.dev.yml down

# Remove data volumes (WARNING: This deletes all data)
sudo rm -rf postgres_data neo4j_data weaviate_data redis_data

# Restart services
docker-compose -f docker-compose.dev.yml up -d

# Recreate schema
cd packages/database
DATABASE_URL='postgresql://postgres:password123@localhost:5433/twodots1line' npx prisma db push
cd ../..

# Restart PM2 services
pm2 start ecosystem.config.js
```

## Maintenance and Updates

### 1. Application Updates

```bash
# Pull latest changes
git pull origin compute-engine-deployment

# Rebuild application
pnpm build

# Restart services
pm2 restart all
```

### 2. System Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.dev.yml pull
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Backup and Restore

**Create backup:**
```bash
# Create backup directory
mkdir -p ~/backups/$(date +%Y%m%d)

# Backup PostgreSQL
docker exec postgres-2d1l pg_dump -U postgres twodots1line > ~/backups/$(date +%Y%m%d)/postgres_backup.sql

# Backup Neo4j
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "CALL apoc.export.cypher.all('/tmp/neo4j_backup.cypher', {format: 'cypher-shell'});"
docker cp neo4j-2d1l:/tmp/neo4j_backup.cypher ~/backups/$(date +%Y%m%d)/

# Backup Weaviate
curl -s "http://localhost:8080/v1/backups/filesystem" -X POST -H "Content-Type: application/json" -d '{"id": "backup-'$(date +%Y%m%d)'", "include": ["UserKnowledgeItem", "UserMemory"]}'
```

**Restore from backup:**
```bash
# Restore PostgreSQL
docker exec -i postgres-2d1l psql -U postgres twodots1line < ~/backups/YYYYMMDD/postgres_backup.sql

# Restore Neo4j
docker cp ~/backups/YYYYMMDD/neo4j_backup.cypher neo4j-2d1l:/tmp/
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "CALL apoc.import.cypher('/tmp/neo4j_backup.cypher');"
```

### 4. Performance Optimization

```bash
# Monitor resource usage
htop
iostat -x 1

# Optimize PM2 memory usage
pm2 restart all --update-env

# Clean up Docker resources
docker system prune -f
docker volume prune -f
```

## Quick Reference Commands

### Essential Commands
```bash
# SSH into VM
gcloud compute ssh twodots-vm --zone=us-central1-a

# Check all services
pm2 status && docker ps

# View logs
pm2 logs --lines 50
docker logs postgres-2d1l --tail 50

# Restart everything
pm2 restart all && docker-compose -f docker-compose.dev.yml restart

# Health check
curl -s http://localhost:3001/api/v1/health | jq '.'
curl -s -I http://localhost:3000 | head -3
```

### Database Commands
```bash
# PostgreSQL
docker exec postgres-2d1l psql -U postgres -d twodots1line -c "SELECT count(*) FROM users;"

# Neo4j
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "MATCH (n) RETURN count(n);"

# Weaviate
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=1" | jq '.objects | length'
```

### Access URLs
- **Frontend**: http://34.67.68.212:3000
- **API Gateway**: http://34.67.68.212:3001
- **API Health**: http://34.67.68.212:3001/api/v1/health
- **Neo4j Browser**: http://34.67.68.212:7474 (neo4j/password123)
- **Weaviate**: http://34.67.68.212:8080

## Cost Management

### Current Setup Cost
- **VM (e2-standard-4)**: ~$48.54/month
- **100GB SSD**: ~$4/month
- **Network egress**: ~$1-5/month
- **Total**: ~$53-58/month

### Cost Optimization Tips
```bash
# Stop VM when not in use
gcloud compute instances stop twodots-vm --zone=us-central1-a

# Start VM when needed
gcloud compute instances start twodots-vm --zone=us-central1-a

# Check current costs
gcloud billing budgets list --billing-account=YOUR_BILLING_ACCOUNT
```

This guide provides comprehensive instructions for managing your 2D1L application on Google Cloud VM. Keep this document updated as your setup evolves.
