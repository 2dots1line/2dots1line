# 📚 **2D1L GUIDES DIRECTORY**
*Comprehensive documentation and guides for 2D1L development*

---

## 🚀 **QUICK START GUIDES**

### **First Time Setup**
- **[FIRST_TIME_SETUP.md](FIRST_TIME_SETUP.md)** - Complete setup guide for new developers
- **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - V11.0 installation and configuration
- **[QUICK_CLEAN_START.md](QUICK_CLEAN_START.md)** - Fast environment cleanup and restart

### **Daily Development**
- **[DAILY_WORKFLOW.md](DAILY_WORKFLOW.md)** - Streamlined daily development procedures
- **[TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)** - Emergency procedures and crisis management

---

## 🔧 **SPECIFIC FEATURE GUIDES**

### **Insight Worker Management**
- **[INSIGHT_WORKER_TRIGGER_GUIDE.md](INSIGHT_WORKER_TRIGGER_GUIDE.md)** - Complete guide to triggering and monitoring insight worker jobs
- **[INSIGHT_WORKER_QUICK_REFERENCE.md](INSIGHT_WORKER_QUICK_REFERENCE.md)** - Essential commands and quick fixes
- **[trigger-insight.js](trigger-insight.js)** - Enhanced trigger script with error handling
- **[test-insight-trigger.sh](test-insight-trigger.sh)** - Interactive test script for learning

### **Cosmos 3D Visualization**
- **[COSMOS_CONFIGURATION_GUIDE.md](COSMOS_CONFIGURATION_GUIDE.md)** - All configurable parameters for 3D visualization
- **[COSMOS_DATA_FLOW_ANALYSIS.md](COSMOS_DATA_FLOW_ANALYSIS.md)** - Complete data pipeline from databases to frontend
- **[COSMOS_NODE_MODAL_ARCHITECTURE.md](COSMOS_NODE_MODAL_ARCHITECTURE.md)** - Architecture for enhanced node modals

### **Database & Vector Operations**
- **[WEAVIATE_QUERY_GUIDE.md](WEAVIATE_QUERY_GUIDE.md)** - Complete guide to querying and managing Weaviate database
- **[NEO4J_BROWSER_GUIDE.md](NEO4J_BROWSER_GUIDE.md)** - Complete guide to using Neo4j Browser and Cypher queries
- **[view-weaviate-content.js](view-weaviate-content.js)** - Configurable script for exploring Weaviate content

---

## 🛡️ **SYSTEM & SECURITY**

- **[SECURITY_BASELINE.md](SECURITY_BASELINE.md)** - Security decisions and baseline documentation

---

## 🎯 **GUIDE SELECTION BY TASK**

### **I'm New to 2D1L**
1. Start with **[FIRST_TIME_SETUP.md](FIRST_TIME_SETUP.md)**
2. Then read **[DAILY_WORKFLOW.md](DAILY_WORKFLOW.md)**

### **I Need to Fix Something**
1. Check **[TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)** for emergency procedures
2. Use **[QUICK_CLEAN_START.md](QUICK_CLEAN_START.md)** for environment issues

### **I Want to Work with Insight Worker**
1. Read **[INSIGHT_WORKER_TRIGGER_GUIDE.md](INSIGHT_WORKER_TRIGGER_GUIDE.md)** for complete understanding
2. Use **[INSIGHT_WORKER_QUICK_REFERENCE.md](INSIGHT_WORKER_QUICK_REFERENCE.md)** for daily commands
3. Run **[test-insight-trigger.sh](test-insight-trigger.sh)** to practice

### **I'm Working on Cosmos Visualization**
1. Start with **[COSMOS_CONFIGURATION_GUIDE.md](COSMOS_CONFIGURATION_GUIDE.md)**
2. Deep dive with **[COSMOS_DATA_FLOW_ANALYSIS.md](COSMOS_DATA_FLOW_ANALYSIS.md)**
3. Plan enhancements with **[COSMOS_NODE_MODAL_ARCHITECTURE.md](COSMOS_NODE_MODAL_ARCHITECTURE.md)**

