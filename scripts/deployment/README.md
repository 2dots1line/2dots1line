# Deployment Scripts

This directory contains all scripts and configurations related to deploying the 2D1L application to various environments.

## **Scripts Overview**

### **VM Deployment Scripts**

#### `deploy-vm.sh`
Creates and configures a Google Cloud Compute Engine VM for 2D1L deployment.

**Usage:**
```bash
./scripts/deployment/deploy-vm.sh
```

**What it does:**
- Creates Compute Engine VM (e2-standard-4, Ubuntu 22.04, 100GB SSD)
- Installs Node.js, pnpm, PM2, Docker, Docker Compose, gcloud CLI
- Creates firewall rules for ports 80, 443, 3000, 3001
- Displays the VM's external IP

#### `deploy-app.sh`
Deploys the 2D1L application to a configured VM.

**Usage:**
```bash
# SSH into VM first
gcloud compute ssh 2d1l-vm --zone=us-central1-a

# Then run on VM
./scripts/deployment/deploy-app.sh
```

**What it does:**
- Clones repository
- Fetches secrets from Secret Manager
- Creates production `.env` file
- Installs dependencies and builds the monorepo
- Starts Docker services (databases)
- Starts PM2 services (API Gateway + workers + Web App)
- Configures auto-start services
- Sets up health monitoring

#### `deploy-app-simple.sh`
Simplified version of the deployment script for quick deployments.

**Usage:**
```bash
./scripts/deployment/deploy-app-simple.sh
```

### **Health Monitoring**

#### `health-check.sh`
Monitors all services and restarts them if needed.

**Usage:**
```bash
# Make executable
chmod +x scripts/deployment/health-check.sh

# Add to crontab (runs every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/$USER/scripts/deployment/health-check.sh") | crontab -
```

## **PM2 Ecosystem Configurations**

### `ecosystem.config.js` (Original Full Configuration)
- **Use for:** VM deployment with all services
- **Services:** API Gateway + All Workers + Web App
- **Environment:** Production
- **Command:** `pnpm start:services`

### `ecosystem.dev.config.js` (Development Configuration)
- **Use for:** Local development
- **Services:** API Gateway + Web App (dev mode with hot reload)
- **Environment:** Development with file watching
- **Command:** `pnpm start:dev`

### `ecosystem.prod.config.js` (Production Configuration)
- **Use for:** VM production deployment
- **Services:** API Gateway + All Workers + Web App (production mode)
- **Environment:** Production
- **Command:** `pnpm start:prod`

## **Quick Start Commands**

### **Local Development**
```bash
# Start development environment
pnpm start:dev

# Stop all services
pnpm stop:services

# Restart all services
pnpm restart:services
```

### **VM Production Deployment**
```bash
# Deploy to VM
./scripts/deployment/deploy-vm.sh
gcloud compute ssh 2d1l-vm --zone=us-central1-a
./scripts/deployment/deploy-app.sh

# Or use simplified deployment
./scripts/deployment/deploy-app-simple.sh
```

### **Service Management**
```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart services
pnpm restart:services

# Stop services
pnpm stop:services
```

## **Related Documentation**

- **Compute Engine Deployment Guide**: `scripts/GUIDES/COMPUTE_ENGINE_DEPLOYMENT.md`
- **Deployment and Startup Guide**: `scripts/GUIDES/DEPLOYMENT_AND_STARTUP_GUIDE.md`
- **Migration Scripts**: `scripts/migration/README.md`
- **VM Access Troubleshooting**: `scripts/GUIDES/20251018_VM_Access_Troubleshooting.md`

## **Troubleshooting**

### **Common Issues**

1. **Services not starting**: Check logs with `pm2 logs` and `docker-compose logs`
2. **Database connection issues**: Verify Docker containers are running with `docker ps`
3. **Port conflicts**: Check if ports are already in use with `lsof -i :PORT`
4. **Permission issues**: Ensure user is in docker group with `groups $USER`

### **Useful Commands**

```bash
# Check PM2 status
pm2 status

# Check Docker containers
docker ps

# Restart services
pnpm restart:services

# Free up port conflicts
lsof -ti:3000 | xargs -r kill -9  # Free port 3000
lsof -ti:3001 | xargs -r kill -9  # Free port 3001

# Complete system reset
pnpm stop:services && docker-compose -f docker-compose.dev.yml down && pnpm start:prod
```

## **File Structure**

```
scripts/deployment/
├── README.md                    # This file
├── deploy-vm.sh                 # VM creation and setup
├── deploy-app.sh                # Full application deployment
├── deploy-app-simple.sh         # Simplified deployment
├── health-check.sh              # Service health monitoring
├── ecosystem.config.js          # Original full PM2 configuration
├── ecosystem.dev.config.js      # Development PM2 configuration
└── ecosystem.prod.config.js     # Production PM2 configuration
```
