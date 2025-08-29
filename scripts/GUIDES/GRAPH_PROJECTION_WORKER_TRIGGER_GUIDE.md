# 🚀 **GRAPH PROJECTION WORKER TRIGGER GUIDE - 2D1L**
*Complete instructions for manually triggering and monitoring graph projection worker jobs*

---

## 📋 **OVERVIEW**

The **GraphProjectionWorker** is a background service that regenerates 3D graph projections whenever the InsightEngine finishes its job. This guide shows you how to:

1. **Manually trigger graph projection regeneration** by simulating InsightEngine completion
2. **Monitor job processing** in real-time
3. **Verify projection updates** in the database
4. **Troubleshoot common issues**

### **What the GraphProjectionWorker Does**
- **Triggers**: Only processes `cycle_artifacts_created` events from InsightEngine
- **Process**: Fetches graph structure from Neo4j, embeddings from Weaviate, generates 3D coordinates via Python UMAP service
- **Output**: Stores updated 3D projection in PostgreSQL for frontend visualization
- **Purpose**: Ensures 3D Knowledge Cosmos always reflects latest knowledge state

---

## 🎯 **QUICK START**

### **Prerequisites**
```bash
# Ensure all services are running
pm2 start ecosystem.config.js

# Verify graph projection worker is online
pm2 status | grep graph-projection-worker
```

### **Basic Trigger (Recommended for Daily Use)**
```bash
# Use the trigger script
node scripts/GUIDES/trigger-graph-projection.js

# Expected output:
# ✅ Graph projection job added successfully!
# Job ID: manual-cycle-dev-user-123-1703123456789
# Queue: graph-queue
```

### **Enhanced Trigger with Monitoring**
```bash
# Trigger with real-time monitoring
node scripts/GUIDES/trigger-graph-projection.js --monitor

# Monitor for 60 seconds
node scripts/GUIDES/trigger-graph-projection.js --monitor --duration 60
```

---

## 🔧 **DETAILED TRIGGER PROCEDURES**

### **Method 1: Using the Trigger Script (Recommended)**

#### **File Location**
```
scripts/GUIDES/trigger-graph-projection.js
```

#### **What It Does**
- Creates a `cycle_artifacts_created` job in the 'graph-queue'
- Simulates InsightEngine completing its job
- Includes worker status checking and monitoring options
- Provides detailed job status and queue information

#### **Basic Usage**
```bash
# From project root
node scripts/GUIDES/trigger-graph-projection.js
```

#### **Advanced Usage**
```bash
# Trigger for specific user
node scripts/GUIDES/trigger-graph-projection.js user-456

# Trigger with custom entities
node scripts/GUIDES/trigger-graph-projection.js --entities '[{"id":"concept-123","type":"Concept"}]'

# Trigger with monitoring
node scripts/GUIDES/trigger-graph-projection.js --monitor --duration 60
```

#### **Expected Success Output**
```
🚀 Manual GraphProjectionWorker Trigger
=====================================
👤 User ID: dev-user-123
📊 Entities: 1
🔗 Redis: localhost:6379

🔍 Checking GraphProjectionWorker status...
✅ GraphProjectionWorker is running
   Status: online
   Uptime: 1234s
   Restarts: 0

📤 Adding cycle_artifacts_created job to graph queue...
Job data: {
  "type": "cycle_artifacts_created",
  "userId": "dev-user-123",
  "source": "InsightEngine",
  "timestamp": "2025-01-09T10:30:45.123Z",
  "entities": [...]
}

✅ Graph projection job added successfully!
🆔 Job ID: manual-cycle-dev-user-123-1703123456789
📊 Queue: graph-queue

📈 Queue Status:
   Waiting: 0
   Active: 0
   Completed: 1
   Failed: 0

✅ Job was immediately picked up by worker
```

### **Method 2: Manual Queue Job Creation**

#### **Using Node.js REPL**
```bash
# Start Node.js REPL
node

# In the REPL:
const { Queue } = require('bullmq');
const queue = new Queue('graph-queue', {
  connection: { host: 'localhost', port: 6379 }
});

const jobData = {
  type: 'cycle_artifacts_created',
  userId: 'dev-user-123',
  source: 'InsightEngine',
  timestamp: new Date().toISOString(),
  entities: [
    { id: 'concept-123', type: 'Concept' }
  ]
};

const job = await queue.add('cycle_artifacts_created', jobData);
console.log('Job enqueued:', job.id);
await queue.close();
```

