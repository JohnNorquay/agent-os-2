# Upgrading to Agent-OS 2.0 Hybrid

Welcome to the Hybrid Architecture! This guide will help you understand what changed and how to use the new features.

---

## 🎯 What Changed?

### Before (Agent-OS 2.0 Single-Agent)
```
┌──────────────────────────────────────┐
│        ONE AGENT                     │
│  Does everything:                    │
│  - Planning                          │
│  - Database work                     │
│  - API work                          │
│  - UI work                           │
│  - Testing                           │
│  - Verification                      │
│                                      │
│  Context: Accumulates to 30k+ ⚠️    │
└──────────────────────────────────────┘
```

### After (Agent-OS 2.0 Hybrid)
```
┌─────────────────────────────────────────┐
│         ORCHESTRATOR                    │
│  Routes tasks to specialists            │
│  Context: ~500 tokens (stays lean)      │
└──────────┬──────────────────────────────┘
           │
           ├─ database-engineer (~1.2k tokens) → EXIT
           ├─ api-engineer (~1.5k tokens) → EXIT
           ├─ ui-designer (~1.3k tokens) → EXIT
           ├─ testing-engineer (~1.1k tokens) → EXIT
           ├─ backend-verifier (~1.8k tokens) → EXIT
           └─ frontend-verifier (~1.6k tokens) → EXIT

Peak context: ~1.8k tokens ✅
```

---

## 🆕 New Features

### 1. Specialized Implementer Subagents
- `database-engineer` - Database work only
- `api-engineer` - API endpoints only
- `ui-designer` - UI components only
- `testing-engineer` - Tests only

Each starts fresh, implements, reports, and exits.

### 2. Verifier Subagents
- `backend-verifier` - Checks backend quality
- `frontend-verifier` - Checks frontend quality

Automatically triggered after implementation.

### 3. Task Metadata System
Tasks now have role assignments:
```markdown
## Database Layer [role:database-engineer]
- [ ] Create schema

## API Layer [role:api-engineer]
- [ ] Create endpoints
```

### 4. Task Dependencies
Tasks can depend on each other:
```markdown
## API Layer [role:api-engineer] [depends-on:database-layer]
```

### 5. Standards Directory
Code quality standards organized by scope:
- `standards/global/` - Everyone
- `standards/backend/` - Backend agents
- `standards/frontend/` - Frontend agents
- `standards/testing/` - Testing agents

### 6. Implementation & Verification Reports
Each subagent creates a report:
- `implementation/01-database-layer.md`
- `implementation/02-api-layer.md`
- `verification/backend-verification.md`
- `verification/frontend-verification.md`

---

## 📋 File Structure Changes

### Added Directories
```
~/.claude/plugins/agent-os-2/
├── roles/                    # NEW
│   ├── implementers.yml      # Subagent definitions
│   └── verifiers.yml         # Verifier definitions
└── standards/                # NEW
    ├── global/               # Universal standards
    ├── backend/              # Backend standards
    ├── frontend/             # Frontend standards
    └── testing/              # Testing standards
```

### Updated Files
- `config.yml` - Added hybrid mode configuration
- `core/orchestrator.md` - Updated for subagent spawning
- `README.md` - Updated with hybrid info

### New Files
- `HYBRID-ARCHITECTURE.md` - Architecture documentation
- `EXAMPLE-WORKFLOW.md` - Complete example
- `UPGRADE-GUIDE.md` - This file!
- `skills/task-routing.md` - Task routing logic

### Project Structure (Per Project)
```
.agent-os/specs/YYYY-MM-DD-feature/
├── srd.md
├── specs.md
├── tasks.md
├── implementation/           # NEW - Subagent reports
│   ├── 01-database-layer.md
│   ├── 02-api-layer.md
│   └── ...
└── verification/             # NEW - Verifier reports
    ├── backend-verification.md
    └── frontend-verification.md
```

---

## 🚀 How to Use Hybrid Mode

### Nothing Changes for Basic Usage!

**Same commands:**
```bash
/init-project
/create-spec [description]
/execute-task
```

**What's different:**
- Tasks now have role metadata (auto-assigned)
- Multiple subagents execute instead of one agent
- You get verification reports
- Context window never fills up!

### New: Task Metadata (Optional)

During `/create-spec`, tasks are auto-assigned roles:

```markdown
## Database Setup [role:database-engineer]
- [ ] Create users table
- [ ] Add indexes

## API Development [role:api-engineer]
- [ ] Create login endpoint
- [ ] Create signup endpoint

## UI Components [role:ui-designer]
- [ ] Create LoginForm
- [ ] Create SignupForm
```

**You can:**
- ✅ Accept auto-assignments (recommended)
- ✅ Adjust manually if wrong
- ✅ Add dependencies: `[depends-on:database-setup]`
- ✅ Delegate to Chat Claude: `[delegate:chat-claude] [type:research]`

### New: Verification Reports

After `/execute-task` completes, verifiers run automatically.

**Review reports in:**
```
.agent-os/specs/[spec-name]/verification/
├── backend-verification.md
└── frontend-verification.md
```

