# Google Cloud Setup Log - 2D1L Project

## 📋 Project Overview
- **Project Name:** 2D1L
- **Project ID:** d1l-460112
- **Setup Date:** January 2025
- **Free Trial:** $243.87 credit remaining, 31 days left

---

## ✅ Completed Steps

### 1. Google Cloud Project Setup
- **Status:** ✅ Complete
- **Project ID:** `d1l-460112`
- **Project Name:** `2D1L`
- **Free Trial:** Active ($243.87 credit, 31 days remaining)

### 2. APIs Enabled
- **Status:** ✅ Complete
- **APIs Enabled:**
  - ✅ Generative Language API (for Gemini)
  - ✅ Cloud Logging API
  - ✅ Cloud Monitoring API
  - ✅ Cloud Storage API
  - ✅ Cloud SQL API
  - ✅ Cloud Run API
  - ✅ Google Cloud Memorystore for Redis API
  - ✅ Cloud Build API
  - ✅ Secret Manager API
  - ✅ Container Registry API (Artifact Registry)

### 3. Cloud SQL (PostgreSQL) Setup
- **Status:** ✅ Complete
- **Instance Type:** Sandbox
- **Configuration:**
  - **Instance ID:** `twodotsoneline`
  -@V&H%<^u[bY6eXd5]
  - **Engine:** PostgreSQL 17
  - **Specs:** 2 vCPUs, 8 GB RAM, 10 GB SSD storage
  - **Region:** us-central1
  - **Availability:** Single-zone
  - **PITR:** Up to 7 days
- **Database Name:** `twodots1line`
- **Username:** `postgres`
- **Password:** `[SAVED SECURELY - NOT IN THIS FILE]`
- **Connection Details:**
  - **Public IP:** `34.121.125.179`
  - **Port:** `5432`
  - **Connection Name:** `d11-460112:us-central1:twodotsoneline`
  - **Database URL:** `postgresql://postgres:[PASSWORD]@34.121.125.179:5432/twodots1line`

### 4. Cloud Memorystore (Valkey) Setup
- **Status:** ✅ Complete
- **Service:** Valkey (Redis-compatible)
- **Configuration:**
  - **Instance ID:** `twodonel-redis`
  - **Node Type:** shared-core-nano
  - **Memory:** 1.4 GB (1.12 GB writable)
  - **Region:** us-central1-a
  - **Cluster Mode:** Disabled
  - **Shard Count:** 1
  - **Replicas per shard:** 1
  - **Connection Mode:** Private Service Connect (PSC)
  - **Version:** 8.0
  - **Persistence:** No persistence (consider changing to RDB)
  - **Security:** IAM Auth disabled, TLS disabled
- **Cost:** $0.0636/hour (~$46.43/month)
- **Connection Details:**
  - **Primary Endpoint:** `10.128.0.2:6379`
  - **Reader Endpoint:** `10.128.0.3:6379`
  - **Connection Method:** Private Service Connect (PSC)
  - **Redis URL:** `redis://10.128.0.2:6379`
- **Network Policy:** 
  - **Policy Name:** `twodonel-memorystore-psc-policy`
  - **Description:** Service connection policy for 2D1L project to connect to Memorystore (Valkey) instance in us-central1
  - **Network:** `projects/d1l-460112/global/networks/default`
  - **Region:** us-central1
  - **Subnetworks:** default (us-central1)
  - **Connection Limit:** No limit

### 5. Secret Manager Setup
- **Status:** ✅ Complete
- **Secrets Created:**
  - ✅ `JWT_SECRET` - Secure JWT signing key
  - ✅ `POSTGRES_PASSWORD` - Database password
  - ✅ `GOOGLE_API_KEY` - Gemini API key
  - ✅ `PEXELS_API_KEY` - Pexels API key

### 6. Artifact Registry Setup
- **Status:** ✅ Complete
- **Repository Configuration:**
  - **Repository Name:** `twodonel-docker-repo`
  - **Format:** Docker
  - **Mode:** Standard
  - **Location Type:** Region
  - **Region:** us-central1
  - **Security Settings:**
    - **Immutable Image Tags:** Disabled (for development flexibility)
    - **Cleanup Policies:** Dry run (safe testing mode)
    - **Container Scanning API:** Enabled (security scanning)
    - **Vulnerability Scanning:** Enabled (automatic security checks)

### 7. Neo4j on Cloud Run Setup
- **Status:** 🔄 Ready to Deploy
- **Configuration:**
  - **Image:** `us-central1-docker.pkg.dev/d1l-460112/twodonel-docker-repo/neo4j:latest`
  - **Port:** 7474 (HTTP), 7687 (Bolt)
  - **Memory:** 2Gi
  - **CPU:** 2
  - **Authentication:** neo4j/password123
  - **Region:** us-central1

### 8. Weaviate on Cloud Run Setup
- **Status:** 🔄 Ready to Deploy
- **Configuration:**
  - **Image:** `us-central1-docker.pkg.dev/d1l-460112/twodonel-docker-repo/weaviate:latest`
  - **Port:** 8080
  - **Memory:** 2Gi
  - **CPU:** 2
  - **Authentication:** Anonymous access enabled
  - **Region:** us-central1

