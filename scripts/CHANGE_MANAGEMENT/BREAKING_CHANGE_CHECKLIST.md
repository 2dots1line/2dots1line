# ⚠️ **BREAKING CHANGE MANAGEMENT CHECKLIST - 2D1L**
*Critical procedures for safely implementing changes that break existing interfaces, APIs, or contracts*

---

## 🚨 **BREAKING CHANGE DEFINITION**

> *A breaking change is any modification that requires other code to be updated to continue working. This includes API changes, schema modifications, interface updates, and behavioral changes.*

### **🔍 BREAKING CHANGE DETECTION**

**Identify if your change is breaking:**

- [ ] **API Endpoint Changes** - Modified request/response formats, removed endpoints, changed URLs
- [ ] **Database Schema Changes** - Dropped columns, renamed tables, changed data types, new required fields
- [ ] **TypeScript Interface Changes** - Modified shared types, removed properties, changed signatures
- [ ] **Service Interface Changes** - Modified gRPC/REST contracts, changed event schemas
- [ ] **Configuration Changes** - Required new environment variables, changed config structure
- [ ] **Behavioral Changes** - Modified business logic that other systems depend on
- [ ] **Dependency Updates** - Major version bumps that affect public APIs

---

## 📋 **PRE-CHANGE PLANNING CHECKLIST**

### **🎯 IMPACT ASSESSMENT**

- [ ] **Catalog Dependents**
  ```bash
  # Find all code that imports/uses the changing component
  grep -r "component-being-changed" packages/ services/ apps/
  grep -r "api/endpoint" apps/ services/
  grep -r "DatabaseTable" packages/ services/
  ```

- [ ] **Document Current Contracts**
  ```bash
  # Save current API schemas/interfaces
  cp packages/shared-types/src/api/current-interface.ts backup-interface.ts
  curl http://localhost:3001/api/schema > current-api-schema.json
  ```

- [ ] **Identify Affected Services**
  - [ ] List all services that call the changing API
  - [ ] List all components that import changing types  
  - [ ] List all databases/tables affected by schema changes
  - [ ] List all configuration files that need updates

- [ ] **Estimate Migration Effort**
  - [ ] How many files need updates?
  - [ ] How complex are the required changes?
  - [ ] How long will testing take?
  - [ ] Is this change reversible?

### **🛡️ RISK MITIGATION STRATEGY**

- [ ] **Version Strategy Decision**
  - [ ] **Parallel Implementation** - Keep old version working while adding new
  - [ ] **Feature Flags** - Use flags to toggle between old/new behavior
  - [ ] **Gradual Migration** - Update components one at a time
  - [ ] **Big Bang** - Update everything simultaneously (highest risk)

- [ ] **Rollback Plan**
  - [ ] Document how to revert each change
  - [ ] Test rollback procedure
  - [ ] Identify rollback decision points
  - [ ] Plan communication if rollback needed

- [ ] **Validation Strategy**
  - [ ] How will you verify each component still works?
  - [ ] What are the critical user workflows to test?
  - [ ] How will you monitor for issues in production?

---

## 🔄 **IMPLEMENTATION STRATEGIES**

### **📊 STRATEGY 1: PARALLEL IMPLEMENTATION**

*Keep old system working while building new. Safest but most complex.*

**API Changes:**
```typescript
// 1. Keep old endpoint working
app.get('/api/v1/old-endpoint', oldHandler);

// 2. Add new endpoint
app.get('/api/v1/new-endpoint', newHandler);

// 3. Update clients gradually
// 4. Remove old endpoint after migration complete
```

**Schema Changes:**
```sql
-- 1. Add new columns (nullable initially)
ALTER TABLE users ADD COLUMN new_field VARCHAR(255);

-- 2. Migrate data gradually
UPDATE users SET new_field = CONCAT(old_field1, old_field2);

-- 3. Update application code to use new field
-- 4. Make new field required
ALTER TABLE users ALTER COLUMN new_field SET NOT NULL;

-- 5. Drop old columns
ALTER TABLE users DROP COLUMN old_field1, DROP COLUMN old_field2;
```

**TypeScript Interface Changes:**
```typescript
// 1. Keep old interface
export interface OldUserInterface {
  id: string;
  name: string;
}

// 2. Add new interface
export interface NewUserInterface {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
}

// 3. Update components gradually
// 4. Remove old interface when no longer used
```

### **🎚️ STRATEGY 2: FEATURE FLAGS**

*Use configuration to toggle between behaviors.*

