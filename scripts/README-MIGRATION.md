# V11.0 Field Naming Standardization Migration

This directory contains all the scripts and tools needed to execute the V11.0 Field Naming Standardization migration across PostgreSQL, Neo4j, and Weaviate databases.

## Overview

The migration standardizes field naming conventions across all three databases to eliminate inconsistencies and improve developer experience. Key changes include:

- **Unified field names**: `entity_id`, `user_id`, `title`, `content`, `type`, `status`
- **Standardized timestamps**: `created_at`, `updated_at`
- **Consistent content fields**: All text content uses `content` field
- **Unified type fields**: All entity types use `type` field

## Migration Scripts

### 1. `backup-databases.sh`
Creates comprehensive backups of all three databases before migration.

**Usage:**
```bash
./scripts/backup-databases.sh
```

**What it does:**
- Creates timestamped backup directory
- Backs up PostgreSQL schema and data
- Backs up Neo4j constraints, indexes, and data
- Backs up Weaviate schema and data
- Generates rollback scripts
- Creates backup manifest

### 2. `verify-database-health.sh`
Verifies the health and integrity of all databases before and after migration.

**Usage:**
```bash
./scripts/verify-database-health.sh
```

**What it does:**
- Tests database connectivity
- Checks data integrity
- Verifies constraints and indexes
- Tests query performance
- Generates health report

### 3. `execute-migration.sh`
Orchestrates the entire migration process with safety checks.

**Usage:**
```bash
./scripts/execute-migration.sh
```

**What it does:**
- Runs pre-migration checks
- Stops and starts services
- Executes PostgreSQL migration
- Executes Neo4j migration
- Executes Weaviate migration
- Validates post-migration health
- Generates migration report

### 4. `restore-weaviate.sh`
Specialized script for restoring Weaviate data from JSON backups.

**Usage:**
```bash
./scripts/restore-weaviate.sh [backup-directory]
```

## Migration Process

### Phase 1: Pre-Migration (Backup)
1. **Run backup script:**
   ```bash
   ./scripts/backup-databases.sh
   ```

2. **Verify backup integrity:**
   - Check backup directory was created
   - Verify all backup files exist
   - Review backup manifest

### Phase 2: Migration Execution
1. **Run migration script:**
   ```bash
   ./scripts/execute-migration.sh
   ```

2. **Monitor migration progress:**
   - Watch console output for progress
   - Check migration logs in migration directory
   - Verify each phase completes successfully

### Phase 3: Post-Migration Validation
1. **Verify database health:**
   ```bash
   ./scripts/verify-database-health.sh
   ```

2. **Check migration report:**
   - Review migration-report.md
   - Verify all phases completed
   - Check for any warnings or errors

## Rollback Procedures

If migration fails or issues are discovered, use the rollback scripts:

### PostgreSQL Rollback
```bash
cd backups/[backup-directory]
./rollback-postgresql.sh
```

### Neo4j Rollback
```bash
cd backups/[backup-directory]
./rollback-neo4j.sh
```

### Weaviate Rollback
```bash
cd backups/[backup-directory]
./rollback-weaviate.sh
```

## Field Mapping Reference

### PostgreSQL Field Changes

| Table | Old Field | New Field | Notes |
|-------|-----------|-----------|-------|
| `concepts` | `concept_id` | `entity_id` | Primary key |
| `concepts` | `name` | `title` | Display name |
| `concepts` | `description` | `content` | Text content |
| `concepts` | `salience` | `importance_score` | Scoring |
| `concepts` | `last_updated_ts` | `updated_at` | Timestamp |
| `memory_units` | `muid` | `entity_id` | Primary key |
| `memory_units` | `creation_ts` | `created_at` | Timestamp |
| `memory_units` | `last_modified_ts` | `updated_at` | Timestamp |
| `derived_artifacts` | `artifact_id` | `entity_id` | Primary key |
| `derived_artifacts` | `content_narrative` | `content` | Text content |
| `derived_artifacts` | `artifact_type` | `type` | Entity type |
| `proactive_prompts` | `prompt_id` | `entity_id` | Primary key |
| `proactive_prompts` | `prompt_text` | `content` | Text content |
| `communities` | `community_id` | `entity_id` | Primary key |
| `communities` | `name` | `title` | Display name |
| `communities` | `description` | `content` | Text content |
| `conversations` | `id` | `conversation_id` | Primary key |
| `conversations` | `start_time` | `created_at` | Timestamp |
| `conversations` | `context_summary` | `content` | Text content |
| `conversation_messages` | `id` | `message_id` | Primary key |
| `conversation_messages` | `timestamp` | `created_at` | Timestamp |
| `conversation_messages` | `role` | `type` | Message type |
| `conversation_messages` | `llm_call_metadata` | `metadata` | Metadata |
| `growth_events` | `event_id` | `entity_id` | Primary key |
| `growth_events` | `dimension_key` | `type` | Event type |
| `growth_events` | `rationale` | `content` | Text content |
| `growth_events` | `related_concepts` | `source_concept_ids` | Array field |
| `growth_events` | `related_memory_units` | `source_memory_unit_ids` | Array field |
| `growth_events` | `details` | `metadata` | Metadata |
| `interaction_logs` | `timestamp` | `created_at` | Timestamp |
| `interaction_logs` | `interaction_type` | `type` | Interaction type |
| `interaction_logs` | `content_text` | `content` | Text content |
| `user_cycles` | `cycle_type` | `type` | Cycle type |
| `user_cycles` | `cycle_start_date` | `created_at` | Timestamp |
| `user_cycles` | `cycle_end_date` | `ended_at` | Timestamp |

