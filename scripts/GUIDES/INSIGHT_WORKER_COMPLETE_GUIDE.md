# 🚀 **INSIGHT WORKER COMPLETE GUIDE - 2D1L**
*Complete instructions for triggering, monitoring, and troubleshooting insight worker jobs*

---

## 📋 **OVERVIEW**

The **Insight Worker** is a background service that processes strategic analysis jobs from the Redis queue. This guide covers both basic and advanced triggering methods, monitoring, and comprehensive troubleshooting.

### **What the Insight Worker Does**
- **Strategic Analysis**: Performs cyclical analysis of user knowledge and conversations
- **Data Compilation**: Gathers data from PostgreSQL, Neo4j, and Weaviate
- **LLM Processing**: Uses StrategicSynthesisTool to generate insights
- **Artifact Creation**: Creates derived artifacts and proactive prompts
- **Graph Updates**: Updates the knowledge graph with new insights

### **Key Components**
- **InsightEngine**: Main processing logic
- **InsightDataCompiler**: Data gathering from multiple sources
- **StrategicSynthesisTool**: LLM-based analysis
- **BullMQ Queue**: Job management via Redis

---

## 🎯 **QUICK START**

### **Prerequisites**
```bash
# Ensure all services are running
pm2 start ecosystem.config.js

# Verify insight worker is online
pm2 status | grep insight-worker
```

### **Basic Trigger (Recommended for Daily Use)**
```bash
# Use the basic trigger script
node scripts/GUIDES/trigger-insight.js

# Expected output:
# ✅ Insight job added successfully!
# Job ID: 1
# Job data: { userId: 'dev-user-123' }
# Queue length: 0
```

### **Enhanced Trigger (Advanced Features)**
```bash
# Use enhanced script with monitoring
node scripts/GUIDES/trigger-insight-enhanced.js --monitor

# Check status only
node scripts/GUIDES/trigger-insight-enhanced.js --status
```

---

## 🔧 **TRIGGER SCRIPTS COMPARISON**

### **Basic Trigger Script** (`scripts/GUIDES/trigger-insight.js`)

#### **Features**
- ✅ Simple job creation
- ✅ Basic error handling
- ✅ Queue connection management
- ✅ Job status checking

#### **Usage**
```bash
# Basic usage
node scripts/GUIDES/trigger-insight.js

# With custom user ID
node scripts/GUIDES/trigger-insight.js dev-user-123

# Show help
node scripts/GUIDES/trigger-insight.js --help
```

#### **Best For**
- Daily development work
- Simple job triggering
- Quick testing
- Automated scripts

### **Enhanced Trigger Script** (`scripts/GUIDES/trigger-insight-enhanced.js`)

#### **Features**
- ✅ All basic features
- ✅ Real-time job monitoring
- ✅ Worker status verification
- ✅ Queue health checking
- ✅ LLM interaction verification
- ✅ Verbose logging options
- ✅ Pre-flight checks

#### **Usage**
```bash
# Basic enhanced usage
node scripts/GUIDES/trigger-insight-enhanced.js

# With monitoring
node scripts/GUIDES/trigger-insight-enhanced.js --monitor

# With verbose monitoring
node scripts/GUIDES/trigger-insight-enhanced.js --monitor --verbose

# Status check only
node scripts/GUIDES/trigger-insight-enhanced.js --status

# Custom user with monitoring
node scripts/GUIDES/trigger-insight-enhanced.js dev-user-123 --monitor
```

#### **Best For**
- Debugging complex issues
- Production monitoring
- Performance analysis
- Comprehensive testing

---

## 📊 **MONITORING & VERIFICATION**

### **1. Real-Time Monitoring**

#### **Using Enhanced Script**
```bash
# Monitor job processing in real-time
node scripts/GUIDES/trigger-insight-enhanced.js --monitor

# With verbose logging
node scripts/GUIDES/trigger-insight-enhanced.js --monitor --verbose
```

#### **Manual Monitoring**
```bash
# Watch worker logs
pm2 logs insight-worker --lines 0

# Follow specific job
pm2 logs insight-worker --lines 0 | grep "Job ID"

# Monitor queue status
watch -n 2 'redis-cli -h localhost -p 6379 LLEN bull:insight'
```

### **2. Queue Status Monitoring**

#### **Check All Queue States**
```bash
# Main queue length
redis-cli -h localhost -p 6379 LLEN bull:insight

# All queue statuses
redis-cli -h localhost -p 6379 LLEN bull:insight:wait
redis-cli -h localhost -p 6379 LLEN bull:insight:active
redis-cli -h localhost -p 6379 LLEN bull:insight:completed
redis-cli -h localhost -p 6379 LLEN bull:insight:failed
```