#### **Using Redis CLI Directly**
```bash
# Check if graph queue exists
redis-cli -h localhost -p 6379 KEYS "bull:graph-queue:*"

# Add job manually (advanced users only)
redis-cli -h localhost -p 6379 LPUSH "bull:graph-queue:wait" '{"data":{"type":"cycle_artifacts_created","userId":"dev-user-123"},"name":"cycle_artifacts_created"}'
```

---

## 📊 **MONITORING & VERIFICATION**

### **1. Real-Time Job Processing Monitor**

#### **Watch Worker Logs**
```bash
# Follow graph projection worker logs in real-time
pm2 logs graph-projection-worker --lines 0

# Or view recent logs
pm2 logs graph-projection-worker --lines 50
```

#### **Monitor Redis Queue Status**
```bash
# Check queue lengths
redis-cli -h localhost -p 6379 LLEN bull:graph-queue
redis-cli -h localhost -p 6379 LLEN bull:graph-queue:wait
redis-cli -h localhost -p 6379 LLEN bull:graph-queue:active
redis-cli -h localhost -p 6379 LLEN bull:graph-queue:completed
redis-cli -h localhost -p 6379 LLEN bull:graph-queue:failed
```

#### **View Queue Events**
```bash
# See all queue events (jobs added, processed, completed)
redis-cli -h localhost -p 6379 XREAD COUNT 10 STREAMS bull:graph-queue:events 0
```

### **2. Verify Projection Updates**

#### **Check Database for New Projections**
```bash
# Connect to PostgreSQL and check for new projections
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT 
  projection_id,
  user_id,
  created_at,
  status,
  jsonb_array_length(projection_data->'nodes') as node_count,
  jsonb_array_length(projection_data->'edges') as edge_count
FROM user_graph_projections 
WHERE user_id = 'dev-user-123' 
ORDER BY created_at DESC 
LIMIT 5;"
```

#### **Expected Database Output**
```
 projection_id |   user_id    |       created_at        |  status  | node_count | edge_count 
---------------+--------------+-------------------------+----------+------------+------------
 proj_123      | dev-user-123 | 2025-01-09 10:30:45.123 | completed |         67 |         45
 proj_122      | dev-user-123 | 2025-01-09 09:15:30.456 | completed |         65 |         43
```

### **3. Verify Job Completion**

#### **Check Job Status in Redis**
```bash
# View completed jobs
redis-cli -h localhost -p 6379 LRANGE bull:graph-queue:completed 0 -1

# View failed jobs (should be empty if successful)
redis-cli -h localhost -p 6379 LRANGE bull:graph-queue:failed 0 -1
```

#### **Check Worker Process Status**
```bash
# Verify worker is still running
pm2 show graph-projection-worker

# Check for any errors
pm2 logs graph-projection-worker --lines 10 | grep -i error
```

### **4. Verify Frontend Updates**

#### **Check API Response**
```bash
# Test the graph projection API endpoint
curl -H "Authorization: Bearer dev-token" \
  http://localhost:3001/api/v1/graph-projection/latest | jq '.data.projectionData.nodes | length'

# Get detailed projection data
curl -H "Authorization: Bearer dev-token" \
  http://localhost:3001/api/v1/graph-projection/latest | jq '.data.projectionData.nodes[0:3]'
```

#### **Check Frontend Visualization**
```bash
# Open the Cosmos 3D visualization
open http://localhost:3000/cosmos

# Expected: Updated 3D graph with latest node positions
```

---

## 🚨 **TROUBLESHOOTING COMMON ISSUES**

### **Issue 1: Worker Not Processing Jobs**

#### **Symptoms**
- Job added but queue length stays > 0
- No worker logs showing job processing
- Job remains in 'wait' queue

#### **Diagnosis Steps**
```bash
# 1. Check if worker is running
pm2 status | grep graph-projection-worker

# 2. Check worker logs for errors
pm2 logs graph-projection-worker --lines 20

# 3. Verify Redis connection
redis-cli -h localhost -p 6379 ping
```

#### **Solutions**
```bash
# Restart the worker
pm2 restart graph-projection-worker

# Or restart all services
pm2 restart all
```

### **Issue 2: Job Fails During Processing**

#### **Symptoms**
- Job appears in 'failed' queue
- Worker logs show error messages
- No projection updates in database