```typescript
// Configuration-driven breaking changes
const useNewUserInterface = process.env.FEATURE_NEW_USER_API === 'true';

if (useNewUserInterface) {
  // New behavior
  return await newUserService.getUser(id);
} else {
  // Old behavior  
  return await oldUserService.getUser(id);
}
```

**Feature Flag Checklist:**
- [ ] Add feature flag to configuration
- [ ] Implement both code paths
- [ ] Test flag toggling
- [ ] Plan flag removal timeline

### **⚡ STRATEGY 3: GRADUAL MIGRATION**

*Update one component at a time.*

**Migration Order:**
1. [ ] Update shared types first
2. [ ] Update database layer
3. [ ] Update core services  
4. [ ] Update API endpoints
5. [ ] Update frontend components
6. [ ] Update external integrations

**Per-Component Checklist:**
- [ ] Update component code
- [ ] Update component tests
- [ ] Verify component builds
- [ ] Test component integration
- [ ] Deploy component
- [ ] Monitor for issues

### **💥 STRATEGY 4: BIG BANG (HIGH RISK)**

*Update everything simultaneously. Use only for simple changes.*

**Big Bang Requirements:**
- [ ] Change affects fewer than 5 components
- [ ] All changes are mechanical/simple
- [ ] Comprehensive test coverage exists
- [ ] Rollback is straightforward
- [ ] Can be completed in single session

---

## ✅ **IMPLEMENTATION EXECUTION CHECKLIST**

### **🚀 PRE-IMPLEMENTATION**

- [ ] **Clean Starting State**
  ```bash
  git status  # Should be clean
  pnpm health:check  # Should pass
  pnpm build  # Should succeed
  pnpm services:status  # All healthy
  ```

- [ ] **Create Safety Checkpoint**
  ```bash
  git add . && git commit -m "checkpoint: before breaking change implementation"
  git tag "pre-breaking-change-$(date +%Y%m%d-%H%M)"
  ```

- [ ] **Prepare Development Environment**
  ```bash
  # Ensure databases are fresh and functional
  cd packages/database && pnpm db:push && cd ../..
  
  # Verify all services start cleanly
  pnpm services:restart
  ```

### **🔧 IMPLEMENTATION PHASE**

**For Each Breaking Change:**

- [ ] **Implement Change**
  - [ ] Make minimal, focused change
  - [ ] Follow chosen strategy (parallel/flags/gradual/big-bang)
  - [ ] Update related tests immediately

- [ ] **Immediate Verification**
  ```bash
  # Test affected component
  cd [affected-package] && pnpm build && pnpm test
  
  # Test dependent components
  pnpm build  # Full system build
  
  # Test critical workflows
  # [Manual testing of key features]
  ```

- [ ] **Commit Incremental Progress**
  ```bash
  git add .
  git commit -m "breaking: [specific change made] - part X of Y"
  ```

- [ ] **Rollback Point Check**
  - [ ] Is the system in a valid state?
  - [ ] Can I rollback cleanly if needed?
  - [ ] Should I continue or address issues first?

### **🧪 COMPREHENSIVE VALIDATION**

- [ ] **Build System Validation**
  ```bash
  pnpm clean && pnpm build  # Full clean build
  ```

- [ ] **Service Integration Testing**
  ```bash
  pnpm services:restart
  pnpm services:status
  
  # Test all API endpoints
  curl -f http://localhost:3001/api/health
  curl -f http://localhost:3002/api/health
  curl -f http://localhost:3003/api/health
  ```

- [ ] **Database Consistency Check**
  ```bash
  cd packages/database
  npx prisma db push --skip-generate  # Verify schema consistency
  npx prisma studio  # Manual data verification
  ```

- [ ] **Critical Workflow Testing**
  - [ ] User authentication flow
  - [ ] Image upload and analysis
  - [ ] Conversation creation and messaging
  - [ ] Database read/write operations
  - [ ] Service-to-service communication

### **📊 INTEGRATION VERIFICATION**

- [ ] **Cross-Package Dependencies**
  ```bash
  # Test imports work at runtime
  cd services/dialogue-service
  node -e "console.log(require('@2dots1line/shared-types'))"
  node -e "console.log(require('@2dots1line/database'))"
  ```

- [ ] **API Contract Verification**
  ```bash
  # Test actual API calls with new format
  curl -X POST http://localhost:3001/api/v1/endpoint \
    -H "Content-Type: application/json" \
    -d '{"new_field": "test_value"}'
  ```

