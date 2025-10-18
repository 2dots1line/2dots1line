# Migration Scripts

This directory contains scripts for managing branch switching and data migration between local development and VM environments.

## **Scripts Overview**

### **Branch Management**

#### `switch-vm-branch.sh`
Automated branch switching on VM with proper service management.

```bash
# Switch VM to a new branch
./scripts/migration/switch-vm-branch.sh feature/new-feature

# What it does:
# 1. Stops all PM2 services
# 2. Fetches and switches to the new branch
# 3. Installs dependencies
# 4. Generates Prisma client
# 5. Builds the application
# 6. Restarts all services
# 7. Shows service status
```

### **Data Migration**

#### `export-local-data.sh`
Exports all local data for VM migration.

```bash
# Export local data
./scripts/migration/export-local-data.sh

# Creates timestamped backup with:
# - PostgreSQL database dump
# - Neo4j database dump
# - Weaviate schema and data
# - Application files (uploads, covers, videos)
# - Configuration files (.env, config/)
```

#### `import-to-vm.sh`
Imports exported data to VM.

```bash
# Import data to VM
./scripts/migration/import-to-vm.sh backup_20241018_143022

# What it does:
# 1. Uploads backup to VM
# 2. Imports PostgreSQL data
# 3. Imports Neo4j data
# 4. Imports Weaviate schema and data
# 5. Copies application files
# 6. Updates configuration
```

## **Usage Examples**

### **Complete Branch Switch with Data Migration**

```bash
# 1. Export current local data
./scripts/migration/export-local-data.sh

# 2. Switch VM to new branch
./scripts/migration/switch-vm-branch.sh feature/new-feature

# 3. Import local data to VM
./scripts/migration/import-to-vm.sh backup_20241018_143022
```

### **Quick Branch Switch (No Data Migration)**

```bash
# Just switch branch without migrating data
./scripts/migration/switch-vm-branch.sh feature/new-feature
```

### **Data-Only Migration (Same Branch)**

```bash
# Export and import data without changing branches
./scripts/migration/export-local-data.sh
./scripts/migration/import-to-vm.sh backup_20241018_143022
```

## **Manual Commands**

### **Individual Database Migration**

```bash
# PostgreSQL
docker exec postgres-2d1l pg_dump -U postgres twodots1line > backup.sql
gcloud compute scp backup.sql twodots-vm:~/ --zone=us-central1-a
gcloud compute ssh twodots-vm --zone=us-central1-a --command="docker exec -i postgres-2d1l psql -U postgres twodots1line < ~/backup.sql"

# Neo4j
docker exec neo4j-2d1l neo4j-admin dump --database=neo4j --to=/tmp/backup.dump
docker cp $(docker ps -q -f name=neo4j-2d1l):/tmp/backup.dump ./backup.dump
gcloud compute scp backup.dump twodots-vm:~/ --zone=us-central1-a

# Weaviate
curl -X GET "http://localhost:8080/v1/schema" > weaviate_schema.json
curl -X GET "http://localhost:8080/v1/objects" > weaviate_data.json
gcloud compute scp weaviate_schema.json twodots-vm:~/ --zone=us-central1-a
gcloud compute scp weaviate_data.json twodots-vm:~/ --zone=us-central1-a
```

### **File Transfer**

```bash
# Upload files to VM
gcloud compute scp --recurse ./local-directory twodots-vm:~/remote-directory/ --zone=us-central1-a

# Download files from VM
gcloud compute scp --recurse twodots-vm:~/remote-directory ./local-directory/ --zone=us-central1-a
```

## **Prerequisites**

- Google Cloud SDK installed and configured
- VM instance `twodots-vm` running in `us-central1-a` zone
- Docker services running on both local and VM
- PM2 installed on VM
- Proper SSH access to VM

## **Troubleshooting**

### **Common Issues**

1. **Permission Denied**: Make sure scripts are executable
   ```bash
   chmod +x scripts/migration/*.sh
   ```

2. **VM Not Accessible**: Check VM status
   ```bash
   gcloud compute instances list
   ```

3. **Database Connection Issues**: Verify Docker services are running
   ```bash
   docker ps
   ```

4. **PM2 Issues**: Check PM2 status on VM
   ```bash
   gcloud compute ssh twodots-vm --zone=us-central1-a --command="pm2 status"
   ```

### **Logs and Debugging**

```bash
# Check VM logs
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 logs --lines 50"

# Check specific service logs
gcloud compute ssh twodots-vm --zone=us-central1-a --command="cd ~/2D1L && pm2 logs web-app --lines 50"
```