### Neo4j Field Changes

| Node Type | Old Property | New Property | Notes |
|-----------|--------------|--------------|-------|
| `Concept` | `id` | `entity_id` | Primary identifier |
| `Concept` | `userId` | `user_id` | User reference |
| `Concept` | `name` | `title` | Display name |
| `Concept` | `description` | `content` | Text content |
| `Concept` | `updatedAt` | `updated_at` | Timestamp |
| `MemoryUnit` | `muid` | `entity_id` | Primary identifier |
| `MemoryUnit` | `userId` | `user_id` | User reference |
| `MemoryUnit` | `creation_ts` | `created_at` | Timestamp |
| `MemoryUnit` | `updatedAt` | `updated_at` | Timestamp |
| `DerivedArtifact` | `artifact_id` | `entity_id` | Primary identifier |
| `DerivedArtifact` | `userId` | `user_id` | User reference |
| `DerivedArtifact` | `content_narrative` | `content` | Text content |
| `DerivedArtifact` | `artifact_type` | `type` | Entity type |
| `ProactivePrompt` | `prompt_id` | `entity_id` | Primary identifier |
| `ProactivePrompt` | `userId` | `user_id` | User reference |
| `ProactivePrompt` | `prompt_text` | `content` | Text content |
| `ProactivePrompt` | `prompt_type` | `type` | Prompt type |
| `Community` | `community_id` | `entity_id` | Primary identifier |
| `Community` | `userId` | `user_id` | User reference |
| `Community` | `name` | `title` | Display name |
| `Community` | `description` | `content` | Text content |

### Weaviate Field Changes

| Old Property | New Property | Notes |
|--------------|--------------|-------|
| `externalId` | `entity_id` | Primary identifier |
| `userId` | `user_id` | User reference |
| `sourceEntityType` | `entity_type` | Entity table type |
| `sourceEntityId` | `entity_id` | Same as externalId |
| `textContent` | `content` | Text content |
| `modelVersion` | `embedding_model_version` | Model version |
| `createdAt` | `created_at` | Timestamp |
| `updatedAt` | `updated_at` | Timestamp |

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if databases are running
   - Verify connection parameters
   - Check firewall settings

2. **Migration Script Failed**
   - Check migration logs
   - Verify database permissions
   - Check for data conflicts

3. **Rollback Failed**
   - Verify backup files exist
   - Check database permissions
   - Restart services if needed

### Log Files

- `migration.log` - Complete migration log
- `postgresql-migration.log` - PostgreSQL migration details
- `neo4j-migration.log` - Neo4j migration details
- `weaviate-migration.log` - Weaviate migration details
- `pre-migration-health.log` - Pre-migration health check
- `post-migration-health.log` - Post-migration health check

### Recovery Procedures

1. **If migration fails mid-process:**
   - Stop all services
   - Use rollback scripts
   - Restart services
   - Verify database health

2. **If post-migration validation fails:**
   - Check migration logs
   - Verify data integrity
   - Consider rollback if necessary

3. **If application code breaks:**
   - Update code to use new field names
   - Test thoroughly
   - Deploy incrementally

## Safety Measures

1. **Comprehensive Backups**: Full database backups before migration
2. **Health Checks**: Pre and post-migration validation
3. **Rollback Scripts**: Automated rollback procedures
4. **Logging**: Detailed logging of all operations
5. **Validation**: Cross-database consistency checks

## Next Steps After Migration

1. **Update Application Code**:
   - Update TypeScript types
   - Update API endpoints
   - Update frontend components
   - Update worker processes

2. **Testing**:
   - Run unit tests
   - Run integration tests
   - Run end-to-end tests
   - Performance testing

3. **Deployment**:
   - Deploy to staging
   - Deploy to production
   - Monitor for issues

## Support

If you encounter issues during migration:

1. Check the migration logs
2. Review the troubleshooting section
3. Use rollback procedures if necessary
4. Contact the development team

## Migration Timeline

- **Backup**: 5-10 minutes
- **Migration**: 10-15 minutes
- **Validation**: 5 minutes
- **Total**: 20-30 minutes

The migration is designed to be fast and safe, with comprehensive backup and rollback procedures.