- [ ] **Database Migration Verification**
  ```bash
  # Verify schema matches Prisma schema
  cd packages/database
  npx prisma db pull --print
  # Compare with schema.prisma
  ```

---

## 🎯 **POST-IMPLEMENTATION CHECKLIST**

### **🧹 CLEANUP PHASE**

- [ ] **Remove Deprecated Code**
  - [ ] Delete old API endpoints (if using parallel strategy)
  - [ ] Remove old database columns (after data migration)
  - [ ] Delete old TypeScript interfaces
  - [ ] Remove feature flags (after stabilization)

- [ ] **Update Documentation**
  - [ ] Update API documentation
  - [ ] Update schema documentation  
  - [ ] Update integration guides
  - [ ] Update troubleshooting guides

- [ ] **Performance Verification**
  ```bash
  # Verify no performance regression
  time pnpm build  # Compare to baseline
  
  # Monitor API response times
  curl -w "@curl-format.txt" http://localhost:3001/api/v1/endpoint
  ```

### **📝 DOCUMENTATION UPDATES**

- [ ] **Update Interface Documentation**
  ```typescript
  /**
   * @deprecated Use NewUserInterface instead
   * @breaking-change Removed in v2.0.0
   */
  export interface OldUserInterface { ... }
  ```

- [ ] **Update Migration Guides**
  - [ ] Document migration steps for other developers
  - [ ] Provide before/after examples
  - [ ] List common migration issues and solutions

- [ ] **Update Breaking Change Log**
  ```markdown
  ## Breaking Changes - [Date]
  
  ### [Component Name]
  **Change**: [Description]
  **Reason**: [Why change was needed]
  **Migration**: [How to update code]
  **Impact**: [What breaks if not updated]
  ```

### **🔄 INSTITUTIONAL LEARNING**

- [ ] **Document Lessons Learned**
  - [ ] What worked well in this breaking change?
  - [ ] What caused unexpected issues?
  - [ ] What would you do differently next time?
  - [ ] What automation could help future breaking changes?

- [ ] **Update Breaking Change Procedures**
  - [ ] Add new patterns discovered
  - [ ] Improve detection methods
  - [ ] Enhance validation procedures
  - [ ] Update rollback strategies

---

## 🚨 **EMERGENCY PROCEDURES**

### **⚠️ WHEN BREAKING CHANGES GO WRONG**

**Immediate Response:**
```bash
# 1. ASSESS DAMAGE
pnpm health:check
pnpm services:status
tail -50 logs/*.log

# 2. QUICK DECISION
echo "Severity assessment:"
echo "- Critical systems down: YES/NO"
echo "- Data corruption risk: YES/NO"  
echo "- Can fix forward quickly: YES/NO"
echo "- Should rollback: YES/NO"
```

**Rollback Procedure:**
```bash
# 1. IMMEDIATE ROLLBACK
git reset --hard [checkpoint-tag]

# 2. CLEAN ENVIRONMENT
rm -rf node_modules packages/*/node_modules
pnpm install
cd packages/database && pnpm db:generate && cd ../..

# 3. REBUILD AND RESTART
pnpm build
pnpm services:restart

# 4. VERIFY ROLLBACK WORKED
pnpm health:check
# Test critical workflows
```

**Forward Fix Procedure:**
```bash
# 1. IDENTIFY ROOT CAUSE
# [Debug specific issue]

# 2. IMPLEMENT MINIMAL FIX
# [Make smallest possible fix]

# 3. TEST FIX IMMEDIATELY
pnpm build
pnpm services:restart

# 4. VERIFY FIX WORKS
# [Test affected functionality]
```

---

## 📊 **BREAKING CHANGE COMMUNICATION**

### **📢 STAKEHOLDER NOTIFICATION**

**Before Breaking Change:**
- [ ] Notify team of planned breaking change
- [ ] Document timeline and migration requirements
- [ ] Provide advance notice for dependent teams

**During Implementation:**
- [ ] Communicate status at each major milestone
- [ ] Report any issues or delays immediately
- [ ] Share workarounds for temporary issues

**After Completion:**
- [ ] Confirm breaking change is complete
- [ ] Share final migration documentation
- [ ] Document lessons learned for future changes

### **🔄 CONTINUOUS IMPROVEMENT**

**After Each Breaking Change:**
1. **Retrospective** - What could be improved?
2. **Process Refinement** - Update procedures based on experience
3. **Automation** - Script manual steps that could be automated
4. **Prevention** - How to make future breaking changes safer?

---

*Breaking changes are inevitable in evolving systems. Manage them systematically to minimize risk while enabling necessary progress.* 