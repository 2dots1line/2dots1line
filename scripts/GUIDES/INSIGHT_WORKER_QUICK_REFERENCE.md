# 🚀 **INSIGHT WORKER - QUICK REFERENCE CARD**
*Essential commands and procedures for 2D1L insight worker management*

---

## ⚡ **ESSENTIAL COMMANDS**

### **Trigger Insight Job**
```bash
# Quick trigger (uses default user)
node scripts/GUIDES/trigger-insight.js

# Trigger for specific user
node scripts/GUIDES/trigger-insight.js dev-user-123

# Get help
node scripts/GUIDES/trigger-insight.js --help
```

### **Monitor Worker Status**
```bash
# Check if running
pm2 status | grep insight-worker

# View logs (real-time)
pm2 logs insight-worker --lines 0

# View recent logs
pm2 logs insight-worker --lines 20
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
```

### **Verify LLM Logging**
```bash
# Count total records
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT COUNT(*) FROM llm_interactions WHERE worker_type = 'insight-worker';"

# View recent interactions
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT interaction_id, worker_job_id, LEFT(full_prompt, 100) as prompt_preview, created_at FROM llm_interactions WHERE worker_type = 'insight-worker' ORDER BY created_at DESC LIMIT 3;"
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
```

### **No LLM Interactions Logged**
```bash
# Check database connection
docker exec postgres-2d1l pg_isready -U danniwang

# Restart all services
pm2 restart all
```

### **Worker Won't Start**
```bash
# Check environment
pm2 show insight-worker | grep -A 10 "exec cwd"

# Start all services
pm2 start ecosystem.config.js
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

---

## 🎯 **WORKFLOW SUMMARY**

### **Complete Workflow**
1. **Check Status**: `pm2 status | grep insight-worker`
2. **Trigger Job**: `node scripts/GUIDES/trigger-insight.js`
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

---

## 📚 **FULL DOCUMENTATION**

- **Complete Guide**: `scripts/GUIDES/INSIGHT_WORKER_TRIGGER_GUIDE.md`
- **Test Script**: `scripts/GUIDES/test-insight-trigger.sh`
- **Troubleshooting**: `scripts/GUIDES/TROUBLESHOOTING_GUIDE.md`

---

**Quick Test**: Run `./scripts/GUIDES/test-insight-trigger.sh` for guided testing
