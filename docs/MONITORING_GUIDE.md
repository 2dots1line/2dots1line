# Real-Time Monitoring Guide

## Overview

This guide explains how to monitor your 2dots1line V11.0 system in real-time, including worker processes, LLM API calls, and system health.

## Quick Start

### Launch the Monitoring Dashboard

```bash
./scripts/monitor.sh
```

This will present you with a menu to choose your monitoring mode:

1. **Full System Monitor** - Comprehensive monitoring of all components
2. **LLM Call Monitor** - Focused monitoring of LLM API interactions
3. **Quick Status Check** - One-time overview of system status
4. **Exit**

## Monitoring Modes

### 1. Full System Monitor (`monitor-llm-workers.sh`)

**What it monitors:**
- 🐳 Docker container status
- 📊 Redis queue lengths and keys
- 🤖 LLM API calls and responses
- 💻 System resources (CPU, memory, disk)
- ⚙️ Environment configuration
- 🗄️ Database connections
- 📝 Recent log activity

**Best for:** Overall system health monitoring and debugging

**Usage:**
```bash
./scripts/monitor-llm-workers.sh
```

**Sample Output:**
```
🕐 2025-01-06 15:30:45 - 2dots1line V11.0 Monitoring Dashboard
================================================

⚙️  Environment Configuration:
  📄 .env file found
  🤖 Chat model: gemini-2.5-flash
  👁️  Vision model: gemini-2.5-flash
  🔑 API Key: Configured

🐳 Docker Services Status:
dialogue-service    Up 2 minutes    0.0.0.0:3001->3001/tcp
ingestion-worker    Up 2 minutes    
insight-worker      Up 2 minutes    

📊 Redis Queue Status:
  ingestion_queue: 2 jobs
  insight_queue: 0 jobs
  embedding_queue: 1 jobs

🤖 LLM API Activity:
  🎯 Using model: gemini-2.5-flash
  📡 API Request: Sending request to Google Gemini...
  📥 API Response: Response received successfully
```

### 2. LLM Call Monitor (`monitor-llm-calls.sh`)

**What it monitors:**
- 📡 LLM API calls and responses
- 🎯 Model selection and usage
- 📊 Token usage and processing times
- ❌ Errors and rate limits
- 🔍 Redis LLM-related data
- 📄 Detailed service logs

**Best for:** Debugging LLM issues and monitoring API usage

**Usage:**
```bash
./scripts/monitor-llm-calls.sh
```

**Sample Output:**
```
🕐 2025-01-06 15:30:45 - LLM Call Monitor
==============================

⚙️  LLM Configuration:
  🤖 Chat Model: gemini-2.5-flash
  👁️  Vision Model: gemini-2.5-flash
  🔗 Embedding Model: text-embedding-004
  🔑 API Key: Configured (39 chars)

📡 LLM API Calls & Responses:
  🎯 Model Selected: gemini-2.5-flash
  📤 API Request: Sending request to Google Gemini...
  📥 API Response: Response received successfully
  📊 Token Usage: promptTokens: 150, candidateTokens: 45
  ⏱️  Timing: Processing time: 2345ms

📋 dialogue-service Logs:
  🤖 LLMChatTool: Initializing with model gemini-2.5-flash
  📡 LLMChatTool: Sending request to Google Gemini...
  ✅ LLMChatTool: Response received successfully
```

### 3. Quick Status Check

**What it shows:**
- 🐳 Docker service status
- ⚙️ LLM configuration
- 🤖 Recent LLM activity

**Best for:** Quick health check without continuous monitoring

**Usage:**
```bash
./scripts/monitor.sh
# Then select option 3
```

## Advanced Monitoring

### Direct Script Usage

You can also run the monitoring scripts directly:

```bash
# Full system monitoring
./scripts/monitor-llm-workers.sh

# LLM-specific monitoring
./scripts/monitor-llm-calls.sh
```

### Custom Monitoring Intervals

Edit the scripts to change monitoring intervals:

```bash
# In monitor-llm-workers.sh
MONITOR_INTERVAL=5  # Change from 3 to 5 seconds

# In monitor-llm-calls.sh
MONITOR_INTERVAL=1  # Change from 2 to 1 second
```

### Log Files

The monitoring scripts create log files:

- **LLM Calls Log**: `./logs/llm-calls.log`
- **General Logs**: `./logs/` directory

## What You'll See

### 🎯 Model Selection
- Which models are being used (gemini-2.5-flash, etc.)
- Model configuration from environment variables
- Fallback model usage

### 📡 API Activity
- API requests being sent
- Responses received
- Processing times
- Token usage statistics

### 📊 Queue Status
- Number of jobs in each queue
- Queue processing status
- Redis key information

### ❌ Error Monitoring
- API errors and exceptions
- Rate limit issues
- Service failures
- Configuration problems

### 💻 System Health
- Docker container status
- Memory and CPU usage
- Disk space
- Database connections

## Troubleshooting

### No LLM Activity Detected

1. **Check if services are running:**
   ```bash
   docker-compose ps
   ```

2. **Check environment configuration:**
   ```bash
   node scripts/validate-llm-config.js
   ```

3. **Check recent logs:**
   ```bash
   docker-compose logs --tail=50
   ```

### Monitoring Script Not Working

1. **Check permissions:**
   ```bash
   chmod +x scripts/monitor*.sh
   ```

2. **Check dependencies:**
   ```bash
   # Ensure Docker is running
   docker ps
   
   # Ensure Redis is accessible
   redis-cli ping
   ```

### High API Usage

1. **Monitor rate limits:**
   - Watch for rate limit errors in the monitoring output
   - Check Google Cloud Console for quota usage

2. **Check queue backlogs:**
   - Monitor Redis queue lengths
   - Look for processing delays

## Best Practices

### 1. Start with Quick Status Check
Always start with a quick status check to ensure basic services are running.

### 2. Use Full Monitor for Debugging
When troubleshooting issues, use the full system monitor to see the complete picture.

### 3. Use LLM Monitor for API Issues
When debugging LLM-specific problems, use the LLM call monitor for detailed API interaction logs.

### 4. Monitor During Development
Keep monitoring active during development to catch issues early.

### 5. Check Logs Regularly
Review the generated log files for historical analysis.

## Integration with Development Workflow

### During Development
```bash
# Terminal 1: Start your services
docker-compose up -d

# Terminal 2: Monitor in real-time
./scripts/monitor.sh
# Select option 2 for LLM monitoring
```

### During Testing
```bash
# Run tests while monitoring
./scripts/monitor-llm-calls.sh &
npm test
# Monitor will show LLM activity during tests
```

### Production Monitoring
```bash
# For production, consider longer intervals
# Edit MONITOR_INTERVAL=10 in the scripts
./scripts/monitor-llm-workers.sh
```

## Customization

### Adding New Monitoring Metrics

Edit the monitoring scripts to add new metrics:

```bash
# Add to monitor_llm_logs() function
if [[ $line == *"your_custom_pattern"* ]]; then
    echo -e "  🎯 Your Custom Metric: $line"
fi
```

### Monitoring Additional Services

Add new services to the monitoring:

```bash
# Add to monitor_service_logs() calls
monitor_service_logs "your-new-service" "$GREEN"
```

## Support

If you encounter issues with monitoring:

1. Check that all services are running
2. Verify environment configuration
3. Check log files for errors
4. Ensure Docker and Redis are accessible

The monitoring tools are designed to help you understand what's happening in your system in real-time, making debugging and optimization much easier!
