# 🚀 **INGESTION WORKER TRIGGER GUIDE - 2D1L**
*Complete instructions for manually triggering and monitoring ingestion worker jobs*

---

## 📋 **OVERVIEW**

The **Ingestion Worker** is a background service that processes conversation analysis jobs from the Redis queue. This guide shows you how to:

1. **Trigger ingestion worker jobs** manually for specific conversations
2. **Reprocess failed conversations** that may have encountered errors
3. **Monitor job processing** in real-time
4. **Troubleshoot common issues**

---

## 🎯 **QUICK START - REPROCESS A CONVERSATION**

### **Step 1: Ensure Services Are Running**
```bash
# Check if ingestion worker is running
pm2 status | grep ingestion-worker

# If not running, start all services
pm2 start ecosystem.config.js
```

### **Step 2: Trigger the Job**
```bash
# Use the trigger script with a specific conversation ID
node scripts/trigger-ingestion.js "your-conversation-id-here"

# Example with specific user ID
node scripts/trigger-ingestion.js "conversation-123" "user-456"

# Expected output:
# ✅ Ingestion job added successfully!
# Job ID: manual-conversation-123-1703123456789
# Queue: ingestion-queue
```

### **Step 3: Monitor Processing**
```bash
# Watch the job being processed
pm2 logs ingestion-worker --lines 50
```

---

## 🔧 **DETAILED TRIGGER PROCEDURES**

### **Method 1: Using the Dedicated Trigger Script (Recommended)**

#### **File Location**
```
scripts/trigger-ingestion.js
```

#### **What It Does**
- Creates a BullMQ job in the 'ingestion-queue'
- Allows you to specify any conversation ID
- Supports custom user ID (defaults to 'dev-user-123')
- Includes retry logic and proper error handling
- Provides detailed monitoring instructions

#### **Run Command**
```bash
# From project root
node scripts/trigger-ingestion.js <conversationId> [userId]
```

#### **Examples**
```bash
# Reprocess a specific conversation
node scripts/trigger-ingestion.js "db5e7751-e6e2-473d-95b8-058a0414eb80"

# Reprocess with specific user ID
node scripts/trigger-ingestion.js "conversation-123" "user-456"

# Test with a known conversation that has entities
node scripts/trigger-ingestion.js "debug-neo4j-test"
```

#### **Expected Success Output**
```
🚀 Manual Ingestion Worker Trigger
==================================
📝 Conversation ID: db5e7751-e6e2-473d-95b8-058a0414eb80
👤 User ID: dev-user-123

📤 Adding ingestion job to queue...
Job data: {
  "conversationId": "db5e7751-e6e2-473d-95b8-058a0414eb80",
  "userId": "dev-user-123",
  "timestamp": "2025-01-09T10:30:45.123Z",
  "manualTrigger": true
}

✅ Ingestion job added successfully!
🆔 Job ID: manual-db5e7751-e6e2-473d-95b8-058a0414eb80-1703123456789
📊 Queue: ingestion-queue
```

### **Method 2: Using Existing Test Scripts**

#### **For Testing with New Conversation**
```bash
# Creates a test conversation with timestamp
node scripts/test-ingestion-worker.js
```

#### **For Testing with Existing Conversation**
```bash
# Uses a predefined conversation with rich content
node scripts/test-ingestion-with-entities.js
```

### **Method 3: Manual Queue Job Creation**

#### **Using Node.js REPL**
```bash
# Start Node.js REPL
node

# In the REPL:
const { Queue } = require('bullmq');
const queue = new Queue('ingestion-queue', {
  connection: { host: 'localhost', port: 6379 }
});

const jobData = {
  conversationId: 'your-conversation-id',
  userId: 'dev-user-123',
  timestamp: new Date().toISOString()
};

const job = await queue.add('process-conversation', jobData, {
  removeOnComplete: 10,
  removeOnFail: 1000
});

console.log('Job added:', job.id);
await queue.close();
```

---

## 📊 **MONITORING & VERIFICATION**

### **Step 1: Check Worker Status**
```bash
# Verify worker is running
pm2 status | grep ingestion-worker

# Expected output shows "online" status
```

### **Step 2: Monitor Job Processing**
```bash
# Watch real-time logs
pm2 logs ingestion-worker --lines 50

# Follow logs continuously
pm2 logs ingestion-worker --follow
```

### **Step 3: Look for Success Messages**
```
✅ SUCCESS INDICATORS:
- [IngestionWorker] Processing job <job-id>: <conversation-id>
- [IngestionAnalyst] Successfully processed conversation <conversation-id>
- [IngestionAnalyst] created <X> new entities
- [IngestionWorker] Job <job-id> completed successfully
```

