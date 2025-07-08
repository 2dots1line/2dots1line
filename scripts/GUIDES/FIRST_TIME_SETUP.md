# 🚀 **FIRST TIME SETUP - 2D1L DEVELOPMENT ENVIRONMENT**
*Complete setup guide for new developers and fresh installations*

---

## 📋 **PREREQUISITES**

### **System Requirements**
- **OS**: macOS 12+ or Ubuntu 20.04+
- **RAM**: 16GB minimum, 32GB recommended
- **Storage**: 50GB free space minimum
- **Internet**: Stable connection for downloads

### **Required Software**

**1. Node.js & Package Manager**
```bash
# Install Node.js 20+ (via nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc  # or ~/.zshrc
nvm install 20
nvm use 20

# Install pnpm globally
npm install -g pnpm
```

**2. Docker & Docker Compose**
```bash
# macOS: Install Docker Desktop
# Ubuntu: Install Docker Engine
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER
# Log out and back in
```

**3. Git Configuration**
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 🔧 **PROJECT SETUP**

### **1. Clone and Install Dependencies**
```bash
# Clone the repository
git clone https://github.com/your-org/2D1L.git
cd 2D1L

# Install all dependencies
pnpm install

# Verify pnpm workspace setup
pnpm list --depth=0
```

### **2. Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env  # or your preferred editor
```

**Required Environment Variables:**
```env
# Database
DATABASE_URL="postgresql://danniwang:password@localhost:5433/twodots1line"
POSTGRES_PASSWORD="your_secure_password"

# Redis
REDIS_URL="redis://localhost:6379"

# AI Services
GOOGLE_API_KEY="your_google_api_key"
OPENAI_API_KEY="your_openai_api_key"

# Application
NODE_ENV="development"
API_BASE_URL="http://localhost:3001"

# Weaviate
WEAVIATE_URL="http://localhost:8080"
WEAVIATE_API_KEY="optional_api_key"

# Neo4j
NEO4J_URI="bolt://localhost:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="your_neo4j_password"
```

### **3. Database Services Setup**
```bash
# Start Docker services
docker-compose up -d

# Wait for services to be ready (important!)
sleep 60

# Verify services are running
docker-compose ps
```

### **4. Database Schema Setup**
```bash
# Generate Prisma client (CRITICAL - must be first)
cd packages/database
pnpm db:generate

# Apply database migrations
pnpm db:migrate:dev

# Verify database connection
pnpm db:studio
# Should open Prisma Studio at http://localhost:5555
```

### **5. Build System Setup**
```bash
# Return to root directory
cd ../..

# Apply TypeScript configuration fixes
pnpm fix:typescript

# Perform initial build (tests entire system)
pnpm build

# If build fails, check troubleshooting section
```

### **6. Service Validation**
```bash
# Start all backend services
pnpm services:start

# Verify services are healthy
pnpm services:status

# Test critical endpoints
curl -f http://localhost:3001/api/health  # API Gateway
curl -f http://localhost:3002/api/health  # Dialogue Service
curl -f http://localhost:3003/api/health  # User Service
```

### **7. Frontend Setup**
```bash
# In separate terminal, start frontend
cd apps/web-app
pnpm dev

# Verify frontend loads
open http://localhost:3000
```

---

## 🧪 **VERIFICATION TESTS**

### **Complete System Test**
```bash
# 1. Run comprehensive health check
pnpm health:check

# 2. Test database operations
cd packages/database && pnpm db:studio
# Navigate through tables to verify schema

# 3. Test image upload functionality
# - Open web app: http://localhost:3000
# - Upload a test image
# - Verify it appears in Prisma Studio Media table

# 4. Test dialogue functionality
# - Send a message in the web app
# - Check that conversation is recorded in database
# - Verify response is generated