#### **Queue Health Dashboard**
```bash
# One-liner status check
echo "=== Insight Queue Status ===" && \
echo "Main: $(redis-cli -h localhost -p 6379 LLEN bull:insight)" && \
echo "Waiting: $(redis-cli -h localhost -p 6379 LLEN bull:insight:wait)" && \
echo "Active: $(redis-cli -h localhost -p 6379 LLEN bull:insight:active)" && \
echo "Completed: $(redis-cli -h localhost -p 6379 LLEN bull:insight:completed)" && \
echo "Failed: $(redis-cli -h localhost -p 6379 LLEN bull:insight:failed)"
```

### **3. LLM Interaction Verification**

#### **Check Database Records**
```bash
# Count total insight worker interactions
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT COUNT(*) FROM llm_interactions WHERE worker_type = 'insight-worker';"

# View recent interactions
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT 
  interaction_id,
  worker_job_id,
  LEFT(full_prompt, 100) as prompt_preview,
  created_at
FROM llm_interactions 
WHERE worker_type = 'insight-worker' 
ORDER BY created_at DESC 
LIMIT 5;"
```

#### **Check Specific Job Interactions**
```bash
# Replace JOB_ID with actual job ID
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT 
  interaction_id,
  LEFT(full_prompt, 50) as prompt_preview,
  created_at
FROM llm_interactions 
WHERE worker_type = 'insight-worker' 
  AND worker_job_id = 'JOB_ID'
ORDER BY created_at DESC;"
```

### **4. Worker Process Monitoring**

#### **PM2 Status Commands**
```bash
# Check worker status
pm2 status | grep insight-worker

# Detailed worker info
pm2 show insight-worker

# Worker logs
pm2 logs insight-worker --lines 20

# Monitor all PM2 processes
pm2 monit
```

#### **Process Health Check**
```bash
# Check if worker is responding
pm2 jlist | jq -r '.[] | select(.name=="insight-worker") | .pm2_env.status'

# Check restart count
pm2 jlist | jq -r '.[] | select(.name=="insight-worker") | .pm2_env.restart_time'
```

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **Issue 1: Worker Not Processing Jobs**

**Symptoms:**
- Job added but queue length stays > 0
- No worker logs showing job processing
- Job remains in 'wait' queue

**Diagnosis:**
```bash
# Check worker status
pm2 status | grep insight-worker

# Check worker logs for errors
pm2 logs insight-worker --lines 50 | grep -i error

# Verify Redis connection
redis-cli -h localhost -p 6379 ping
```

**Solutions:**
```bash
# Restart worker
pm2 restart insight-worker

# Or restart all services
pm2 restart all

# Check environment variables
pm2 show insight-worker | grep -A 10 "exec cwd"
```

#### **Issue 2: Job Fails During Processing**

**Symptoms:**
- Job appears in 'failed' queue
- Worker logs show error messages
- No LLM interactions recorded

**Diagnosis:**
```bash
# Check failed jobs
redis-cli -h localhost -p 6379 LRANGE bull:insight:failed 0 -1

# Check worker error logs
pm2 logs insight-worker --lines 50 | grep -i error

# Check database connection
docker exec postgres-2d1l pg_isready -U danniwang
```

**Common Causes & Fixes:**
- **Database connection issues**: Restart PostgreSQL container
- **Environment variables missing**: Restart worker with `pm2 restart insight-worker`
- **LLM API key issues**: Check `GOOGLE_API_KEY` in environment
- **Memory issues**: Check worker memory usage with `pm2 monit`

#### **Issue 3: No LLM Interactions Logged**

**Symptoms:**
- Job completes successfully
- No records in `llm_interactions` table
- Worker logs show no LLM calls

**Diagnosis:**
```bash
# Check if insight worker is logging anything
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT COUNT(*) as total_records FROM llm_interactions WHERE worker_type = 'insight-worker';"

# Check worker configuration
pm2 show insight-worker | grep -A 10 "exec cwd"

# Verify database permissions
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT current_user, current_database();"
```

**Solutions:**
```bash
# Restart worker to reload configuration
pm2 restart insight-worker

# Check database schema
cd packages/database && pnpm db:generate

# Verify environment variables
pm2 exec insight-worker -- env | grep -E "(DATABASE_URL|GOOGLE_API_KEY)"
```

#### **Issue 4: Redis Connection Problems**

**Symptoms:**
- Connection refused errors
- Queue operations fail
- Worker can't connect to Redis

