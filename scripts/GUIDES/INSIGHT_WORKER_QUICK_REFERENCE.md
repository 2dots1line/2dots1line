# 🚀 **INSIGHT WORKER - QUICK REFERENCE CARD**
*Essential commands and procedures for 2D1L insight worker management*

---

## ⚡ **ESSENTIAL COMMANDS**

### **Trigger Insight Job**
```bash
# Quick trigger (uses default user)
node scripts/GUIDES/trigger-insight.js

# Enhanced trigger with monitoring
node scripts/GUIDES/trigger-insight-enhanced.js --monitor

# Trigger for specific user
node scripts/GUIDES/trigger-insight-enhanced.js dev-user-123 --monitor

# Check status only
node scripts/GUIDES/trigger-insight-enhanced.js --status

# Get help
node scripts/GUIDES/trigger-insight-enhanced.js --help
```

### **Monitor Worker Status**
```bash
# Check if running
pm2 status | grep insight-worker

# View logs (real-time)
pm2 logs insight-worker --lines 0

# View recent logs
pm2 logs insight-worker --lines 20

# Monitor all PM2 processes
pm2 monit
```

### **Check Queue Status**
```bash
# Main queue length
redis-cli -h localhost -p 6379 LLEN bull:insight

# All queue statuses
redis-cli -h localhost -p 6379 LLEN bull:insight:wait
redis-cli -h localhost -p 6379 LLEN bull:insight:active
redis-cli -h localhost -p 6379 LLEN bull:insight:completed
redis-cli -h localhost -p 6379 LLEN bull:insight:failed

# Quick status dashboard
echo "=== Insight Queue Status ===" && \
echo "Main: $(redis-cli -h localhost -p 6379 LLEN bull:insight)" && \
echo "Waiting: $(redis-cli -h localhost -p 6379 LLEN bull:insight:wait)" && \
echo "Active: $(redis-cli -h localhost -p 6379 LLEN bull:insight:active)" && \
echo "Completed: $(redis-cli -h localhost -p 6379 LLEN bull:insight:completed)" && \
echo "Failed: $(redis-cli -h localhost -p 6379 LLEN bull:insight:failed)"
```

### **Verify LLM Logging**
```bash
# Count total records
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT COUNT(*) FROM llm_interactions WHERE worker_type = 'insight-worker';"

# View recent interactions
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT interaction_id, worker_job_id, LEFT(full_prompt, 100) as prompt_preview, created_at FROM llm_interactions WHERE worker_type = 'insight-worker' ORDER BY created_at DESC LIMIT 3;"

# Check specific job interactions (replace JOB_ID)
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT interaction_id, LEFT(full_prompt, 50) as prompt_preview, created_at FROM llm_interactions WHERE worker_type = 'insight-worker' AND worker_job_id = 'JOB_ID' ORDER BY created_at DESC;"
```

---

## 🔧 **TROUBLESHOOTING**

### **Worker Not Processing Jobs**
```bash
# Restart worker
pm2 restart insight-worker

# Check for errors
pm2 logs insight-worker --lines 50 | grep -i error

# Verify Redis connection
redis-cli -h localhost -p 6379 ping

# Check environment variables
pm2 exec insight-worker -- env | grep -E "(DATABASE_URL|REDIS_URL|GOOGLE_API_KEY)"
```

### **No LLM Interactions Logged**
```bash
# Check database connection
docker exec postgres-2d1l pg_isready -U danniwang

# Restart all services
pm2 restart all

# Check worker configuration
pm2 show insight-worker | grep -A 10 "exec cwd"
```

### **Worker Won't Start**
```bash
# Check environment
pm2 show insight-worker | grep -A 10 "exec cwd"

# Start all services
pm2 start ecosystem.config.js

# Check for port conflicts
lsof -i :6379
```

### **Queue Issues**
```bash
# Check Redis container
docker ps | grep redis

# Restart Redis
docker-compose -f docker-compose.dev.yml restart redis

# Check Redis logs
docker logs redis-2d1l --tail 20
```

---

## 📊 **MONITORING DASHBOARD**

### **Real-Time Status Monitor**
```bash
# Watch queue and worker status
watch -n 2 'echo "=== Insight Worker Status ===" && \
echo "Queue: $(redis-cli -h localhost -p 6379 LLEN bull:insight)" && \
echo "Worker: $(pm2 jlist | jq -r ".[] | select(.name==\"insight-worker\") | .pm2_env.status")" && \
echo "Completed: $(redis-cli -h localhost -p 6379 LLEN bull:insight:completed)"'
```

### **Quick Health Check**
```bash
# One-liner health check
echo "Worker: $(pm2 jlist | jq -r '.[] | select(.name=="insight-worker") | .pm2_env.status')" && \
echo "Queue: $(redis-cli -h localhost -p 6379 LLEN bull:insight)" && \
echo "DB Records: $(docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT COUNT(*) FROM llm_interactions WHERE worker_type = 'insight-worker';" -t | tr -d ' \n')"
```

### **Performance Monitoring**
```bash
# Monitor resource usage
pm2 monit

# Check worker stats
pm2 show insight-worker | grep -E "(memory|cpu|uptime)"

# Monitor Docker resources
docker stats --no-stream | grep -E "(redis|postgres|neo4j|weaviate)"
```

---

## 🎯 **WORKFLOW SUMMARY**

### **Complete Workflow**
1. **Check Status**: `pm2 status | grep insight-worker`
2. **Trigger Job**: `node scripts/GUIDES/trigger-insight-enhanced.js --monitor`
3. **Monitor**: `pm2 logs insight-worker --lines 0`
4. **Verify**: Check database for new LLM interactions
5. **Troubleshoot**: Use commands above if issues occur

### **Expected Output**
```
✅ Insight job added successfully!
Job ID: 1
Job data: { userId: 'dev-user-123' }
Queue length: 0
Job status: waiting
```

**Queue length 0** = Job immediately picked up by worker ✅

### **Success Indicators**
- ✅ Job ID returned
- ✅ Queue length shows 0
- ✅ Worker logs show processing
- ✅ LLM interactions recorded in database
- ✅ Job appears in 'completed' queue

---

## 🚨 **EMERGENCY COMMANDS**

### **Quick Recovery**
```bash
# Nuclear restart
pm2 delete insight-worker && pm2 start ecosystem.config.js

# Full system restart
pm2 restart all

# Check all services
pnpm health:check
```

### **Debug Mode**
```bash
# Enhanced trigger with verbose monitoring
node scripts/GUIDES/trigger-insight-enhanced.js --monitor --verbose

# Check all Redis keys
redis-cli -h localhost -p 6379 KEYS "bull:insight:*"

# View queue events
redis-cli -h localhost -p 6379 XREAD COUNT 5 STREAMS bull:insight:events 0
```

---

## 📚 **FULL DOCUMENTATION**

- **Complete Guide**: `scripts/GUIDES/INSIGHT_WORKER_COMPLETE_GUIDE.md`
- **Basic Trigger**: `scripts/GUIDES/trigger-insight.js`
- **Enhanced Trigger**: `scripts/GUIDES/trigger-insight-enhanced.js`
- **Troubleshooting**: `scripts/GUIDES/TROUBLESHOOTING_GUIDE.md`

---

**Quick Test**: Run `node scripts/GUIDES/trigger-insight-enhanced.js --status` for system health check
