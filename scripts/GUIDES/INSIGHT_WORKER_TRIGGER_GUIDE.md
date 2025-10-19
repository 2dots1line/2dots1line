# 🚀 **INSIGHT WORKER TRIGGER GUIDE - 2D1L**
*Complete instructions for manually triggering and monitoring insight worker jobs*

---

## 📋 **OVERVIEW**

The **Insight Worker** is a background service that processes strategic analysis jobs from the Redis queue. This guide shows you how to:

1. **Trigger insight worker jobs** manually
2. **Monitor job processing** in real-time
3. **Verify LLM interactions** are logged
4. **Troubleshoot common issues**

---

## 🎯 **QUICK START - TRIGGER INSIGHT JOB**

### **Step 1: Ensure Services Are Running**
```bash
# Check if insight worker is running
pm2 status | grep insight-worker

# If not running, start all services
pm2 start ecosystem.config.js
```

### **Step 2: Trigger the Job**
```bash
# Use the trigger script (recommended)
node scripts/trigger-insight.js

# Expected output:
# ✅ Insight job added successfully!
# Job ID: 1
# Job data: { userId: 'dev-user-123' }
# Queue length: 0
```

### **Step 3: Monitor Processing**
```bash
# Watch the job being processed
pm2 logs insight-worker --lines 20
```

---

## 🔧 **DETAILED TRIGGER PROCEDURES**

### **Method 1: Using the Trigger Script (Recommended)**

#### **File Location**
```
scripts/trigger-insight.js
```

#### **What It Does**
- Creates a BullMQ job in the 'insight-queue'
- Uses `dev-user-123` as the default user ID
- Automatically closes the queue connection
- Shows job ID and queue status

#### **Run Command**
```bash
# From project root
node scripts/trigger-insight.js
```

#### **Expected Success Output**
```
✅ Insight job added successfully!
Job ID: 1
Job data: { userId: 'dev-user-123' }
Queue length: 0
```

**Note**: Queue length 0 means the job was immediately picked up by the worker.

### **Method 2: Manual Queue Job Creation**

#### **Using Node.js REPL**
```bash
# Start Node.js REPL
node

# In the REPL:
const { Queue } = require('bullmq');
const queue = new Queue('insight-queue', {
  connection: { host: 'localhost', port: 6379 }
});

const jobData = {
  userId: 'dev-user-123'
};

queue.add('user-cycle', jobData).then(job => {
  console.log('Job enqueued:', job.id);
  queue.close();
});
```

#### **Using Redis CLI Directly**
```bash
# Check if insight queue exists
redis-cli -h localhost -p 6379 KEYS "bull:insight:*"

# Add job manually (advanced users only)
redis-cli -h localhost -p 6379 LPUSH "bull:insight:wait" '{"data":{"userId":"dev-user-123"},"name":"user-cycle"}'
```

---

## 📊 **MONITORING & VERIFICATION**

### **1. Real-Time Job Processing Monitor**

#### **Watch Worker Logs**
```bash
# Follow insight worker logs in real-time
pm2 logs insight-worker --lines 0

# Or view recent logs
pm2 logs insight-worker --lines 50
```

#### **Monitor Redis Queue Status**
```bash
# Check queue lengths
redis-cli -h localhost -p 6379 LLEN bull:insight
redis-cli -h localhost -p 6379 LLEN bull:insight:wait
redis-cli -h localhost -p 6379 LLEN bull:insight:active
redis-cli -h localhost -p 6379 LLEN bull:insight:completed
redis-cli -h localhost -p 6379 LLEN bull:insight:failed
```

#### **View Queue Events**
```bash
# See all queue events (jobs added, processed, completed)
redis-cli -h localhost -p 6379 XREAD COUNT 10 STREAMS bull:insight:events 0
```

### **2. Verify LLM Interactions Logging**

#### **Check Database for New Records**
```bash
# Connect to PostgreSQL and check for insight worker records
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT 
  interaction_id,
  worker_type,
  worker_job_id,
  LEFT(full_prompt, 100) as prompt_preview,
  LEFT(raw_response, 100) as response_preview,
  created_at
FROM llm_interactions 
WHERE worker_type = 'insight-worker' 
ORDER BY created_at DESC 
LIMIT 3;"
```

#### **Expected Database Output**
```
 worker_type   |                prompt_preview                |       response_preview        |       created_at        
----------------+---------------------------------------------------+-------------------------------+-------------------------
 insight-worker | You are the InsightEngine component...       | ###==BEGIN_JSON==###         | 2025-08-22 22:34:58.312
                | performing strategic cyclical analysis...    | {                            | 
                | Follow the instructions precisely...         |   "ontology_optimizations": { | 
```

### **3. Verify Job Completion**

