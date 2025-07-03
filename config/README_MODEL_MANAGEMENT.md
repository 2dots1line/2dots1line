# 2D1L Gemini Model Management System

This document provides a complete guide to managing Gemini models in the 2D1L system.

## 📋 Quick Reference

### Essential Commands
```bash
# Check current model status
scripts/manage-gemini-models.sh status

# Test all models
scripts/manage-gemini-models.sh test

# Update model configuration
scripts/manage-gemini-models.sh update-config

# Daily health check
scripts/daily-model-check.sh

# Emergency fallback
scripts/manage-gemini-models.sh emergency
```

## 🏗️ System Architecture

### Files & Components
- **Configuration**: `config/gemini_models.json` - Central model definitions
- **Service**: `services/config-service/src/ModelConfigService.ts` - Model selection logic
- **Testing**: `config/test_gemini_models.js` - Automated availability testing
- **Management**: `scripts/manage-gemini-models.sh` - Administrative commands
- **Monitoring**: `scripts/daily-model-check.sh` - Health monitoring

### Use Cases & Model Assignment
- **Chat**: General conversation (`gemini-2.0-flash-exp` → `gemini-1.5-flash`)
- **Vision**: Image analysis (`gemini-2.0-flash-exp` → `gemini-1.5-flash`)  
- **Embedding**: Text embeddings (`text-embedding-004`)

## 🔧 Common Operations

### 1. Check What Models Are Currently Active
```bash
# Quick overview
scripts/manage-gemini-models.sh status

# Detailed configuration
cat config/gemini_models.json | jq '.models'

# Check in service logs
tail -f logs/dialogue-service.log | grep -E "(Using model|ModelConfigService)"
```

### 2. Test Model Availability
```bash
# Test all configured models
scripts/manage-gemini-models.sh test

# Quick quota check
scripts/manage-gemini-models.sh check-quota

# See what Google provides
scripts/manage-gemini-models.sh list-models
```

### 3. Update Models When New Ones Are Released
```bash
# Method 1: Interactive editing
scripts/manage-gemini-models.sh update-config

# Method 2: Manual editing
nano config/gemini_models.json
# Then test and restart:
cd config && node test_gemini_models.js
pnpm services:restart
```

### 4. Handle Quota Issues
```bash
# Diagnosis
scripts/manage-gemini-models.sh check-quota

# If models are over quota, the system automatically uses fallbacks
# To manually adjust:
scripts/manage-gemini-models.sh update-config
# Move quota-exceeded models to end of fallback chains
```

### 5. Emergency Recovery
```bash
# If configuration is broken:
scripts/manage-gemini-models.sh emergency

# This creates a minimal working config using basic models
# Restore full config later from backup
```

## 📊 Model Configuration Structure

### Use Cases Definition (in models section)
```json
{
  "models": {
    "chat": {
      "primary": "gemini-2.0-flash-exp",
      "fallback": ["gemini-1.5-flash", "gemini-1.5-flash-8b"],
      "description": "For general conversation and text generation",
      "capabilities": ["text", "reasoning", "conversation"],
      "context_window": 1000000
    }
  }
}
```

### Model Details (in individual model definitions)
```json
{
  "gemini-2.0-flash-exp": {
    "status": "available",
    "type": "experimental", 
    "capabilities": ["text", "images", "multimodal"],
    "context_window": 1000000,
    "generation_config": {
      "temperature": 0.7,
      "topK": 40,
      "topP": 0.95,
      "maxOutputTokens": 8192
    }
  }
}
```

## 🔄 Maintenance Workflows

### Weekly Routine
```bash
# 1. Check quota status
scripts/daily-model-check.sh

# 2. Test all models
scripts/manage-gemini-models.sh test

# 3. Review any quota issues
scripts/manage-gemini-models.sh check-quota
```

### Monthly Routine
```bash
# 1. Check for new Google models
scripts/manage-gemini-models.sh list-models

# 2. Research new models in Google AI Studio
# https://ai.google.dev/gemini-api/docs/models/gemini

# 3. Add new models to config and test
scripts/manage-gemini-models.sh update-config

# 4. Update primary models if better ones available
```