#### **Diagnosis Steps**
```bash
# 1. Check failed jobs
redis-cli -h localhost -p 6379 LRANGE bull:graph-queue:failed 0 -1

# 2. Check worker error logs
pm2 logs graph-projection-worker --lines 50 | grep -i error

# 3. Check database connection
docker exec postgres-2d1l pg_isready -U danniwang
```

#### **Common Causes & Fixes**
- **Database connection issues**: Restart PostgreSQL container
- **Environment variables missing**: Restart worker with `pm2 restart graph-projection-worker`
- **Python dimension reducer service unavailable**: Check `http://localhost:8000/health`
- **Neo4j connection issues**: Check Neo4j container status

### **Issue 3: No Projection Updates**

#### **Symptoms**
- Job completes successfully
- No new records in `user_graph_projections` table
- Worker logs show no projection generation

#### **Diagnosis Steps**
```bash
# 1. Check if projections are being created
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT COUNT(*) as total_projections FROM user_graph_projections WHERE user_id = 'dev-user-123';"

# 2. Check worker configuration
pm2 show graph-projection-worker | grep -A 10 "exec cwd"

# 3. Verify database permissions
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT current_user, current_database();"
```

#### **Solutions**
```bash
# Restart worker to reload configuration
pm2 restart graph-projection-worker

# Check database schema
cd packages/database && pnpm db:generate

# Verify environment variables
pm2 exec graph-projection-worker -- env | grep -E "(DATABASE_URL|NEO4J_URI|WEAVIATE_URL)"
```

### **Issue 4: Python Dimension Reducer Issues**

#### **Symptoms**
- Worker logs show "Dimension reducer failed"
- Fallback coordinates being used
- Poor 3D positioning quality

#### **Diagnosis Steps**
```bash
# 1. Check Python service health
curl -f http://localhost:8000/health

# 2. Check Python service logs
pm2 logs dimension-reducer --lines 20

# 3. Verify Python service is running
pm2 status | grep dimension-reducer
```

#### **Solutions**
```bash
# Restart Python service
pm2 restart dimension-reducer

# Check Python service configuration
pm2 show dimension-reducer

# Verify Python dependencies
cd py-services/dimension-reducer && pip list
```

---

## 📈 **PERFORMANCE MONITORING**

### **Job Processing Time**
```bash
# Monitor how long jobs take to process
watch -n 2 'echo "=== Graph Projection Worker Status ===" && \
echo "Queue length: $(redis-cli -h localhost -p 6379 LLEN bull:graph-queue)" && \
echo "Active jobs: $(redis-cli -h localhost -p 6379 LLEN bull:graph-queue:active)" && \
echo "Completed today: $(redis-cli -h localhost -p 6379 LLEN bull:graph-queue:completed)" && \
echo "Worker status: $(pm2 jlist | jq -r ".[] | select(.name==\"graph-projection-worker\") | .pm2_env.status")"'
```

### **Projection Generation Metrics**
```bash
# Check projection generation patterns
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT 
  DATE(created_at) as date,
  COUNT(*) as projections,
  AVG(jsonb_array_length(projection_data->'nodes')) as avg_nodes,
  AVG(jsonb_array_length(projection_data->'edges')) as avg_edges
FROM user_graph_projections 
WHERE user_id = 'dev-user-123' 
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;"
```

---

## 🔄 **AUTOMATED TRIGGERING**

### **Scheduled Jobs (Cron)**
```bash
# Add to crontab for periodic projection updates
# Edit crontab: crontab -e

# Update projection every hour
0 * * * * cd /path/to/2D1L && node scripts/GUIDES/trigger-graph-projection.js >> logs/graph-projection-cron.log 2>&1

# Update projection daily at 2 AM
0 2 * * * cd /path/to/2D1L && node scripts/GUIDES/trigger-graph-projection.js --monitor >> logs/graph-projection-daily.log 2>&1
```

### **Continuous Monitoring Script**
```bash
# Create a monitoring script that triggers jobs when needed
cat > scripts/graph-projection-monitor.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/.."

# Check if graph projection worker is healthy
if ! pm2 jlist | jq -e '.[] | select(.name=="graph-projection-worker" and .pm2_env.status=="online")' > /dev/null; then
    echo "Graph projection worker not running, restarting..."
    pm2 restart graph-projection-worker
fi

# Check queue status
queue_length=$(redis-cli -h localhost -p 6379 LLEN bull:graph-queue)
if [ "$queue_length" -eq 0 ]; then
    echo "Queue empty, triggering new graph projection..."
    node scripts/GUIDES/trigger-graph-projection.js
else
    echo "Queue has $queue_length jobs, skipping..."
fi
EOF

chmod +x scripts/graph-projection-monitor.sh
```