### **I'm Working with Weaviate Database**
1. Use **[WEAVIATE_QUERY_GUIDE.md](WEAVIATE_QUERY_GUIDE.md)** for all database operations
2. Reference **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** for setup issues
3. Check **[TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)** for database problems

### **I'm Working with Neo4j Graph Database**
1. Use **[NEO4J_BROWSER_GUIDE.md](NEO4J_BROWSER_GUIDE.md)** for all graph operations and Cypher queries
2. Reference **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** for setup issues
3. Check **[TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)** for database problems

### **I'm Setting Up the System**
1. Follow **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** for V11.0
2. Reference **[SECURITY_BASELINE.md](SECURITY_BASELINE.md)** for security decisions

---

## 📋 **GUIDE FEATURES**

### **Each Guide Includes**
- ✅ **Clear step-by-step instructions**
- ✅ **Copy-paste commands**
- ✅ **Expected outputs and success indicators**
- ✅ **Troubleshooting sections**
- ✅ **Related documentation links**

### **Special Features**
- 🧪 **Interactive test scripts** for hands-on learning
- 📊 **Monitoring commands** for real-time system observation
- 🚨 **Emergency procedures** for crisis situations
- 🔄 **Automation scripts** for repetitive tasks

---

## 🚨 **EMERGENCY PROCEDURES**

### **System Completely Broken**
```bash
# Quick health check
pnpm health:check

# Emergency reset
./scripts/AUTOMATION/build-system/clean-rebuild.sh

# Full troubleshooting
scripts/GUIDES/TROUBLESHOOTING_GUIDE.md
```

### **Need Help Fast**
1. Check **[TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)** for pattern matching
2. Use **[QUICK_CLEAN_START.md](QUICK_CLEAN_START.md)** for environment issues
3. Run `pnpm health:check` for system status

---

## 📚 **LEARNING PATH**

### **Beginner Path**
```
FIRST_TIME_SETUP.md → DAILY_WORKFLOW.md → Specific Feature Guides
```

### **Troubleshooting Path**
```
TROUBLESHOOTING_GUIDE.md → QUICK_CLEAN_START.md → Specific Issue Guides
```

### **Feature Development Path**
```
Specific Feature Guide → DAILY_WORKFLOW.md → TROUBLESHOOTING_GUIDE.md
```

---

## 🔍 **SEARCHING GUIDES**

### **By Topic**
```bash
# Find guides mentioning "insight"
grep -r "insight" . --include="*.md" | head -10

# Find guides mentioning "cosmos"
grep -r "cosmos" . --include="*.md" | head -10

# Find troubleshooting content
grep -r "error\|fix\|troubleshoot" . --include="*.md" | head -10
```

### **By Command**
```bash
# Find guides with specific commands
grep -r "pm2 restart" . --include="*.md"
grep -r "docker-compose" . --include="*.md"
```

---

## 📝 **CONTRIBUTING TO GUIDES**

### **When You Learn Something New**
1. **Update the relevant guide** with new information
2. **Add to troubleshooting sections** if it's a common issue
3. **Create new guides** for new features or procedures
4. **Update this README** to include new guides

### **Guide Standards**
- Use clear, copy-paste commands
- Include expected outputs
- Add troubleshooting sections
- Link to related documentation
- Test all commands before documenting

---

## 🎉 **SUCCESS INDICATORS**

### **You're Ready When You Can**
- ✅ Set up a fresh 2D1L environment
- ✅ Trigger and monitor insight worker jobs
- ✅ Troubleshoot common issues independently
- ✅ Navigate between guides efficiently
- ✅ Contribute improvements to guides

---

**Happy Developing! 🚀**

*For questions or improvements, update the relevant guide or create a new one.*