### When Google Updates Free Tier Limits
```bash
# 1. Update quota information in config
nano config/gemini_models.json
# Update the quota_information section

# 2. Re-test all models
scripts/manage-gemini-models.sh test

# 3. Adjust fallback chains if needed
```

## 🚨 Troubleshooting Guide

### Quota Exceeded
**Symptoms**: API calls fail with 429 errors
```bash
# Quick fix - system uses fallbacks automatically
# Check which models are working:
scripts/manage-gemini-models.sh check-quota

# Update configuration to prioritize working models:
scripts/manage-gemini-models.sh update-config
```

### Service Not Using New Models
**Symptoms**: Old models still being used after config update
```bash
# Restart services to reload configuration
pnpm services:restart

# Verify new config loaded
tail -f logs/dialogue-service.log | grep "ModelConfigService"
```

### Configuration File Corrupted
**Symptoms**: JSON parsing errors
```bash
# Apply emergency config
scripts/manage-gemini-models.sh emergency

# Restore from backup or reconfigure
ls -la config/gemini_models.json.backup.*
cp config/gemini_models.json.backup.YYYYMMDD_HHMMSS config/gemini_models.json
```

### New Models Not Working
**Symptoms**: 404 errors for specific models
```bash
# Check what Google actually provides
scripts/manage-gemini-models.sh list-models

# Remove non-existent models from config
scripts/manage-gemini-models.sh update-config
```

## 📈 Performance Monitoring

### Model Response Quality
```bash
# Monitor model usage in logs
tail -f logs/dialogue-service.log | grep -E "(model|response|completion)"

# Compare response quality over time
# Look for degraded responses, longer latencies, or errors
```

### Quota Usage Patterns
```bash
# Daily monitoring
scripts/daily-model-check.sh

# Track quota consumption
grep -E "(quota|429|rate.*limit)" logs/*.log | tail -20
```

### Fallback Effectiveness
```bash
# Check fallback usage
grep -E "(fallback|Trying.*model)" logs/dialogue-service.log

# Ensure fallbacks are tested and working
scripts/manage-gemini-models.sh test
```

## 💡 Best Practices

### Configuration Management
1. **Always backup before editing**: `scripts/manage-gemini-models.sh update-config` does this automatically
2. **Test after changes**: Never deploy untested configurations
3. **Use version control**: Commit configuration changes with descriptive messages
4. **Document changes**: Update model selection reasoning in commit messages

### Model Selection Strategy
1. **Primary models**: Use latest stable or experimental for best performance
2. **Fallback chains**: Order by preference: newest → stable → basic
3. **Use case optimization**: Match models to specific requirements
4. **Quota distribution**: Spread usage across models to avoid bottlenecks

### Monitoring & Alerts
1. **Daily checks**: Run `scripts/daily-model-check.sh` regularly
2. **Log monitoring**: Watch for quota warnings and errors
3. **Performance tracking**: Monitor response quality and latency
4. **Proactive updates**: Check for new models monthly

## 🔗 Related Documentation

- **Main Installation Guide**: `scripts/COMPLETE_INSTALLATION_GUIDE.md`
- **Model Configuration Section**: Search for "Gemini Model Configuration Management"
- **Service Architecture**: `DevLog/V9.5/2.1_V9.5_DialogueAgent_and_PromptBuilder.md`
- **Google AI Documentation**: https://ai.google.dev/gemini-api/docs

## 🆘 Emergency Contacts

If the model system fails completely:

1. **Immediate**: `scripts/manage-gemini-models.sh emergency`
2. **Escalation**: Check Google AI Studio for API status
3. **Fallback**: Temporarily use only `gemini-1.5-flash` (most stable)
4. **Recovery**: Restore from backup or reconfigure from scratch

---

This system ensures reliable AI model management with automatic failover, quota monitoring, and easy maintenance workflows. 