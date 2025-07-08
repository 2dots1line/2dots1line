# 📁 **2D1L Scripts Directory - V11.0 Architecture**

*Organized automation, guides, and tools for efficient development and operations*

---

## 📋 **DIRECTORY STRUCTURE**

```
scripts/
├── GUIDES/                     # 📚 User-friendly documentation and guides
├── AUTOMATION/                 # 🤖 Automated scripts and tools
├── KNOWLEDGE_BASE/             # 🧠 Technical knowledge and best practices
├── CHANGE_MANAGEMENT/          # 🔄 Change control and architecture docs
└── archive/                    # 📦 Historical files and legacy documentation
```

---

## 🚀 **QUICK REFERENCE - ESSENTIAL COMMANDS**

### **For New Developers**
```bash
# Complete setup from scratch
./AUTOMATION/setup-dev-env.sh          # Install Node.js, pnpm, Docker
./AUTOMATION/end-to-end-setup.sh       # Full system setup and validation

# Daily development workflow
./AUTOMATION/systematic-audit.sh       # Health check and validation
```

### **For Daily Development**
```bash
# Quick start (mornings)
pnpm start:dev                         # Start databases + services
pnpm start:frontend                    # Start web app in separate terminal

# Common fixes
pnpm fix:conflicts                     # Fix build conflicts
./AUTOMATION/clean-rebuild.sh          # Nuclear option - full rebuild
```

### **For Troubleshooting**
```bash
# Health diagnostics
pnpm health:check                      # System health overview
./AUTOMATION/monitoring/health-check.sh # Detailed diagnostics

# Service management (V11.0 PM2-based)
pnpm status                            # Check PM2 services
pm2 monit                              # Live monitoring dashboard
```

---

## 📚 **GUIDES DIRECTORY**

*User-friendly documentation for common workflows*

| File | Purpose | When to Use |
|------|---------|-------------|
| `INSTALLATION_GUIDE.md` | Complete setup and management reference | First-time setup, troubleshooting |
| `DAILY_WORKFLOW.md` | Standard development procedures | Every development session |
| `FIRST_TIME_SETUP.md` | Initial project onboarding | New team members |
| `TROUBLESHOOTING_GUIDE.md` | Emergency procedures and fixes | When things break |
| `SECURITY_BASELINE.md` | Security standards and practices | Security reviews, audits |

---

## 🤖 **AUTOMATION DIRECTORY**

*Automated scripts organized by function*

### **Root Level Scripts**
- `setup-dev-env.sh` - Install development tools (Node.js, pnpm, Docker)
- `end-to-end-setup.sh` - Complete system setup with validation
- `systematic-audit.sh` - Comprehensive health check and validation
- `clean-rebuild.sh` - Full clean rebuild with conflict resolution
- `service-manager.sh` - V11.0 PM2-based service management

### **Subdirectories**
```
AUTOMATION/
├── build-system/               # Build and deployment automation
│   ├── clean-rebuild.sh       # Comprehensive rebuild script
│   ├── fix-build-conflicts.sh # Build conflict resolution
│   ├── fix-pnpm-conflicts.sh  # Package manager conflict fixes
│   ├── fix-typescript-build-conflicts.sh # TypeScript specific fixes
│   └── partial-clean-rebuild.sh # Selective rebuild script
├── monitoring/                 # System monitoring and health checks
│   └── health-check.sh        # Detailed system diagnostics
└── model-management/           # AI model management tools
    ├── daily-model-check.sh   # Daily model health verification
    ├── manage-gemini-models.sh # Gemini model configuration
    ├── README_MODEL_MANAGEMENT.md # Model management documentation
    └── test_gemini_models.js   # Model testing utilities
```

---

## 🧠 **KNOWLEDGE_BASE DIRECTORY**

*Technical knowledge and best practices*

- `CRITICAL_LESSONS_LEARNED.md` - Hard-won insights and gotchas
- `TYPESCRIPT_CONFIGURATION_BIBLE.md` - TypeScript setup best practices
- `SYSTEMATIC_THINKING_FRAMEWORK.md` - Problem-solving methodology

---

## 🔄 **CHANGE_MANAGEMENT DIRECTORY**

*Architecture and change control documentation*

- `ARCHITECTURE_BASELINE.md` - Current system architecture reference
- `BREAKING_CHANGE_CHECKLIST.md` - Procedures for major changes
- `REFACTORING_PROTOCOLS.md` - Safe refactoring guidelines

---

## 📦 **ARCHIVE DIRECTORY**

*Historical documentation and legacy files*

```
archive/
├── v11-refactoring/           # V11.0 refactoring documentation
├── lifecycle-structure/       # Previous LIFECYCLE directory structure
└── legacy-scripts/           # Outdated numbered directories and scripts
```

---

## 🎯 **V11.0 ARCHITECTURE NOTES**

### **Key Changes from Previous Versions**
- **Headless Services**: `dialogue-service`, `user-service`, etc. are now libraries imported by API Gateway
- **Single Server**: Only API Gateway runs as a server (port 3001)
- **PM2 Management**: All workers and Python services managed via PM2
- **Simplified Deployment**: Fewer moving parts, easier debugging

### **Service Architecture**
```
API Gateway (3001) ← Single HTTP server handling all requests
├── dialogue-service (library)
├── user-service (library)
├── card-service (library)
└── config-service (library)

PM2 Processes:
├── Workers (ingestion, insight, embedding, etc.)
└── Python Services (dimension-reducer:8000)

Docker Services:
├── PostgreSQL (5432)
├── Redis (6379)
├── Neo4j (7474, 7687)
└── Weaviate (8080)
```

---

## 🛡️ **BEST PRACTICES**

### **Before Using Any Script**
1. **Read the documentation** - Each script has specific use cases
2. **Check V11.0 compatibility** - Scripts are updated for current architecture
3. **Backup important data** - Some scripts perform destructive operations
4. **Test in development** - Never run automation scripts directly in production

### **When Things Go Wrong**
1. **Start with health check**: `pnpm health:check`
2. **Check PM2 status**: `pnpm status`
3. **Review recent changes**: `git log --oneline -10`
4. **Use systematic audit**: `./AUTOMATION/systematic-audit.sh`
5. **Escalate to emergency procedures**: See `GUIDES/TROUBLESHOOTING_GUIDE.md`

---

## 📞 **SUPPORT AND MAINTENANCE**

### **Script Updates**
- Scripts are maintained to match V11.0 architecture
- Check git history for recent changes: `git log scripts/`
- Report issues or suggest improvements via team channels

### **Adding New Scripts**
- Follow the directory structure above
- Add documentation to this README
- Ensure V11.0 compatibility
- Test thoroughly before committing

---

*Last updated: [Current Date] for V11.0 Architecture* 