**Diagnosis:**
```bash
# Check Redis container status
docker ps | grep redis

# Test Redis connection
docker exec redis-2d1l redis-cli ping

# Check Redis logs
docker logs redis-2d1l --tail 20
```

**Solutions:**
```bash
# Restart Redis container
docker-compose -f docker-compose.dev.yml restart redis

# Check Redis configuration
docker exec redis-2d1l redis-cli CONFIG GET bind

# Verify network connectivity
docker network ls | grep 2d1l
```

#### **Issue 5: Environment Variable Issues**

**Symptoms:**
- "Environment variable not found" errors
- Database connection failures
- API key authentication errors

**Diagnosis:**
```bash
# Check environment loading
pm2 exec insight-worker -- env | grep -E "(DATABASE_URL|REDIS_URL|GOOGLE_API_KEY)"

# Verify .env file exists
ls -la .env

# Check environment loader
pm2 logs insight-worker --lines 10 | grep -i "environment"
```

**Solutions:**
```bash
# Restart with fresh environment
pm2 delete insight-worker
pm2 start ecosystem.config.js

# Verify environment variables are loaded
source .env
echo $DATABASE_URL
echo $GOOGLE_API_KEY
```

---

## 🔄 **AUTOMATED TRIGGERING**

### **Scheduled Jobs (Cron)**

#### **Daily Insight Generation**
```bash
# Add to crontab for daily insight generation
# Edit crontab: crontab -e

# Run insight job every day at 2 AM
0 2 * * * cd /path/to/2D1L && node scripts/GUIDES/trigger-insight.js >> logs/insight-cron.log 2>&1

# Run with enhanced monitoring every 6 hours
0 */6 * * * cd /path/to/2D1L && node scripts/GUIDES/trigger-insight-enhanced.js --monitor >> logs/insight-enhanced.log 2>&1
```

#### **Continuous Monitoring Script**
```bash
# Create a monitoring script that triggers jobs when needed
cat > scripts/insight-monitor.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/.."

# Check if insight worker is healthy
if ! pm2 jlist | jq -e '.[] | select(.name=="insight-worker" and .pm2_env.status=="online")' > /dev/null; then
    echo "Insight worker not running, restarting..."
    pm2 restart insight-worker
fi

# Check queue status
queue_length=$(redis-cli -h localhost -p 6379 LLEN bull:insight)
if [ "$queue_length" -eq 0 ]; then
    echo "Queue empty, triggering new insight job..."
    node scripts/GUIDES/trigger-insight.js
else
    echo "Queue has $queue_length jobs, skipping..."
fi
EOF

chmod +x scripts/insight-monitor.sh
```

### **API-Based Triggering**

#### **REST API Endpoint**
```bash
# Trigger insight job via API (if implemented)
curl -X POST http://localhost:3001/api/v1/insight/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{"userId": "dev-user-123"}'
```

#### **Programmatic Triggering**
```javascript
// Trigger insight job from Node.js code
const { triggerInsightJob } = require('./scripts/GUIDES/trigger-insight-enhanced.js');

await triggerInsightJob('dev-user-123', { monitor: true });
```

---

## 📈 **PERFORMANCE MONITORING**

### **Job Processing Metrics**

#### **Processing Time Analysis**
```bash
# Monitor how long jobs take to process
watch -n 5 'echo "=== Insight Worker Performance ===" && \
echo "Queue length: $(redis-cli -h localhost -p 6379 LLEN bull:insight)" && \
echo "Active jobs: $(redis-cli -h localhost -p 6379 LLEN bull:insight:active)" && \
echo "Completed today: $(redis-cli -h localhost -p 6379 LLEN bull:insight:completed)" && \
echo "Worker status: $(pm2 jlist | jq -r ".[] | select(.name==\"insight-worker\") | .pm2_env.status")"'
```

#### **LLM Interaction Metrics**
```bash
# Check LLM interaction patterns
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT 
  DATE(created_at) as date,
  COUNT(*) as interactions,
  AVG(LENGTH(full_prompt)) as avg_prompt_length,
  AVG(LENGTH(raw_response)) as avg_response_length
FROM llm_interactions 
WHERE worker_type = 'insight-worker' 
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;"
```

### **Resource Usage Monitoring**

#### **Memory and CPU Usage**
```bash
# Monitor worker resource usage
pm2 monit

# Check specific worker stats
pm2 show insight-worker | grep -E "(memory|cpu|uptime)"

# Monitor Docker container resources
docker stats --no-stream | grep -E "(redis|postgres|neo4j|weaviate)"
```

