# Issue Logs Directory

This directory contains individual issue log files for tracking, diagnosing, and resolving problems in the 2dots1line system.

## Directory Structure

```
DevLog/ISSUE_LOGS/
├── README.md                           # This file
├── ISSUE-001_InsightWorker_ConceptMerging.md
├── ISSUE-002_Neo4j_RelationshipSync.md
├── ISSUE-003_BuildSystem_Configuration.md
└── TEMPLATE_IssueLog.md               # Template for new issue logs
```

## File Naming Convention

Use the format: `ISSUE-XXX_Component_Description.md`

- **XXX**: Sequential issue number (001, 002, 003, etc.)
- **Component**: Affected system component (InsightWorker, Neo4j, BuildSystem, etc.)
- **Description**: Brief description of the issue (ConceptMerging, RelationshipSync, etc.)

## Issue Log Template

Each issue log should follow the template in `TEMPLATE_IssueLog.md` which includes:

- Issue metadata (ID, title, status, priority)
- Problem description and impact assessment
- Diagnostic information and error logs
- Investigation steps and findings
- Resolution plan and actions required
- Resolution tracking and verification

## Usage Guidelines

### **Creating New Issue Logs**
1. Copy `TEMPLATE_IssueLog.md`
2. Rename according to naming convention
3. Fill in all required sections
4. Update `ISSUE_LOG_MASTER_INDEX.md`

### **Updating Issue Logs**
1. Add new findings to investigation section
2. Update status and priority as needed
3. Document any workarounds discovered
4. Track time spent on investigation

### **Resolving Issues**
1. Document the exact fix applied
2. Include code changes or configuration updates
3. Update status to "Resolved"
4. Move to resolved section in master index

## Issue Status Workflow

```
New Issue → Investigation → Resolution Planning → Implementation → Verification → Resolved
    ↓              ↓              ↓                ↓              ↓           ↓
  Create        Document       Define          Apply Fix      Test Fix    Archive
  Issue Log     Findings      Actions         & Update      & Verify     Issue
```

## Integration with Development Workflow

- **Daily Standup**: Review active issues and progress
- **Sprint Planning**: Include issue resolution in sprint goals
- **Code Reviews**: Reference related issues in commit messages
- **Release Planning**: Ensure critical issues are resolved before release

## Maintenance

- Update issue status weekly
- Archive resolved issues monthly
- Review issue patterns quarterly
- Update templates and processes as needed

## Quick Reference

- **Master Index**: `../ISSUE_LOG_MASTER_INDEX.md`
- **Template**: `TEMPLATE_IssueLog.md`
- **Status Legend**: See master index for status definitions
- **Priority Levels**: Critical, High, Medium, Low
