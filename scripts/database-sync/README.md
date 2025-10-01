# Database Synchronization Toolkit

This folder contains scripts for maintaining data consistency between PostgreSQL, Neo4j, and Weaviate databases in the 2D1L system.

## Overview

The 2D1L system uses multiple databases:
- **PostgreSQL**: Source of truth for entities (Concepts, Memory Units, Growth Events)
- **Neo4j**: Graph relationships and knowledge connections
- **Weaviate**: Vector embeddings for semantic search

These scripts ensure data integrity and synchronization across all databases.

## Scripts

### Analysis Scripts

#### `analyze-database-sync.js`
**Purpose**: Comprehensive analysis of database synchronization status
**Usage**: `node analyze-database-sync.js`
**Features**:
- Counts entities in PostgreSQL and Weaviate
- Identifies missing entities in Weaviate
- Finds orphaned entities in Weaviate
- Detects null vectors in Weaviate
- Provides detailed synchronization report

#### `monitor-embedding-queue.js`
**Purpose**: Real-time monitoring of the BullMQ embedding queue
**Usage**: `node monitor-embedding-queue.js`
**Features**:
- Shows queue status and job counts
- Displays active, waiting, and completed jobs
- Monitors embedding worker progress
- Provides real-time updates

### Remediation Scripts

#### `batch-embed-missing.js`
**Purpose**: Identifies and queues missing entities for embedding
**Usage**: `node batch-embed-missing.js [--entity-types=type1,type2]`
**Features**:
- Finds entities in PostgreSQL missing from Weaviate
- Queues embedding jobs for missing entities
- Supports filtering by entity type
- Processes in batches to avoid overwhelming the system

#### `fix-null-vectors.js`
**Purpose**: Identifies and fixes entities with null or invalid vectors
**Usage**: `node fix-null-vectors.js [--entity-types=type1,type2]`
**Features**:
- Finds entities with null, empty, or invalid vectors
- Re-queues them for embedding in upsert mode
- Prevents duplicate creation
- Supports filtering by entity type

#### `cleanup-duplicate-vectors.js`
**Purpose**: Removes duplicate Weaviate entries
**Usage**: `node cleanup-duplicate-vectors.js`
**Features**:
- Identifies entities with multiple Weaviate entries
- Keeps the best entry (with proper vector)
- Removes duplicate entries
- Prevents data inconsistency

#### `cleanup-orphaned-entities.js`
**Purpose**: Removes entities in Weaviate that don't exist in PostgreSQL
**Usage**: `node cleanup-orphaned-entities.js [--confirm] [--entity-types=type1,type2]`
**Features**:
- Finds orphaned entities in Weaviate
- Removes entities not present in PostgreSQL
- Supports dry-run mode (default)
- Requires `--confirm` flag for actual deletion
- Supports filtering by entity type

## Workflow

### 1. Analysis
```bash
# Check current synchronization status
node analyze-database-sync.js

# Monitor embedding queue
node monitor-embedding-queue.js
```

### 2. Remediation
```bash
# Fix missing entities
node batch-embed-missing.js

# Fix null vectors
node fix-null-vectors.js

# Clean up duplicates
node cleanup-duplicate-vectors.js

# Clean up orphaned entities (dry run first)
node cleanup-orphaned-entities.js
node cleanup-orphaned-entities.js --confirm
```

### 3. Verification
```bash
# Verify all issues are resolved
node analyze-database-sync.js
```

## Common Issues and Solutions

### Issue: Null Vectors
**Symptoms**: Entities exist in Weaviate but have no vector embeddings
**Solution**: Run `fix-null-vectors.js` to re-queue them for embedding

### Issue: Missing Entities
**Symptoms**: Entities exist in PostgreSQL but not in Weaviate
**Solution**: Run `batch-embed-missing.js` to queue them for embedding

### Issue: Duplicate Entries
**Symptoms**: Same entity_id appears multiple times in Weaviate
**Solution**: Run `cleanup-duplicate-vectors.js` to remove duplicates

### Issue: Orphaned Entities
**Symptoms**: Entities exist in Weaviate but not in PostgreSQL
**Solution**: Run `cleanup-orphaned-entities.js --confirm` to remove them

## Safety Features

- **Dry Run Mode**: Most scripts default to dry-run mode
- **Confirmation Required**: Destructive operations require explicit confirmation
- **Backup Recommendations**: Scripts suggest creating backups before major operations
- **Detailed Logging**: All operations are logged with clear success/error messages

## Performance Considerations

- **Batch Processing**: Large operations are processed in batches
- **Buffer Management**: Scripts use appropriate buffer sizes for large datasets
- **Efficient Queries**: Optimized database queries to minimize load
- **Progress Tracking**: Real-time progress updates for long-running operations

## Dependencies

- Node.js
- PostgreSQL client
- Weaviate client
- BullMQ (for queue monitoring)
- `@2dots1line/database` package

## Environment Variables

Ensure these environment variables are set:
- `DATABASE_URL`: PostgreSQL connection string
- `WEAVIATE_URL`: Weaviate instance URL
- `REDIS_URL`: Redis connection string for BullMQ

## Troubleshooting

### ENOBUFS Error
If you encounter buffer overflow errors, the scripts automatically handle this by:
- Increasing buffer sizes
- Processing data in smaller chunks
- Using more efficient queries

### Memory Issues
For very large datasets:
- Use entity type filtering to process smaller subsets
- Run scripts during off-peak hours
- Monitor system resources

### Queue Issues
If the embedding queue is stuck:
- Check worker status: `pm2 status`
- Restart workers: `pm2 restart all`
- Monitor queue: `node monitor-embedding-queue.js`

## Best Practices

1. **Regular Monitoring**: Run `analyze-database-sync.js` regularly
2. **Incremental Fixes**: Fix issues as they arise rather than letting them accumulate
3. **Backup Before Cleanup**: Always backup before running cleanup scripts
4. **Test in Development**: Test scripts in development environment first
5. **Monitor Performance**: Watch system resources during large operations

## Integration with CI/CD

These scripts can be integrated into CI/CD pipelines for:
- Automated database health checks
- Pre-deployment synchronization verification
- Post-deployment cleanup operations
- Monitoring and alerting

## Support

For issues or questions:
1. Check the script logs for detailed error messages
2. Verify database connectivity and permissions
3. Ensure all dependencies are properly installed
4. Review the troubleshooting section above