#### **Database Performance**
```bash
# Check PostgreSQL query performance
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '1 seconds' 
ORDER BY duration DESC;"
```

---

## 📝 **VERIFICATION CHECKLIST**

### **After Triggering a Job**
- [ ] Job added successfully (Job ID returned)
- [ ] Queue length shows 0 (job picked up immediately)
- [ ] Worker logs show job processing
- [ ] Job appears in 'completed' queue
- [ ] LLM interactions recorded in database
- [ ] No errors in worker logs
- [ ] Derived artifacts created (if applicable)
- [ ] Graph updates applied (if applicable)

### **If Issues Occur**
- [ ] Check worker status with `pm2 status`
- [ ] Check Redis queue status
- [ ] Check database connectivity
- [ ] Check environment variables
- [ ] Check worker logs for errors
- [ ] Restart worker if needed
- [ ] Verify LLM API keys
- [ ] Check memory usage

---

## 🎯 **QUICK REFERENCE COMMANDS**

### **Essential Commands**
```bash
# Trigger job (basic)
node scripts/GUIDES/trigger-insight.js

# Trigger job (enhanced)
node scripts/GUIDES/trigger-insight-enhanced.js --monitor

# Check status
node scripts/GUIDES/trigger-insight-enhanced.js --status

# Monitor worker
pm2 logs insight-worker --lines 0

# Check queue status
redis-cli -h localhost -p 6379 LLEN bull:insight

# Check database records
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT COUNT(*) FROM llm_interactions WHERE worker_type = 'insight-worker';"

# Restart worker
pm2 restart insight-worker
```

### **Debug Commands**
```bash
# Check all Redis keys
redis-cli -h localhost -p 6379 KEYS "bull:insight:*"

# View queue events
redis-cli -h localhost -p 6379 XREAD COUNT 5 STREAMS bull:insight:events 0

# Check worker process
pm2 show insight-worker

# View recent errors
pm2 logs insight-worker --lines 50 | grep -i error

# Check environment variables
pm2 exec insight-worker -- env | grep -E "(DATABASE_URL|REDIS_URL|GOOGLE_API_KEY)"
```

### **Monitoring Commands**
```bash
# Real-time monitoring dashboard
pm2 monit

# Watch queue status
watch -n 2 'redis-cli -h localhost -p 6379 LLEN bull:insight'

# Monitor worker logs
pm2 logs insight-worker --lines 0

# Check system resources
docker stats --no-stream
```

---

## 📚 **RELATED DOCUMENTATION**

### **Code References**
- **InsightEngine**: `workers/insight-worker/src/InsightEngine.ts`
- **InsightDataCompiler**: `workers/insight-worker/src/InsightDataCompiler.ts`
- **StrategicSynthesisTool**: `packages/tools/src/StrategicSynthesisTool.ts`
- **Worker Configuration**: `ecosystem.config.js`

### **Configuration Files**
- **Environment**: `.env` file
- **PM2 Ecosystem**: `ecosystem.config.js`
- **Docker Compose**: `docker-compose.dev.yml`

### **Related Guides**
- **Daily Workflow**: `scripts/GUIDES/DAILY_WORKFLOW.md`
- **Troubleshooting**: `scripts/GUIDES/TROUBLESHOOTING_GUIDE.md`
- **Installation**: `scripts/GUIDES/INSTALLATION_GUIDE.md`
- **Database Setup**: `scripts/GUIDES/DATABASE_RESET_GUIDE.md`

---

## 🆘 **GETTING HELP**

### **If This Guide Doesn't Help**
1. **Check the troubleshooting section** above
2. **Review worker logs** with `pm2 logs insight-worker --lines 100`
3. **Check system health** with `pnpm health:check`
4. **Refer to emergency procedures** in `scripts/GUIDES/TROUBLESHOOTING_GUIDE.md`

### **Common Support Questions**
- **Q**: "Job added but not processed" → Check worker status and restart if needed
- **Q**: "No LLM interactions logged" → Check database connection and worker configuration
- **Q**: "Worker keeps crashing" → Check environment variables and restart services
- **Q**: "Queue not working" → Check Redis connection and container status

---

**Last Updated**: January 6, 2025  
**Tested With**: 2D1L V11.0  
**Worker Type**: insight-worker  
**Queue Name**: insight  
**Script Versions**: Basic 1.0.0, Enhanced 2.0.0

---

*This comprehensive guide provides everything needed to work with the insight worker effectively. For advanced graph algorithms or specific requirements, refer to the InsightEngine implementation or the official BullMQ documentation.*