---

## 📝 **VERIFICATION CHECKLIST**

### **After Triggering a Job**
- [ ] Job added successfully (Job ID returned)
- [ ] Queue length shows 0 (job picked up immediately)
- [ ] Worker logs show job processing
- [ ] Job appears in 'completed' queue
- [ ] New projection record created in database
- [ ] No errors in worker logs
- [ ] Frontend shows updated 3D visualization

### **If Issues Occur**
- [ ] Check worker status with `pm2 status`
- [ ] Check Redis queue status
- [ ] Check database connectivity
- [ ] Check environment variables
- [ ] Check worker logs for errors
- [ ] Check Python dimension reducer service
- [ ] Restart worker if needed

---

## 🎯 **QUICK REFERENCE COMMANDS**

### **Essential Commands**
```bash
# Trigger job (basic)
node scripts/GUIDES/trigger-graph-projection.js

# Trigger job (with monitoring)
node scripts/GUIDES/trigger-graph-projection.js --monitor

# Monitor worker
pm2 logs graph-projection-worker --lines 0

# Check queue status
redis-cli -h localhost -p 6379 LLEN bull:graph-queue

# Check database projections
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT COUNT(*) FROM user_graph_projections WHERE user_id = 'dev-user-123';"

# Restart worker
pm2 restart graph-projection-worker
```

### **Debug Commands**
```bash
# Check all Redis keys
redis-cli -h localhost -p 6379 KEYS "bull:graph-queue:*"

# View queue events
redis-cli -h localhost -p 6379 XREAD COUNT 5 STREAMS bull:graph-queue:events 0

# Check worker process
pm2 show graph-projection-worker

# View recent errors
pm2 logs graph-projection-worker --lines 50 | grep -i error

# Check Python service
curl -f http://localhost:8000/health
```

### **Monitoring Commands**
```bash
# Real-time monitoring dashboard
pm2 monit

# Watch queue status
watch -n 2 'redis-cli -h localhost -p 6379 LLEN bull:graph-queue'

# Monitor worker logs
pm2 logs graph-projection-worker --lines 0

# Check system resources
docker stats --no-stream
```

---

## 📚 **RELATED DOCUMENTATION**

### **Code References**
- **GraphProjectionWorker**: `workers/graph-projection-worker/src/GraphProjectionWorker.ts`
- **Neo4jService**: `packages/database/src/services/Neo4jService.ts`
- **WeaviateService**: `packages/database/src/services/WeaviateService.ts`
- **GraphProjectionRepository**: `packages/database/src/repositories/GraphProjectionRepository.ts`

### **Configuration Files**
- **Environment**: `.env` file
- **PM2 Ecosystem**: `ecosystem.config.js`
- **Docker Compose**: `docker-compose.dev.yml`

### **Related Guides**
- **Daily Workflow**: `scripts/GUIDES/DAILY_WORKFLOW.md`
- **Troubleshooting**: `scripts/GUIDES/TROUBLESHOOTING_GUIDE.md`
- **Installation**: `scripts/GUIDES/INSTALLATION_GUIDE.md`
- **Cosmos Configuration**: `scripts/GUIDES/COSMOS_CONFIGURATION_GUIDE.md`

---

## 🆘 **GETTING HELP**

### **If This Guide Doesn't Help**
1. **Check the troubleshooting section** above
2. **Review worker logs** with `pm2 logs graph-projection-worker --lines 100`
3. **Check system health** with `pnpm health:check`
4. **Refer to emergency procedures** in `scripts/GUIDES/TROUBLESHOOTING_GUIDE.md`

### **Common Support Questions**
- **Q**: "Job added but not processed" → Check worker status and restart if needed
- **Q**: "No projection updates" → Check database connection and worker configuration
- **Q**: "Worker keeps crashing" → Check environment variables and restart services
- **Q**: "Poor 3D positioning" → Check Python dimension reducer service

---

**Last Updated**: January 6, 2025  
**Tested With**: 2D1L V11.0  
**Worker Type**: graph-projection-worker  
**Queue Name**: graph-queue  
**Script Version**: 1.0.0

---

*This comprehensive guide provides everything needed to work with the graph projection worker effectively. For advanced 3D visualization configuration or specific requirements, refer to the Cosmos Configuration Guide or the GraphProjectionWorker implementation.*