### 8. Compute Engine VM Deployment
- **Status:** 🔄 Ready to Deploy
- **Architecture:** Single VM running entire application stack
- **VM Configuration:**
  - **Instance Name:** `2d1l-vm`
  - **Machine Type:** e2-standard-4 (4 vCPU, 16GB RAM)
  - **Boot Disk:** 100GB SSD, Ubuntu 22.04 LTS
  - **Zone:** us-central1-a
  - **Network Tags:** `2d1l-server`
- **Services Running on VM:**
  - **Docker Compose:** PostgreSQL, Neo4j, Weaviate, Redis, Python Dimension Reducer
  - **PM2:** API Gateway + 11 workers (12 Node.js processes)
  - **Next.js:** Frontend (production build)
- **Cost:** ~$53/month (replaces Cloud SQL + Valkey costs)
- **Deployment Scripts:**
  - `deploy-vm.sh` - Creates VM and firewall rules
  - `deploy-app.sh` - Deploys application to VM
  - `health-check.sh` - Monitors service health
  - `2d1l-docker.service` - Systemd service for Docker auto-start

---

## 🔄 Next Steps

### 9. Deploy to Compute Engine VM
- [ ] Run `./deploy-vm.sh` to create VM and firewall rules
- [ ] SSH into VM: `gcloud compute ssh 2d1l-vm --zone=us-central1-a`
- [ ] Run `./deploy-app.sh` on the VM to deploy application
- [ ] Verify all services are running
- [ ] Test external access via VM IP

### 10. Configure Domain and SSL (Optional)
- [ ] Set up custom domain pointing to VM IP
- [ ] Install Let's Encrypt SSL certificates
- [ ] Configure Nginx reverse proxy for HTTPS
- [ ] Update environment variables with domain URLs

### 11. Monitoring and Maintenance
- [ ] Set up Cloud Logging agent
- [ ] Configure Cloud Monitoring alerts
- [ ] Set up automated backups for database volumes
- [ ] Test disaster recovery procedures

---

## 🔐 Credentials & Connection Details

### Database Connections
```bash
# PostgreSQL (Cloud SQL)
POSTGRES_HOST=34.121.125.179
POSTGRES_PORT=5432
POSTGRES_DB=twodots1line
POSTGRES_USER=postgres
POSTGRES_PASSWORD=[SAVED SECURELY]

# Redis/Valkey (Cloud Memorystore)
REDIS_HOST=10.128.0.2
REDIS_PORT=6379
REDIS_PASSWORD=[IF SET]
```

### Environment Variables for Production
```bash
# Application Configuration
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
NOTIFICATION_SERVICE_URL=https://your-notification-service.com

# Database URLs
DATABASE_URL=postgresql://postgres:[PASSWORD]@34.121.125.179:5432/twodots1line
REDIS_URL=redis://10.128.0.2:6379

# API Keys (to be stored in Secret Manager)
JWT_SECRET=[TO BE GENERATED]
GOOGLE_API_KEY=[YOUR_GEMINI_API_KEY]
PEXELS_API_KEY=[YOUR_PEXELS_API_KEY]
```

---

## 📊 Cost Estimation

### Compute Engine VM Deployment (Recommended)
- **VM (e2-standard-4):** $48.54/month
- **100GB SSD:** $4/month
- **Network egress:** ~$1-5/month (minimal with low traffic)
- **Total Estimated:** ~$53-58/month

### Previous Cloud Run + Managed Databases (Not Recommended)
- **Cloud SQL (Sandbox):** ~$25-50/month
- **Valkey (1.4 GB):** ~$46.43/month
- **Cloud Run:** ~$10-30/month (depending on traffic)
- **Total Estimated:** ~$81-126/month

### Production Scaling (VM Approach)
- **VM (e2-standard-8):** ~$97/month
- **200GB SSD:** ~$8/month
- **Network egress:** ~$5-20/month
- **Total Estimated:** ~$110-125/month

---

## 🚨 Important Notes

### Security Considerations
- [ ] Enable TLS for Valkey instance
- [ ] Set up IAM authentication
- [ ] Configure firewall rules
- [ ] Use Secret Manager for sensitive data

### Backup & Recovery
- [ ] Set up automated backups for PostgreSQL
- [ ] Configure point-in-time recovery
- [ ] Test backup restoration process

### Monitoring & Logging
- [ ] Set up Cloud Monitoring alerts
- [ ] Configure log aggregation
- [ ] Set up performance monitoring

---

## 📞 Support & Resources

### Google Cloud Documentation
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Memorystore Documentation](https://cloud.google.com/memorystore/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)

### Project-Specific Resources
- [2D1L Project Repository](https://github.com/your-username/2D1L)
- [Environment Configuration](envexample.md)
- [Local Development Setup](STARTUP_GUIDE.md)

---

## 📝 Change Log

### 2025-01-XX
- ✅ Created Google Cloud project
- ✅ Enabled essential APIs
- ✅ Set up Cloud SQL PostgreSQL instance
- 🔄 Set up Cloud Memorystore Valkey instance
- 🔄 Created service connection policy

---

**⚠️ IMPORTANT:** Never commit actual passwords or API keys to version control. Use Google Cloud Secret Manager for production secrets.
