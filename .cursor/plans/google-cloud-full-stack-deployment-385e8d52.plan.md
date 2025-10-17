<!-- 385e8d52-24ad-4403-ad66-6a1dd1ab3d59 3d8614d5-c2b0-44d3-8088-608e6025ef28 -->
# Complete Google Cloud Compute Engine Deployment Plan

## Architecture Overview

**Single VM running:**

- Docker Compose: PostgreSQL, Neo4j, Weaviate, Redis, Python Dimension Reducer (5 containers)
- PM2: API Gateway + 11 workers (12 Node.js processes)
- Next.js: Frontend (production build served by PM2 or standalone)

**Cost:** ~$53/month (e2-standard-4: 4 vCPU, 16GB RAM, 100GB SSD)

---

## Phase 1: Create and Configure Compute Engine VM

### 1.1 Create VM Instance

- **Machine type:** e2-standard-4 (4 vCPU, 16GB RAM)
- **Boot disk:** 100GB SSD, Ubuntu 22.04 LTS
- **Region:** us-central1-a (same as existing resources)
- **Firewall:** Allow HTTP (80), HTTPS (443), Custom TCP (3000, 3001)
- **Network tags:** `2d1l-server`

### 1.2 Configure Firewall Rules

Create firewall rules for:

- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 3000 (Next.js frontend)
- Port 3001 (API Gateway)

---

## Phase 2: Install Dependencies on VM

### 2.1 System Updates & Essential Tools

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y git curl wget unzip build-essential
```

### 2.2 Install Node.js 18+ & pnpm

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm@8.14.1
npm install -g pm2
pm2 startup systemd
```

### 2.3 Install Docker & Docker Compose

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2.4 Install Google Cloud CLI

```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

---

## Phase 3: Clone and Build Application

### 3.1 Clone Repository

```bash
cd ~
git clone <repository-url> 2D1L
cd 2D1L
git checkout next-horizon
```

### 3.2 Fetch Secrets from Secret Manager

```bash
# Fetch secrets and write to .env
gcloud secrets versions access latest --secret="JWT_SECRET" > .env.tmp
gcloud secrets versions access latest --secret="POSTGRES_PASSWORD" >> .env.tmp
gcloud secrets versions access latest --secret="GOOGLE_API_KEY" >> .env.tmp
gcloud secrets versions access latest --secret="PEXELS_API_KEY" >> .env.tmp
```

### 3.3 Create Production .env File

Create `.env` with:

- Database connections (localhost for Docker services)
- Secret Manager values
- Production-specific variables (NODE_ENV=production)
- Frontend/backend URLs using VM's external IP

Key differences from local:

```bash
# Databases (localhost since Docker runs on same VM)
DATABASE_URL=postgresql://postgres:[PASSWORD]@localhost:5433/twodots1line
REDIS_URL=redis://localhost:6379
NEO4J_URI=bolt://localhost:7688
WEAVIATE_URL=http://localhost:8080

# Application URLs (use VM external IP)
FRONTEND_URL=http://[VM_EXTERNAL_IP]:3000
NOTIFICATION_SERVICE_URL=http://localhost:3002
NEXT_PUBLIC_API_BASE_URL=http://[VM_EXTERNAL_IP]:3001

# Environment
NODE_ENV=production
```

### 3.4 Install Dependencies & Build

```bash
pnpm setup
pnpm build
```

---

## Phase 4: Start Services

### 4.1 Start Database Containers

```bash
docker-compose -f docker-compose.dev.yml up -d
docker ps  # Verify all 5 containers running
```

### 4.2 Verify Database Connections

```bash
# PostgreSQL
docker exec -it postgres-2d1l psql -U postgres -d twodots1line -c "SELECT 1;"

# Redis
docker exec -it redis-2d1l redis-cli ping

# Neo4j
curl http://localhost:7474

# Weaviate
curl http://localhost:8080/v1/.well-known/ready
```

### 4.3 Start PM2 Services

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 status
```

### 4.4 Start Frontend (Production Mode)

```bash
cd apps/web-app
pnpm build
pnpm start &
```

---

## Phase 5: Configure Monitoring & Auto-Start

### 5.1 Configure PM2 to Start on Boot

```bash
pm2 startup systemd
# Follow the output command to enable systemd startup
pm2 save
```

### 5.2 Create Systemd Service for Docker Compose

Create `/etc/systemd/system/2d1l-docker.service`:

```ini
[Unit]
Description=2D1L Docker Compose Services
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/[USER]/2D1L
ExecStart=/usr/bin/docker-compose -f docker-compose.dev.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.dev.yml down
User=[USER]

[Install]
WantedBy=multi-user.target
```

Enable service:

```bash
sudo systemctl enable 2d1l-docker.service
sudo systemctl start 2d1l-docker.service
```

### 5.3 Setup Log Rotation

Create `/etc/logrotate.d/2d1l`:

```
/home/[USER]/2D1L/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
```

---

## Phase 6: Configure External Access

### 6.1 Get VM External IP

```bash
gcloud compute instances describe 2d1l-vm --zone=us-central1-a --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

### 6.2 Update Environment Variables

Update `.env` with actual external IP:

```bash
FRONTEND_URL=http://[EXTERNAL_IP]:3000
NEXT_PUBLIC_API_BASE_URL=http://[EXTERNAL_IP]:3001
```

Restart services:

```bash
pm2 restart all
cd apps/web-app && pnpm build && pm2 restart web-app
```

### 6.3 Test External Access

```bash
# From your local machine:
curl http://[EXTERNAL_IP]:3001/api/v1/health
curl http://[EXTERNAL_IP]:3000
```

---

## Phase 7: Optimization & Hardening

### 7.1 Configure Firewall for Internal Services

```bash
# Restrict direct database access (only accessible from VM)
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # Frontend
sudo ufw allow 3001  # API Gateway
```

### 7.2 Setup Cloud Logging (Optional but Recommended)

Install logging agent:

```bash
curl -sSO https://dl.google.com/cloudagents/add-logging-agent-repo.sh
sudo bash add-logging-agent-repo.sh --also-install
```

Configure to ship PM2 logs to Cloud Logging.

### 7.3 Setup Health Check Monitoring

Create simple health check script at `/home/[USER]/health-check.sh`:

```bash
#!/bin/bash
curl -f http://localhost:3001/api/v1/health || pm2 restart api-gateway
```

Add to crontab (every 5 minutes):

```bash
*/5 * * * * /home/[USER]/health-check.sh
```

---

## Phase 8: Verification & Testing

### 8.1 Service Health Checks

```bash
# PM2 status
pm2 status

# Docker containers
docker ps

# API Gateway
curl http://localhost:3001/api/v1/health

# Frontend
curl http://localhost:3000
```

### 8.2 Database Connectivity

```bash
# From inside VM
curl http://localhost:7474  # Neo4j
curl http://localhost:8080/v1/.well-known/ready  # Weaviate
docker exec redis-2d1l redis-cli ping  # Redis
```

### 8.3 External Access Test

From local machine, test:

- Frontend: `http://[EXTERNAL_IP]:3000`
- API: `http://[EXTERNAL_IP]:3001/api/v1/health`

---

## Files to Create/Modify

### New Files

1. `deploy-vm.sh` - Automated deployment script
2. `/etc/systemd/system/2d1l-docker.service` - Docker auto-start
3. `/etc/logrotate.d/2d1l` - Log rotation config
4. `/home/[USER]/health-check.sh` - Health monitoring

### Modified Files

1. `.env` - Production environment variables with VM IP
2. `GOOGLE_CLOUD_SETUP_LOG.md` - Add VM details

---

## Rollback Plan

If deployment fails:

1. Stop all services: `pm2 delete all && docker-compose -f docker-compose.dev.yml down`
2. Check logs: `pm2 logs` and `docker-compose logs`
3. Fix issues and restart
4. VM snapshot can be created before deployment for quick rollback

---

## Cost Breakdown

- **VM (e2-standard-4):** $48.54/month
- **100GB SSD:** $4/month
- **Network egress:** ~$1-5/month (minimal with low traffic)
- **Total:** ~$53-58/month

**Note:** This replaces the previously planned Cloud SQL ($25-50/month) and Valkey ($46/month) by using containerized databases on the VM.

---

## Next Steps After Deployment

1. Setup domain and SSL certificates (Let's Encrypt)
2. Configure Nginx reverse proxy for proper HTTPS
3. Setup automated backups for database volumes
4. Configure Cloud Monitoring alerts
5. Implement rate limiting and security hardening

### To-dos

- [ ] Create Compute Engine VM (e2-standard-4, Ubuntu 22.04, 100GB SSD)
- [ ] Install Node.js, pnpm, PM2, Docker, Docker Compose, gcloud CLI
- [ ] Clone repo, fetch secrets from Secret Manager, create production .env, build monorepo
- [ ] Start Docker Compose services and verify all database connections
- [ ] Start PM2 services (API Gateway + 11 workers) and frontend
- [ ] Setup systemd services for auto-start on boot (PM2 + Docker)
- [ ] Setup firewall rules for external access (ports 80, 443, 3000, 3001)
- [ ] Update .env with VM external IP and restart services
- [ ] Test all services locally and externally, verify health checks
- [ ] Configure Cloud Logging and health check monitoring