#### **Check Job Status in Redis**
```bash
# View completed jobs
redis-cli -h localhost -p 6379 LRANGE bull:insight:completed 0 -1

# View failed jobs (should be empty if successful)
redis-cli -h localhost -p 6379 LRANGE bull:insight:failed 0 -1
```

#### **Check Worker Process Status**
```bash
# Verify worker is still running
pm2 show insight-worker

# Check for any errors
pm2 logs insight-worker --lines 10 | grep -i error
```

---

## 🚨 **TROUBLESHOOTING COMMON ISSUES**

### **Issue 1: Job Not Being Processed**

#### **Symptoms**
- Job added but queue length stays > 0
- No worker logs showing job processing
- Job remains in 'wait' queue

#### **Diagnosis Steps**
```bash
# 1. Check if worker is running
pm2 status | grep insight-worker

# 2. Check worker logs for errors
pm2 logs insight-worker --lines 20

# 3. Verify Redis connection
redis-cli -h localhost -p 6379 ping
```

#### **Solutions**
```bash
# Restart the worker
pm2 restart insight-worker

# Or restart all services
pm2 restart all
```

### **Issue 2: Job Fails During Processing**

#### **Symptoms**
- Job appears in 'failed' queue
- Worker logs show error messages
- No LLM interactions recorded

#### **Diagnosis Steps**
```bash
# 1. Check failed jobs
redis-cli -h localhost -p 6379 LRANGE bull:insight:failed 0 -1

# 2. Check worker error logs
pm2 logs insight-worker --lines 50 | grep -i error

# 3. Check database connection
docker exec postgres-2d1l pg_isready -U danniwang
```

#### **Common Causes & Fixes**
- **Database connection issues**: Restart PostgreSQL container
- **Environment variables missing**: Restart worker with `pm2 restart insight-worker`
- **LLM API key issues**: Check `GOOGLE_API_KEY` in environment

### **Issue 3: No LLM Interactions Logged**

#### **Symptoms**
- Job completes successfully
- No records in `llm_interactions` table
- Worker logs show no LLM calls

#### **Diagnosis Steps**
```bash
# 1. Check if insight worker is logging anything
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT COUNT(*) as total_records FROM llm_interactions WHERE worker_type = 'insight-worker';"

# 2. Check worker configuration
pm2 show insight-worker | grep -A 10 "exec cwd"

# 3. Verify database permissions
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT current_user, current_database();"
```

#### **Solutions**
```bash
# Restart worker to reload configuration
pm2 restart insight-worker

# Check database schema
cd packages/database && pnpm db:generate
```

---

## 📈 **PERFORMANCE MONITORING**

### **Job Processing Time**
```bash
# Monitor how long jobs take to process
watch -n 2 'echo "=== Insight Worker Status ===" && \
echo "Queue length: $(redis-cli -h localhost -p 6379 LLEN bull:insight)" && \
echo "Active jobs: $(redis-cli -h localhost -p 6379 LLEN bull:insight:active)" && \
echo "Completed today: $(redis-cli -h localhost -p 6379 LLEN bull:insight:completed)" && \
echo "Worker status: $(pm2 jlist | jq -r ".[] | select(.name==\"insight-worker\") | .pm2_env.status")"'
```

### **LLM Interaction Metrics**
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

---

## 🔄 **AUTOMATED TRIGGERING**

### **Scheduled Jobs (Cron)**
```bash
# Add to crontab for daily insight generation
# Edit crontab: crontab -e

# Run insight job every day at 2 AM
0 2 * * * cd /path/to/2D1L && node scripts/trigger-insight.js >> logs/insight-cron.log 2>&1
```

### **Continuous Monitoring Script**
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
    node scripts/trigger-insight.js
else
    echo "Queue has $queue_length jobs, skipping..."
fi
EOF

chmod +x scripts/insight-monitor.sh
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

### **If Issues Occur**
- [ ] Check worker status with `pm2 status`
- [ ] Check Redis queue status
- [ ] Check database connectivity
- [ ] Check environment variables
- [ ] Check worker logs for errors
- [ ] Restart worker if needed

---

## 🎯 **QUICK REFERENCE COMMANDS**

### **Essential Commands**
```bash
# Trigger job
node scripts/trigger-insight.js

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
```

---

## 📚 **RELATED DOCUMENTATION**

- **Daily Workflow**: `scripts/GUIDES/DAILY_WORKFLOW.md`
- **Troubleshooting**: `scripts/GUIDES/TROUBLESHOOTING_GUIDE.md`
- **Installation**: `scripts/GUIDES/INSTALLATION_GUIDE.md`
- **Monitoring**: `docs/MONITORING_GUIDE.md`

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

---

**Last Updated**: January 6, 2025  
**Tested With**: 2D1L V11.0  
**Worker Type**: insight-worker  
**Queue Name**: insight
