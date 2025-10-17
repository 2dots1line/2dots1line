# 2D1L Compute Engine Deployment Guide

This guide provides step-by-step instructions for deploying the 2D1L monorepo to Google Cloud Compute Engine using a single VM that mirrors your local development environment.

## Architecture Overview

**Single VM running:**
- **Docker Compose**: PostgreSQL, Neo4j, Weaviate, Redis, Python Dimension Reducer (5 containers)
- **PM2**: API Gateway + 11 workers (12 Node.js processes)
- **Next.js**: Frontend (production build)

**Cost**: ~$53/month (e2-standard-4: 4 vCPU, 16GB RAM, 100GB SSD)

## Prerequisites

1. **Google Cloud Project**: `d1l-460112` (already set up)
2. **APIs Enabled**: Cloud SQL, Memorystore, Secret Manager, Cloud Build, Artifact Registry
3. **Secrets in Secret Manager**: JWT_SECRET, POSTGRES_PASSWORD, GOOGLE_API_KEY, PEXELS_API_KEY
4. **gcloud CLI**: Installed and authenticated on your local machine

## Quick Start

### Step 1: Create VM and Firewall Rules

Run the VM deployment script from your local machine:

```bash
./deploy-vm.sh
```

This script will:
- Create a Compute Engine VM (e2-standard-4, Ubuntu 22.04, 100GB SSD)
- Install Node.js, pnpm, PM2, Docker, Docker Compose, gcloud CLI
- Create firewall rules for ports 80, 443, 3000, 3001
- Display the VM's external IP

### Step 2: Deploy Application

SSH into the VM and run the application deployment script:

```bash
# SSH into the VM
gcloud compute ssh 2d1l-vm --zone=us-central1-a

# On the VM, run the deployment script
./deploy-app.sh
```

This script will:
- Clone your repository
- Fetch secrets from Secret Manager
- Create production `.env` file
- Install dependencies and build the monorepo
- Start Docker services (databases)
- Start PM2 services (API Gateway + workers)
- Start frontend in production mode
- Configure auto-start services
- Setup health monitoring

### Step 3: Verify Deployment

After deployment, test the services:

```bash
# Check PM2 processes
pm2 status

# Check Docker containers
docker ps

# Test API Gateway
curl http://localhost:3001/api/v1/health

# Test frontend
curl http://localhost:3000
```

Access your application via the VM's external IP:
- **Frontend**: `http://[VM_IP]:3000`
- **API Gateway**: `http://[VM_IP]:3001`
- **Neo4j Browser**: `http://[VM_IP]:7474`
- **Weaviate**: `http://[VM_IP]:8080`

**IMPORTANT**: The most important verification is to **create a new user account** via the sign-up page and test the login and chat functionality. The commands above only verify that the services are running, not that they are working together correctly. See the "Post-Deployment Verification" section below for more detailed checks.

## Post-Deployment Verification (Data Consistency)

After creating a new user (e.g., `test@example.com`), you can use these commands on the VM to verify that the data has been correctly written to the databases, adapting them from the `DATA_CONSISTENCY_CHECK_GUIDE.md`.

### 1. PostgreSQL Check

Verify the user exists in the `users` table. You will need to replace `[YOUR_POSTGRES_USER]` and `[YOUR_POSTGRES_DB]` with the values from your `.env` file.

```bash
docker exec postgres-2d1l psql -U [YOUR_POSTGRES_USER] -d [YOUR_POSTGRES_DB] -c "SELECT user_id, email, created_at FROM users WHERE email = 'test@example.com';"
```

### 2. Neo4j Check

Verify the corresponding `User` node was created in the graph. Replace `[YOUR_NEO4J_PASSWORD]` with the value from your `.env` file.

```bash
docker exec neo4j-2d1l cypher-shell -u neo4j -p [YOUR_NEO4J_PASSWORD] "MATCH (n:User {email: 'test@example.com'}) RETURN n.user_id, n.email, n.created_at;"
```

### 3. Weaviate Check

After the new user has a conversation, you can verify that `UserKnowledgeItem` objects are being created for them.

```bash
# First, get the user_id from PostgreSQL
USER_ID=$(docker exec postgres-2d1l psql -U [USER] -d [DB] -t -c "SELECT user_id FROM users WHERE email = 'test@example.com';" | xargs)

# Then, query Weaviate for items associated with that user_id
curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d "{\"query\": \"{ Get { UserKnowledgeItem(where: { path: [\\\"userId\\\"], operator: Equal, valueString: \\\"$USER_ID\\\" }) { _additional { id }, title, userId } } }\"}" | jq
```

## Manual Deployment Steps

If you prefer to run the commands manually:

### 1. Create VM

```bash
gcloud compute instances create 2d1l-vm \
    --zone=us-central1-a \
    --machine-type=e2-standard-4 \
    --boot-disk-size=100GB \
    --boot-disk-type=pd-ssd \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --tags=2d1l-server
```

### 2. Create Firewall Rules

```bash
# Allow HTTP
gcloud compute firewall-rules create allow-http-2d1l \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --target-tags 2d1l-server

# Allow HTTPS
gcloud compute firewall-rules create allow-https-2d1l \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --target-tags 2d1l-server

# Allow frontend
gcloud compute firewall-rules create allow-frontend-2d1l \
    --allow tcp:3000 \
    --source-ranges 0.0.0.0/0 \
    --target-tags 2d1l-server

# Allow API Gateway
gcloud compute firewall-rules create allow-api-2d1l \
    --allow tcp:3001 \
    --source-ranges 0.0.0.0/0 \
    --target-tags 2d1l-server
```

