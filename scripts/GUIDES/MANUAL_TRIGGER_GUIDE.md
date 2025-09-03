# 🔧 Manual Integrity Check Trigger Guide

This guide shows you all the different ways to manually trigger the maintenance worker's data integrity check without waiting for the scheduled 2 AM run.

## 🚀 **Method 1: Using the Root Makefile (Easiest)**

From anywhere in your project:

```bash
# Trigger the integrity check immediately
make maintenance-integrity-check

# Trigger auto-fix for data discrepancies
make maintenance-auto-fix

# Build the maintenance worker
make maintenance-worker-build

# Start maintenance worker in development mode
make maintenance-worker-dev
```

## 🚀 **Method 2: Using the Manual Trigger Script**

From anywhere in your project:

```bash
# Trigger the integrity check immediately
node scripts/GUIDES/trigger-maintenance.js integrity-check

# Or run other maintenance tasks
node scripts/GUIDES/trigger-maintenance.js redis-cleanup
node scripts/GUIDES/trigger-maintenance.js db-optimization
node scripts/GUIDES/trigger-maintenance.js full-maintenance
```

## 📊 **What Happens When You Run It**

1. **Initialization**: The script creates a MaintenanceWorker instance
2. **Database Connections**: Establishes connections to PostgreSQL, Neo4j, and Weaviate
3. **Integrity Checks**: Runs all three consistency checks:
   - PostgreSQL ↔ Neo4j concept consistency
   - PostgreSQL ↔ Neo4j memory unit consistency  
   - PostgreSQL ↔ Weaviate vector consistency
4. **Reporting**: Logs all findings, including any inconsistencies found
5. **Cleanup**: Gracefully shuts down all connections

## 🔍 **Expected Output**

```
🚀 Manual Maintenance Worker Trigger
====================================
🔧 Task Type: integrity-check

🔌 Connecting to databases...
✅ Database connections established

[MaintenanceWorker] Loading environment variables...
[MaintenanceWorker] Environment variables loaded successfully
[MaintenanceWorker] 🔧 MANUAL TRIGGER: Data integrity check task
[MaintenanceWorker] 🔍 Starting data integrity check...
[MaintenanceWorker] 🔍 Checking concept integrity...
[MaintenanceWorker] Found 1 users with concepts to check
[MaintenanceWorker] Checking concepts for user: dev-user-123
[MaintenanceWorker] Checking 215 concepts for user: dev-user-123
[MaintenanceWorker] Concept integrity check complete. Total checked: 215. Total orphaned: 18
[MaintenanceWorker] 🔍 Checking memory unit integrity...
[MaintenanceWorker] Memory unit integrity check complete. Total checked: 71. Total orphaned: 0
[MaintenanceWorker] 🔍 Checking Weaviate data integrity...
[MaintenanceWorker] Weaviate integrity check complete.
[MaintenanceWorker] ✅ Data integrity check completed

✅ Maintenance task completed successfully!
Database connections closed.
🔌 Database connections closed
```

## ⚠️ **Prerequisites**

Before running the manual trigger, ensure:

1. **Environment Variables**: All required database connection variables are set
2. **Database Services**: PostgreSQL, Neo4j, and Weaviate are running and accessible
3. **Dependencies**: The maintenance worker dependencies are installed (`pnpm install`)
4. **Permissions**: The worker has read access to all databases

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"Database connection failed"**
   - Check your `.env` file has correct database URLs
   - Verify all database services are running
   - Check network connectivity between services

2. **"Module not found"**
   - Run `pnpm build` in the maintenance worker directory to compile TypeScript
   - Check that all workspace dependencies are properly linked

3. **"Permission denied"**
   - Make sure the trigger script is executable: `chmod +x scripts/GUIDES/trigger-maintenance.js`
   - Check file permissions

### **Getting Help**

- Check the worker logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure database services are accessible from the worker's network

## 🎯 **Recommended Usage**

- **Development/Testing**: Use `make maintenance-integrity-check` for quick checks
- **Auto-Fixing Issues**: Use `make maintenance-auto-fix` to automatically fix data discrepancies
- **Debugging**: Use `node scripts/GUIDES/trigger-maintenance.js integrity-check` for detailed output
- **Automation**: Use the trigger script in CI/CD pipelines
- **Production**: The worker runs automatically on schedule, but manual triggers are useful for immediate verification

## 🔧 **Auto-Fix Capabilities**

The maintenance worker now includes **automatic repair functionality** for common data inconsistencies:

### **What Gets Auto-Fixed:**
1. **Missing Neo4j Concepts**: Automatically creates missing concept nodes in Neo4j
2. **Missing Neo4j Memory Units**: Automatically creates missing memory unit nodes in Neo4j  
3. **Weaviate Vector Issues**: Triggers re-embedding for missing or corrupted vectors

### **How to Use Auto-Fix:**
```bash
# Auto-fix all data discrepancies
make maintenance-auto-fix

# Or run directly
node scripts/GUIDES/trigger-maintenance.js auto-fix
```

### **Safety Features:**
- **Batch Processing**: Fixes are applied in small batches to avoid overwhelming the system
- **Error Handling**: Individual failures don't stop the entire process
- **Logging**: Comprehensive logging of all fixes applied
- **Rollback Ready**: Changes are logged for potential rollback if needed

## 🔄 **Integration with CI/CD**

You can easily integrate the manual trigger into your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Database Integrity Check
  run: |
    chmod +x scripts/GUIDES/trigger-maintenance.js
    node scripts/GUIDES/trigger-maintenance.js integrity-check
```

This gives you immediate visibility into database consistency issues without waiting for the scheduled maintenance window!