### **Step 4: Check for Errors**
```bash
# Look for error messages
pm2 logs ingestion-worker --lines 100 | grep -A 10 -B 10 "ERROR"

# Check for failed jobs
pm2 logs ingestion-worker --lines 100 | grep -A 5 -B 5 "failed"
```

### **Step 5: Verify Database Changes**
```bash
# Check if entities were created in PostgreSQL
docker exec postgres-2d1l psql -U postgres -d 2d1l_db -c "
SELECT COUNT(*) as memory_units FROM memory_units WHERE conversation_id = 'your-conversation-id';
SELECT COUNT(*) as concepts FROM concepts WHERE conversation_id = 'your-conversation-id';
"

# Check Neo4j for graph entities
docker exec neo4j-2d1l cypher-shell -u neo4j -p password "
MATCH (n) WHERE n.conversationId = 'your-conversation-id' RETURN labels(n), count(n);
"
```

---

## 🔍 **TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **Issue 1: Worker Not Running**
```bash
# Check worker status
pm2 status | grep ingestion-worker

# If not running, restart
pm2 restart ingestion-worker

# If still not working, check logs
pm2 logs ingestion-worker --lines 20
```

#### **Issue 2: Redis Connection Problems**
```bash
# Check Redis is running
docker ps | grep redis

# Test Redis connection
docker exec redis-2d1l redis-cli ping

# Check queue status
docker exec redis-2d1l redis-cli KEYS "bull:ingestion-queue:*"
```

#### **Issue 3: Job Not Being Picked Up**
```bash
# Check queue length
docker exec redis-2d1l redis-cli LLEN "bull:ingestion-queue:waiting"

# Check for stuck jobs
docker exec redis-2d1l redis-cli LLEN "bull:ingestion-queue:failed"
```

#### **Issue 4: LLM API Errors**
```bash
# Check for API key issues
pm2 logs ingestion-worker --lines 50 | grep -i "api\|key\|auth"

# Verify environment variables
echo $OPENAI_API_KEY
echo $GEMINI_API_KEY
```

#### **Issue 5: Database Connection Issues**
```bash
# Check PostgreSQL connection
docker exec postgres-2d1l psql -U postgres -d 2d1l_db -c "SELECT 1;"

# Check Neo4j connection
docker exec neo4j-2d1l cypher-shell -u neo4j -p password "RETURN 1;"
```

---

## 📝 **FINDING CONVERSATION IDs**

### **From Database**
```bash
# Get recent conversations
docker exec postgres-2d1l psql -U postgres -d 2d1l_db -c "
SELECT id, user_id, status, created_at 
FROM conversations 
ORDER BY created_at DESC 
LIMIT 10;
"

# Get failed conversations
docker exec postgres-2d1l psql -U postgres -d 2d1l_db -c "
SELECT id, user_id, status, created_at 
FROM conversations 
WHERE status = 'ended' 
AND id NOT IN (
  SELECT DISTINCT conversation_id 
  FROM memory_units 
  WHERE conversation_id IS NOT NULL
)
ORDER BY created_at DESC;
"
```

### **From Logs**
```bash
# Find conversation IDs in recent logs
pm2 logs ingestion-worker --lines 200 | grep -o "conversation [a-f0-9-]*" | sort | uniq

# Find failed conversation IDs
pm2 logs ingestion-worker --lines 500 | grep -B 5 -A 5 "failed" | grep -o "conversation [a-f0-9-]*"
```

---

## 🎯 **BEST PRACTICES**

### **Before Triggering**
1. **Verify the conversation exists** in the database
2. **Check if it was already processed** (look for existing memory units)
3. **Ensure the worker is running** and healthy
4. **Have monitoring ready** to watch the process

### **During Processing**
1. **Monitor logs** for real-time feedback
2. **Watch for errors** and note them for debugging
3. **Verify database changes** after completion

### **After Processing**
1. **Check entity creation** in PostgreSQL and Neo4j
2. **Verify no duplicate entities** were created
3. **Document any issues** for future reference

---

## 🔗 **RELATED DOCUMENTATION**

- **Ingestion Worker Architecture**: `DevLog/V11.0/2.2_V11.0_IngestionAnalyst_and_Tools.md`
- **Testing Guide**: `DevLog/V11.0/2.2.1_V11.0_IngestionAnalyst_Test.md`
- **Worker Configuration**: `workers/ingestion-worker/`
- **Queue Management**: `scripts/add-bullmq-job.js`

---

## 📞 **SUPPORT**

If you encounter persistent issues:

1. **Check the troubleshooting section** above
2. **Review recent logs** for error patterns
3. **Verify all services** are running correctly
4. **Check environment variables** and API keys
5. **Consult the V11.0 documentation** for architectural details