### 3. SSH and Install Dependencies

```bash
gcloud compute ssh 2d1l-vm --zone=us-central1-a
```

On the VM:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install essential tools
sudo apt-get install -y git curl wget unzip build-essential

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm and PM2
npm install -g pnpm@8.14.1
npm install -g pm2

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### 4. Clone and Build Application

```bash
# Clone repository
cd ~
git clone https://github.com/2dots1line/2dots1line.git 2D1L
cd 2D1L
git checkout compute-engine-deployment

# Fetch secrets and create .env
# (See deploy-app.sh for the complete .env template)

# Install dependencies and build
pnpm setup
pnpm build
```

### 4.5. Initialize Databases

**CRITICAL:** For a fresh deployment, the databases inside the Docker containers will be empty. You must initialize the PostgreSQL schema before starting the application services. This command is taken from `scripts/GUIDES/QUICK_CLEAN_START.md`.

```bash
# From the project root directory (e.g., /home/user/2D1L)
cd packages/database
pnpm prisma db push
cd ../..
```

### 5. Start Services

```bash
# Start Docker services
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
sleep 30

# Start PM2 services
pm2 start ecosystem.config.js
pm2 save

# Start frontend
cd apps/web-app
pnpm build
pm2 start "pnpm start" --name "web-app"
pm2 save
```

## Environment Configuration

The production `.env` file differs from local development in these key ways:

```bash
# Environment
NODE_ENV=production

# Database URLs (localhost since Docker runs on same VM)
DATABASE_URL=postgresql://postgres:[PASSWORD]@localhost:5433/twodots1line
REDIS_URL=redis://localhost:6379
NEO4J_URI=bolt://localhost:7688
WEAVIATE_URL=http://localhost:8080

# Application URLs (use VM external IP)
FRONTEND_URL=http://[VM_EXTERNAL_IP]:3000
NEXT_PUBLIC_API_BASE_URL=http://[VM_EXTERNAL_IP]:3001
NEXT_PUBLIC_WEAVIATE_URL=http://[VM_EXTERNAL_IP]:8080
```

## Auto-Start Configuration

### PM2 Startup

```bash
pm2 startup systemd
# Follow the command shown in the output
pm2 save
```

### Docker Compose Service

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

Enable the service:

```bash
sudo systemctl enable 2d1l-docker.service
sudo systemctl start 2d1l-docker.service
```

## Health Monitoring

### Health Check Script

The `health-check.sh` script monitors all services and restarts them if needed:

```bash
# Make executable
chmod +x health-check.sh

# Add to crontab (runs every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/$USER/health-check.sh") | crontab -
```

### Log Rotation

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

## Troubleshooting

### Common Issues

1. **Services not starting**: Check logs with `pm2 logs` and `docker-compose logs`
2. **Registration/Login Fails**: This is often because the database schema was not initialized. Make sure you ran the `pnpm prisma db push` command (see step 4.5) after starting the Docker containers for the first time.
3. **Database connection issues**: Verify Docker containers are running with `docker ps`
4. **Port conflicts**: Check if ports are already in use with `lsof -i :PORT`
5. **Permission issues**: Ensure user is in docker group with `groups $USER`

### Useful Commands

```bash
# Check PM2 status
pm2 status
pm2 logs

# Check Docker containers
docker ps
docker-compose logs

# Restart services
pm2 restart all
docker-compose -f docker-compose.dev.yml restart

# Check system resources
htop
df -h
free -h
```

### Log Locations

- **PM2 logs**: `/home/[USER]/2D1L/logs/`
- **Docker logs**: `docker-compose logs [service-name]`
- **System logs**: `/var/log/syslog`
- **Health check logs**: `/home/[USER]/2D1L/logs/health-check.log`

## Security Considerations

1. **Firewall**: Only necessary ports are exposed (80, 443, 3000, 3001)
2. **Secrets**: All sensitive data stored in Google Secret Manager
3. **Updates**: Regular system updates via `apt-get upgrade`
4. **Monitoring**: Health checks and log rotation configured

## Scaling

### Vertical Scaling (More Resources)

To upgrade the VM:

```bash
gcloud compute instances stop 2d1l-vm --zone=us-central1-a
gcloud compute instances set-machine-type 2d1l-vm \
    --machine-type=e2-standard-8 \
    --zone=us-central1-a
gcloud compute instances start 2d1l-vm --zone=us-central1-a
```

### Horizontal Scaling (Multiple VMs)

For high availability, consider:
1. Load balancer in front of multiple VMs
2. Shared database (Cloud SQL) instead of containerized
3. Redis cluster for session management

## Cost Optimization

1. **Preemptible instances**: Use for development/testing (up to 80% savings)
2. **Committed use discounts**: 1-3 year commitments for 20-57% savings
3. **Right-sizing**: Monitor usage and adjust VM size accordingly
4. **Scheduled shutdowns**: Stop VM during non-business hours

## Backup Strategy

1. **Database backups**: Regular exports of PostgreSQL data
2. **VM snapshots**: Create snapshots before major updates
3. **Code backups**: Git repository serves as code backup
4. **Configuration backups**: Backup `.env` and systemd service files

## Next Steps

1. **Domain setup**: Configure custom domain and SSL certificates
2. **Nginx reverse proxy**: For proper HTTPS and load balancing
3. **Cloud Logging**: Ship logs to Google Cloud Logging
4. **Monitoring**: Set up Cloud Monitoring alerts
5. **CI/CD**: Automate deployments with Cloud Build

## Support

For issues or questions:
1. Check the logs first
2. Review this documentation
3. Check Google Cloud Console for VM status
4. Verify firewall rules and network connectivity