**Reports include:**
- Standards compliance
- Test coverage
- Security checks
- Performance checks
- Issues found
- Approval status

---

## ⚙️ Configuration

### Enable/Disable Hybrid Mode

Edit `~/.claude/plugins/agent-os-2/config.yml`:

```yaml
hybrid_mode:
  enabled: true  # Set to false for single-agent mode
  parallel_execution: true
  chat_claude_delegation: true
```

### Quality Settings

```yaml
quality:
  require_verification: true  # Run verifiers automatically
  enforce_standards: true     # Check standards compliance
  min_test_coverage: 80       # Minimum test coverage %
  require_passing_tests: true # Must pass tests to complete
```

### Routing Settings

```yaml
routing:
  auto_assign_roles: true           # Auto-assign during spec creation
  auto_detect_dependencies: true    # Detect task dependencies
```

---

## 🎓 Best Practices

### For Spec Creation
1. Review auto-assigned role metadata
2. Adjust if AI got it wrong
3. Set dependencies for sequential tasks
4. Delegate research/docs to Chat Claude early

### For Task Execution
1. Let orchestrator route tasks
2. Trust specialized subagents
3. Review implementation reports
4. Read verification reports before deploying

### For Standards
1. Add project-specific standards to `standards/` directories
2. Update role definitions if adding new standards
3. Keep standards concise and actionable

---

## 🐛 Troubleshooting

### "Hybrid mode not working"
```bash
# Check config
cat ~/.claude/plugins/agent-os-2/config.yml | grep "enabled:"

# Should see:
#   enabled: true

# If false, set to true
```

### "Tasks not routing to subagents"
- Verify tasks have role metadata: `[role:database-engineer]`
- Check role ID matches: `implementers.yml` (use dash, not underscore)
- Verify tasks.md saved correctly

### "Verifiers not running"
```yaml
# Check config.yml
quality:
  require_verification: true  # Must be true
```

### "Context still filling up"
- Verify subagents are actually spawning (check logs/output)
- Check that `hybrid_mode.enabled: true`
- Ensure tasks have role assignments

### "Unknown role: X"
Valid roles:
- `database-engineer`
- `api-engineer`
- `ui-designer`
- `testing-engineer`

Check spelling and use dashes, not underscores.

---

## 📊 Performance Expectations

### Context Usage
| Phase | Single Agent | Hybrid | Savings |
|-------|-------------|--------|---------|
| Init | ~3,000 | ~300 | 90% |
| Spec | ~5,000 | ~1,400 | 72% |
| Database | ~8,000 | ~1,200 | 85% |
| API | ~14,000 | ~1,500 | 89% |
| UI | ~22,000 | ~1,300 | 94% |
| Testing | ~28,000 | ~1,100 | 96% |
| Verification | OVERFLOW | ~1,800 | 100% |

### Quality Improvements
- ✅ Built-in verification workflow
- ✅ Standards enforcement
- ✅ Test coverage validation
- ✅ Security checking
- ✅ Separation of concerns

---

## 🔄 Migration Path

### For Existing Projects

**Option 1: Continue as-is**
- Hybrid mode doesn't break existing projects
- Tasks without metadata work fine (orchestrator handles them)

**Option 2: Add metadata to existing specs**
```bash
# Edit your existing tasks.md files
# Add role metadata to headings:

## Database Work [role:database-engineer]
## API Work [role:api-engineer]
## UI Work [role:ui-designer]
```

**Option 3: Recreate spec**
```bash
# Create new spec with auto-assigned metadata
/create-spec [same feature description]

# Copy and adjust as needed
```

### For New Projects

Just use it! Hybrid mode is enabled by default.

```bash
cd new-project
/init-project
/create-spec Your feature
/execute-task
```

Everything works automatically.

---

## 🎉 Benefits Summary

### Context Efficiency
- **70-90% reduction** in token usage
- Peak context: ~1,800 tokens vs 30,000+
- No more context overflow

### Code Quality
- Built-in verification
- Standards enforcement
- Test coverage validation
- Security checks

### Development Speed
- Parallel execution
- Focused, specialized agents
- No context bloat slowing down responses

### Scalability
- Can handle much larger features
- More context budget for actual code
- No hitting context limits

---

## 📚 Learn More

- `HYBRID-ARCHITECTURE.md` - Deep dive into architecture
- `EXAMPLE-WORKFLOW.md` - Complete walkthrough
- `core/orchestrator.md` - Orchestrator details
- `roles/implementers.yml` - Implementer definitions
- `roles/verifiers.yml` - Verifier definitions
- `skills/task-routing.md` - Routing logic
- `standards/` - Quality standards

---

## 💬 Feedback

Found a bug? Have a suggestion? Want to share your experience?

The hybrid architecture is new and we want to make it better! Let us know:
- What works great
- What's confusing
- What could be better
- What features you'd like to see

---

## 🚀 Ready to Go!

You're all set! The hybrid architecture is:
- ✅ Installed
- ✅ Configured
- ✅ Ready to use

Start building with:
```bash
cd your-project
/init-project
```

**Welcome to context-efficient, quality-first agentic development!** 🎉
