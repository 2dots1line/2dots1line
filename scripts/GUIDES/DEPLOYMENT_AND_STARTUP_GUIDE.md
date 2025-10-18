# 2D1L Deployment and Startup Guide

## Overview

This guide provides comprehensive instructions for deploying and managing the 2D1L application across different environments (local development and VM production). It covers first-time setup, daily workflows, troubleshooting, and maintenance procedures.

## Table of Contents

1. [First-Time Setup](#first-time-setup)
2. [Environment Configurations](#environment-configurations)
3. [Daily Development Workflow](#daily-development-workflow)
4. [Deployment Workflows](#deployment-workflows)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Maintenance Procedures](#maintenance-procedures)

---

## First-Time Setup

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- PM2 (installed globally: `npm install -g pm2`)
- Git access to the repository
- Google Cloud SDK (for VM deployment)

### Local Development Setup

#### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd 2D1L

# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter=@2dots1line/database db:generate
```

#### 2. Environment Configuration

```bash
# Create .env file for local development
# Edit environment variables for local development
# Key variables to set:
# - FRONTEND_URL=http://localhost:3000
# - NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
# - Database connection strings for local Docker services
```

#### 3. Start Database Services

```bash
# Start all database services (PostgreSQL, Neo4j, Weaviate, Redis)
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker ps
```

#### 4. Build and Start Application

```bash
# Build all packages
pnpm build

# Start in development mode (recommended for local development)
pnpm start:dev
```

### VM Production Setup

#### 1. VM Initial Setup

```bash
# SSH into VM
gcloud compute ssh twodots-vm --zone=us-central1-a

# Clone repository
git clone <repository-url>
cd 2D1L

# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter=@2dots1line/database db:generate
```

#### 2. VM Environment Configuration

```bash
# Edit environment variables for VM production
# Key variables to set:
# - FRONTEND_URL=http://34.136.210.47:3000
# - NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001
# - Database connection strings for VM Docker services
```

#### 3. Start VM Services

```bash
# Start database services
docker-compose -f docker-compose.dev.yml up -d

# Build and start in production mode
pnpm build
pnpm start:prod
```

---

## Environment Configurations

### Ecosystem Configurations

The project uses three different PM2 ecosystem configurations:

#### 1. `scripts/deployment/ecosystem.config.js` (Original Full Configuration)
- **Use for:** VM deployment with all services
- **Services:** API Gateway + All Workers + Web App
- **Environment:** Production

#### 2. `scripts/deployment/ecosystem.dev.config.js` (Development Configuration)
- **Use for:** Local development
- **Services:** API Gateway + Web App (dev mode with hot reload)
- **Environment:** Development with file watching

#### 3. `scripts/deployment/ecosystem.prod.config.js` (Production Configuration)
- **Use for:** VM production deployment
- **Services:** API Gateway + All Workers + Web App (production mode)
- **Environment:** Production

### Environment Variables

#### Local Development (.env)
```bash
# Frontend Configuration
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Database URLs (local Docker)
DATABASE_URL=postgresql://danniwang:MaxJax2023@@localhost:5433/twodots1line
NEO4J_URI=neo4j://localhost:7688
WEAVIATE_URL=http://localhost:8080
REDIS_URL=redis://localhost:6379

# API Keys
GOOGLE_API_KEY=your_google_api_key
PEXELS_API_KEY=your_pexels_api_key
```

#### VM Production (.env)
```bash
# Frontend Configuration
FRONTEND_URL=http://34.136.210.47:3000
NEXT_PUBLIC_API_BASE_URL=http://34.136.210.47:3001

# Database URLs (VM Docker)
DATABASE_URL=postgresql://postgres:password@localhost:5433/twodots1line
NEO4J_URI=neo4j://localhost:7688
WEAVIATE_URL=http://localhost:8080
REDIS_URL=redis://localhost:6379

# API Keys (same as local)
GOOGLE_API_KEY=your_google_api_key
PEXELS_API_KEY=your_pexels_api_key
```

---

## Daily Development Workflow

### Local Development

#### Starting Your Development Session

```bash
# 1. Start database services
pnpm start:db

# 2. Start application in development mode
pnpm start:dev

# 3. Verify everything is running
pnpm status
```

#### Making Changes

```bash
# 1. Make your code changes
# 2. Hot reload will automatically restart the web-app
# 3. For backend changes, restart specific services:
pm2 restart api-gateway
```

#### Stopping Development

```bash
# Stop all services
pnpm stop:services

# Stop database services
pnpm stop:db
```

### VM Production

#### Starting Production Services

```bash
# SSH into VM
gcloud compute ssh twodots-vm --zone=us-central1-a

# Start all services
cd ~/2D1L
pnpm start:prod

# Verify services
pm2 status
```

#### Stopping Production Services

```bash
# Stop all PM2 processes
pm2 stop all

# Or stop specific services
pm2 stop web-app
pm2 stop api-gateway
```

---

## Deployment Workflows

### Pushing Changes to VM

#### 1. Local Development → Git

```bash
# 1. Commit your changes
git add .
git commit -m "feat: your feature description"

# 2. Push to repository
git push origin compute-engine-deployment
```

#### 2. Git → VM Deployment

```bash
# 1. SSH into VM
gcloud compute ssh twodots-vm --zone=us-central1-a

# 2. Pull latest changes
cd ~/2D1L
git pull origin compute-engine-deployment

# 3. Install any new dependencies
pnpm install

# 4. Rebuild if necessary
pnpm build

# 5. Restart services
pm2 restart all
```

### Automated Deployment Script

Create a deployment script for easier VM updates:

```bash
#!/bin/bash
# deploy-to-vm.sh

echo "🚀 Deploying to VM..."

# Pull latest changes
git pull origin compute-engine-deployment

# Install dependencies
pnpm install

# Build application
pnpm build

# Restart services
pm2 restart all

echo "✅ Deployment complete!"
```

### Environment-Specific Deployments

#### Development Deployment
```bash
# Local development
pnpm start:dev

# VM development (if needed)
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 start ecosystem.dev.config.js"
```

#### Production Deployment
```bash
# VM production
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 start ecosystem.prod.config.js"
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Port Conflicts

**Problem:** "EADDRINUSE: address already in use :::3000"

**Solution:**
```bash
# Find processes using port 3000
lsof -ti:3000

# Kill the process
kill -9 <process-id>

# Or kill all Next.js processes
pkill -f next

# Restart PM2 services
pm2 restart web-app
```

#### 2. "Verifying your session..." Hanging

**Problem:** Web-app shows "Verifying your session..." indefinitely

**Root Causes:**
- Browser localStorage corruption
- Zustand persist middleware failures
- Production build hydration mismatches
- Network timeouts in authentication

**Solutions (in order of effectiveness):**

```bash
# 1. Clear browser storage
# Visit: http://localhost:3000/clear-storage.html
# Or manually clear localStorage in browser dev tools

# 2. Restart web-app
pm2 restart web-app

# 3. Complete reset (most effective)
pkill -f next && sleep 2 && pnpm build && pm2 restart web-app

# 4. Check environment variables
pm2 env <web-app-process-id>
```

#### 3. Database Connection Issues

**Problem:** Services can't connect to databases

**Solution:**
```bash
# Check if Docker services are running
docker ps

# Restart database services
docker-compose -f docker-compose.dev.yml restart

# Check database connectivity
curl -s http://localhost:3001/api/v1/health
```

#### 4. Authentication Errors

**Problem:** "User not found" or login failures

**Common Causes:**
- Incorrect API base URL configuration
- Database connection issues
- Missing environment variables
- CORS configuration problems

**Solutions:**
```bash
# 1. Verify API Gateway is running
curl -s http://localhost:3001/api/v1/health

# 2. Check environment variables
pm2 env <api-gateway-process-id>

# 3. Verify database connectivity
# Check logs for database connection errors
pm2 logs api-gateway

# 4. Test with development user
# Use: dev-user-123 / dev-token for testing
```

#### 5. Build Failures

**Problem:** `pnpm build` fails

**Solutions:**
```bash
# 1. Clean and rebuild
pnpm clean
pnpm build

# 2. Clean install
pnpm clean-install

# 3. Check for TypeScript errors
pnpm lint

# 4. Verify all dependencies are installed
pnpm install
```

#### 6. PM2 Process Management Issues

**Problem:** PM2 processes not starting or crashing

**Solutions:**
```bash
# 1. Check PM2 status
pm2 status

# 2. View logs
pm2 logs <process-name>

# 3. Restart specific process
pm2 restart <process-name>

# 4. Delete and restart all
pm2 delete all
pm2 start scripts/deployment/ecosystem.config.js

# 5. Check system resources
pm2 monit
```

### Diagnostic Commands

#### Health Checks
```bash
# Check all services
pm2 status

# Check web-app accessibility
curl -s http://localhost:3000 | head -5

# Check API Gateway
curl -s http://localhost:3001/api/v1/health

# Check database services
docker ps

# Check port usage
lsof -ti:3000
lsof -ti:3001
```

#### Log Analysis
```bash
# View all logs
pm2 logs

# View specific service logs
pm2 logs web-app --lines 50
pm2 logs api-gateway --lines 50

# Follow logs in real-time
pm2 logs --follow
```

#### Environment Verification
```bash
# Check environment variables for specific process
pm2 env <process-id>

# Verify environment loading
pm2 logs | grep "Environment loaded"
```

---

## Maintenance Procedures

### Regular Maintenance

#### Daily Checks
```bash
# Check service status
pm2 status

# Check system resources
pm2 monit

# Check logs for errors
pm2 logs --lines 100 | grep -i error
```

#### Weekly Maintenance
```bash
# Update dependencies
pnpm update

# Clean build artifacts
pnpm clean

# Rebuild and restart
pnpm build
pm2 restart all
```

#### Monthly Maintenance
```bash
# Full system restart
pm2 delete all
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
pnpm build
pm2 start scripts/deployment/ecosystem.config.js
```

### Backup Procedures

#### Database Backups
```bash
# PostgreSQL backup
docker exec postgres-2d1l pg_dump -U postgres twodots1line > backup_$(date +%Y%m%d).sql

# Neo4j backup
docker exec neo4j-2d1l neo4j-admin dump --database=neo4j --to=/tmp/backup.dump
```

#### Configuration Backups
```bash
# Backup environment files
cp .env .env.backup.$(date +%Y%m%d)

# Backup PM2 configuration
pm2 save
```

### Performance Monitoring

#### Resource Monitoring
```bash
# Monitor system resources
pm2 monit

# Check memory usage
pm2 list

# Monitor logs for performance issues
pm2 logs | grep -i "memory\|cpu\|slow"
```

#### Database Performance
```bash
# Check database connections
docker exec postgres-2d1l psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Check Redis memory usage
docker exec redis-2d1l redis-cli info memory
```

---

## Quick Reference Commands

### Local Development
```bash
# Start development environment
pnpm start:dev

# Stop all services
pnpm stop:services

# Restart web-app only
pm2 restart web-app

# View logs
pm2 logs web-app
```

### VM Production
```bash
# Deploy to VM
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && git pull && pnpm build && pm2 restart all"

# Check VM status
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 status"

# View VM logs
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 logs web-app --lines 20"
```

## **Branch Switching & Data Migration**

### **Switching Branches on VM**

#### **Option 1: Switch Branch on Existing Clone (Recommended)**

```bash
# SSH into VM
gcloud compute ssh twodots-vm --zone=us-central1-a

# Navigate to project directory
cd ~/2D1L

# Stop services to avoid conflicts
pm2 stop all

# Switch to new branch
git fetch origin
git checkout <new-branch-name>
git pull origin <new-branch-name>

# Install any new dependencies
pnpm install

# Rebuild if necessary
pnpm build

# Restart services
pm2 start scripts/deployment/ecosystem.config.js
```

#### **Option 2: Automated Branch Switch**

```bash
# Use the provided script for automated branch switching
./scripts/migration/switch-vm-branch.sh <branch-name>

# Example:
./scripts/migration/switch-vm-branch.sh feature/new-feature
```

### **Data Migration**

#### **Export Local Data**

```bash
# Export all local data for VM migration
./scripts/migration/export-local-data.sh

# This creates a timestamped backup directory with:
# - PostgreSQL dump
# - Neo4j dump
# - Weaviate schema and data
# - Application files (uploads, covers, videos)
# - Configuration files
```

#### **Import Data to VM**

```bash
# Import exported data to VM
./scripts/migration/import-to-vm.sh backup_20241018_143022

# This will:
# - Upload backup to VM
# - Import all database data
# - Copy application files
# - Update configuration
```

#### **Manual Data Migration**

```bash
# PostgreSQL
docker exec postgres-2d1l pg_dump -U postgres twodots1line > backup.sql
gcloud compute scp backup.sql twodots-vm:~/ --zone=us-central1-a
gcloud compute ssh twodots-vm --zone=us-central1-a --command="docker exec -i postgres-2d1l psql -U postgres twodots1line < ~/backup.sql"

# Neo4j
docker exec neo4j-2d1l neo4j-admin dump --database=neo4j --to=/tmp/backup.dump
docker cp $(docker ps -q -f name=neo4j-2d1l):/tmp/backup.dump ./backup.dump
gcloud compute scp backup.dump twodots-vm:~/ --zone=us-central1-a

# Application files
gcloud compute scp --recurse ./apps/web-app/public/uploads twodots-vm:~/2D1L/apps/web-app/public/ --zone=us-central1-a
```

### Troubleshooting
```bash
# Quick health check
curl -s http://localhost:3000 && curl -s http://localhost:3001/api/v1/health

# Free up port 3000
lsof -ti:3000 | xargs -r kill -9

# Complete reset
pkill -f next && sleep 2 && pnpm build && pm2 restart web-app
```

---

## Environment-Specific Notes

### Local Development
- Use `ecosystem.dev.config.js` for hot reload
- Database services run in Docker containers
- Web-app runs in development mode with file watching
- API Gateway runs in cluster mode for performance

### VM Production
- Use `ecosystem.prod.config.js` for production deployment
- All services run in production mode
- Database services run in Docker containers
- PM2 provides process management and auto-restart

### Security Considerations
- Never commit `.env` files to git
- Use different API keys for different environments
- Regularly rotate API keys and secrets
- Monitor logs for security issues

---

This guide provides a comprehensive framework for managing the 2D1L application across different environments. Keep it updated as the system evolves and new procedures are established.