# 5. Check logs for errors
tail -f logs/*.log
```

### **Build System Validation**
```bash
# Clean build test
pnpm clean
pnpm build

# Should complete without errors
# Check for conflict artifacts
find . -name "*tsbuildinfo*" -not -path "./node_modules/*" -not -name "*.json" | wc -l
# Should return 0

find . -name "pnpm-lock*.yaml" | wc -l  
# Should return 1
```

---

## 🚨 **COMMON SETUP ISSUES**

### **Issue: Docker Services Won't Start**
```bash
# Check Docker is running
docker info

# Check port conflicts
lsof -i :5433,6379,8080,7687

# Kill conflicting processes
sudo lsof -ti:5433,6379,8080,7687 | xargs sudo kill -9

# Restart Docker
docker-compose down
docker-compose up -d
```

### **Issue: Database Connection Fails**
```bash
# Check PostgreSQL is accessible
nc -z localhost 5433 || echo "PostgreSQL not accessible"

# Check environment variables are loaded
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."

# Regenerate Prisma client
cd packages/database
rm -rf node_modules/.prisma
pnpm db:generate
```

### **Issue: Build Failures**
```bash
# Check Node.js version
node --version  # Should be 20+

# Fix TypeScript conflicts
pnpm fix:conflicts

# Clean reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### **Issue: Services Won't Start**
```bash
# Check environment loading
source .env
echo $DATABASE_URL

# Use automated environment loading
pnpm services:start  # NOT manual ts-node-dev

# Check for port conflicts
lsof -i :3001,3002,3003
```

### **Issue: Frontend Build Errors**
```bash
# Clear Next.js cache
cd apps/web-app
rm -rf .next
rm -rf node_modules/.cache

# Reinstall frontend dependencies
pnpm install
pnpm dev
```

---

## 🛠️ **DEVELOPMENT TOOLS SETUP**

### **Recommended VSCode Extensions**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-json",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

### **Shell Aliases** (Optional but Recommended)
```bash
# Add to ~/.zshrc or ~/.bashrc
echo '
# 2D1L Development Shortcuts
alias 2d1l="cd /path/to/your/2D1L"
alias 2d1l-start="cd /path/to/your/2D1L && pnpm services:start"
alias 2d1l-status="cd /path/to/your/2D1L && pnpm services:status"
alias 2d1l-health="cd /path/to/your/2D1L && pnpm health:check"
alias 2d1l-logs="cd /path/to/your/2D1L && tail -f logs/*.log"
alias 2d1l-studio="cd /path/to/your/2D1L/packages/database && pnpm db:studio"
' >> ~/.zshrc

source ~/.zshrc
```

### **Git Hooks Setup** (Optional)
```bash
# Pre-commit hook to run tests
echo '#!/bin/sh
pnpm build
pnpm lint
' > .git/hooks/pre-commit

chmod +x .git/hooks/pre-commit
```

---

## 📚 **NEXT STEPS**

### **Development Workflow**
1. **Read**: `scripts/LIFECYCLE/02_DAILY_DEVELOPMENT/daily-workflow.md`
2. **Understand**: `scripts/FOUNDATION/01_SYSTEMATIC_THINKING_FRAMEWORK.md`
3. **Reference**: `scripts/KNOWLEDGE_BASE/CRITICAL_LESSONS_LEARNED.md`

### **Architecture Understanding**
1. Review monorepo structure in `scripts/KNOWLEDGE_BASE/TYPESCRIPT_CONFIGURATION_BIBLE.md`
2. Understand service architecture in `DevLog/V9.5/`
3. Explore API documentation

### **Testing Your Setup**
1. Try uploading an image through the web interface
2. Send messages and verify they're processed
3. Explore the database using Prisma Studio
4. Check that all services restart cleanly

---

## 🆘 **GETTING HELP**

### **If Setup Fails**
1. **Check** the comprehensive health check: `pnpm health:check`
2. **Review** error logs: `tail -f logs/*.log`
3. **Search** for error patterns in `scripts/KNOWLEDGE_BASE/CRITICAL_LESSONS_LEARNED.md`
4. **Try** the emergency reset: `./scripts/AUTOMATION/build-system/clean-rebuild.sh`

### **Documentation Hierarchy**
- **Immediate Help**: Pattern recognition in `CRITICAL_LESSONS_LEARNED.md`
- **Deep Debugging**: Systematic thinking framework
- **Configuration Issues**: TypeScript Configuration Bible
- **Daily Work**: Daily development workflow

---

## ✅ **SETUP COMPLETE CHECKLIST**

- [ ] Node.js 20+ installed
- [ ] Docker services running
- [ ] Environment variables configured
- [ ] Dependencies installed successfully
- [ ] Database schema applied
- [ ] All packages build without errors
- [ ] All services start and show healthy status
- [ ] Frontend loads at http://localhost:3000
- [ ] Can upload images and see them in database
- [ ] Can send messages and get responses
- [ ] Health check passes: `pnpm health:check`

**🎉 Congratulations! Your 2D1L development environment is ready for productive work.**

---

*This setup guide incorporates all lessons learned from previous installations. If you encounter new issues, please document them for future developers.* 