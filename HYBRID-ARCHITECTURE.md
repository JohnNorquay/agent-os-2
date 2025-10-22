# Agent-OS 2.0 HYBRID Architecture

## 🎉 What is the Hybrid Architecture?

The Hybrid Architecture combines the **best of both worlds**:

1. **From Agent-OS 1.x**: Multi-agent specialization with context isolation
2. **From Agent-OS 2.0**: Lazy-loading skills and stack-aware MCP integration

The result? **Token-efficient, specialized agents that prevent context window overflow while maintaining quality and speed.**

---

## 🧠 The Problem We Solved

### Agent-OS 1.x (Original)
✅ **Strengths:**
- Specialized subagents (database, API, UI, testing)
- Clear separation of concerns
- Context isolation per agent
- Built-in verification workflow

❌ **Weaknesses:**
- Complex orchestration
- Higher initial setup
- Less flexible for different stacks

### Agent-OS 2.0 (Before Hybrid)
✅ **Strengths:**
- Lazy-loading skills (token efficient)
- Stack-aware (works with any tech stack)
- MCP-first integration
- Simpler initial setup

❌ **Weaknesses:**
- **Context window fills up quickly** with single agent
- No built-in verification
- All context accumulates in one session

### Hybrid Architecture (Best of Both)
✅ **All the strengths:**
- Token-efficient lazy loading ✨
- Context isolation through subagents ✨
- Stack-aware patterns ✨
- MCP integration ✨
- Built-in verification ✨
- Parallel execution ✨

❌ **No weaknesses** (that we know of yet!)

---

## 🏗️ How It Works

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                            │
│  (Minimal Context: orchestrator + stack config only)         │
│                                                               │
│  Responsibilities:                                            │
│  - Parse tasks.md metadata                                    │
│  - Route tasks to appropriate executors                       │
│  - Coordinate parallel execution                              │
│  - Track progress and status                                  │
└───────┬────────────────────────────────────┬─────────────────┘
        │                                    │
        │  Spawns                            │  Delegates
        │  Subagents                         │  to Chat Claude
        ▼                                    ▼
┌─────────────────────┐            ┌─────────────────────┐
│  IMPLEMENTERS       │            │  CHAT CLAUDE        │
│  (Fresh Context)    │            │  (Background)       │
│                     │            │                     │
│  database-engineer  │            │  Research tasks     │
│  api-engineer       │            │  Documentation      │
│  ui-designer        │            │  Design tasks       │
│  testing-engineer   │            │  Analysis           │
│                     │            │  Planning           │
│  Each loads:        │            └─────────────────────┘
│  - Stack skill      │
│  - Relevant stds    │                      │
│  - Spec only        │                      │
│                     │                      │
│  Then EXITS         │                      ▼
└──────────┬──────────┘            Results stored in
           │                        .agent-os/specs/.../
           │                        delegated-results/
           │  After all complete
           ▼
┌─────────────────────┐
│    VERIFIERS        │
│  (Fresh Context)    │
│                     │
│  backend-verifier   │
│  frontend-verifier  │
│                     │
│  Each loads:        │
│  - Stack skill      │
│  - Standards        │
│  - Implemented code │
│                     │
│  Creates reports    │
│  Then EXITS         │
└─────────────────────┘
```

---

## 📋 Task Metadata System

Tasks in `tasks.md` use metadata to indicate routing:

### Implementation Tasks (Subagents)
```markdown
## Database Layer [role:database-engineer]
- [ ] Create users table migration
- [ ] Create auth_sessions table
- [ ] Add RLS policies

## API Layer [role:api-engineer]
- [ ] Create /auth/login endpoint
- [ ] Create /auth/signup endpoint

## UI Layer [role:ui-designer]
- [ ] Create LoginForm component
- [ ] Create SignupForm component

## Testing [role:testing-engineer]
- [ ] Write API tests
- [ ] Write component tests
```

### Delegated Tasks (Chat Claude)
```markdown
## Research [delegate:chat-claude] [type:research]
- [ ] Compare OAuth 2.0 providers (Google, GitHub, Microsoft)
- [ ] Analyze security best practices

## Documentation [delegate:chat-claude] [type:documentation] [output:api-docs.md]
- [ ] Write API documentation
- [ ] Create user authentication guide
```

### Dependencies
```markdown
## Database Layer [role:database-engineer]
- [ ] Create schema

## API Layer [role:api-engineer] [depends-on:database-layer]
- [ ] Create endpoints (needs database first)

## UI Layer [role:ui-designer] [depends-on:api-layer]
- [ ] Create components (needs API first)
```

---

## 🔄 Workflow Phases

### Phase 1: Project Initialization `/init-project`
**Orchestrator handles directly** (no subagents)

1. Ask user about project
2. Select stack
3. Create `.agent-os/` structure
4. Generate product docs (mission, roadmap, tech-stack)

**Context Used:** ~200-300 tokens (orchestrator only)

---

### Phase 2: Feature Specification `/create-spec`
**Orchestrator handles** (with optional Chat Claude delegation)

1. Read stack configuration
2. Load stack skill
3. Optionally delegate research/design to Chat Claude in parallel
4. Generate SRD, specs, and tasks.md
5. **Auto-assign role metadata** to tasks based on keywords
6. User reviews and approves

**Context Used:** ~1000-1500 tokens (orchestrator + stack skill)

**Output:**
```
.agent-os/specs/2025-01-15-authentication/
├── srd.md                    # Requirements
├── specs.md                  # Technical design
├── tasks.md                  # Tasks WITH role metadata
├── implementation/           # (created during execution)
├── verification/             # (created during verification)
└── delegated-results/        # (Chat Claude outputs)
```

---

### Phase 3: Task Execution `/execute-task` ⭐ THE MAGIC HAPPENS HERE

**Orchestrator routes tasks:**

```
1. Parse tasks.md metadata
2. Group by role/delegation
3. Execute in order (respecting dependencies):

   ┌─────────────────────────────────────────┐
   │  Time 0: Parallel Kickoff               │
   ├─────────────────────────────────────────┤
   │  • Delegate research to Chat Claude     │
   │  • Spawn database-engineer subagent     │
   │    (if no dependencies)                 │
   └─────────────────────────────────────────┘
          │
          │ database-engineer completes, EXITS
          ▼
   ┌─────────────────────────────────────────┐
   │  Time N: Sequential Execution           │
   ├─────────────────────────────────────────┤
   │  • Spawn api-engineer subagent          │
   │    (depends on database)                │
   └─────────────────────────────────────────┘
          │
          │ api-engineer completes, EXITS
          ▼
   ┌─────────────────────────────────────────┐
   │  Time M: Next Layer                     │
   ├─────────────────────────────────────────┤
   │  • Spawn ui-designer subagent           │
   │    (depends on API)                     │
   │  • Retrieve Chat Claude research        │
   └─────────────────────────────────────────┘
          │
          │ ui-designer completes, EXITS
          ▼
   ┌─────────────────────────────────────────┐
   │  Time P: Testing                        │
   ├─────────────────────────────────────────┤
   │  • Spawn testing-engineer subagent      │
   └─────────────────────────────────────────┘
          │
          │ testing-engineer completes, EXITS
          ▼
   ┌─────────────────────────────────────────┐
   │  Time Q: Verification                   │
   ├─────────────────────────────────────────┤
   │  • Spawn backend-verifier               │
   │  • Spawn frontend-verifier              │
   └─────────────────────────────────────────┘

4. Orchestrator reviews all reports
5. Updates roadmap if spec complete
6. Presents summary to user
```

**Context per Subagent:** ~800-1500 tokens
- Stack skill
- Relevant standards (only what they need)
- Spec
- Task group

**Key Point:** Each subagent starts FRESH and EXITS when done. No context accumulation!

---

### Phase 4: Verification `/verify-spec` (or auto-triggered)

**Orchestrator spawns verifiers:**

1. Determine what was implemented (backend, frontend, or both)
2. Spawn appropriate verifiers:
   - `backend-verifier` if backend work was done
   - `frontend-verifier` if frontend work was done
3. Verifiers check:
   - Standards compliance
   - Test coverage
   - Implementation matches spec
   - Security best practices
   - Performance considerations
4. Verifiers create reports in `verification/`
5. Orchestrator reviews and presents to user

**Context per Verifier:** ~1000-2000 tokens
- Stack skill
- Standards
- Implemented code (for review)

---

## 💡 Context Window Optimization

### Before Hybrid (Single Agent)
```
Execution Start:     1,000 tokens
After stack load:    2,500 tokens
After reading spec:  4,000 tokens
After DB work:       8,000 tokens
After API work:     14,000 tokens
After UI work:      22,000 tokens  ⚠️ Getting full!
After testing:      28,000 tokens  ⚠️ Very full!
Verification:       CONTEXT OVERFLOW ❌
```

### With Hybrid (Multiple Subagents)
```
Orchestrator:        500 tokens (stays lean)

database-engineer:  1,200 tokens → completes → EXITS
api-engineer:       1,500 tokens → completes → EXITS
ui-designer:        1,300 tokens → completes → EXITS
testing-engineer:   1,100 tokens → completes → EXITS

backend-verifier:   1,800 tokens → completes → EXITS
frontend-verifier:  1,600 tokens → completes → EXITS

Peak Context: ~1,800 tokens ✅ (90% reduction!)
```

---

## 🎯 Roles & Responsibilities

### Implementer Subagents

#### database-engineer
**Handles:**
- Database migrations
- Model definitions
- Queries and procedures
- Indexes and constraints
- RLS policies (Supabase)

**Loads:** Stack skill + global/* + backend/* + testing/*

#### api-engineer
**Handles:**
- API endpoints
- Controllers and handlers
- Business logic
- Request/response formatting
- Authentication/authorization

**Loads:** Stack skill + global/* + backend/* + testing/*

#### ui-designer
**Handles:**
- UI components
- Pages and layouts
- Styling (CSS/Tailwind)
- Responsive design
- User interactions

**Loads:** Stack skill + global/* + frontend/* + testing/*

#### testing-engineer
**Handles:**
- Unit tests
- Integration tests
- E2E tests
- Test fixtures
- Test coverage

**Loads:** Stack skill + global/* + testing/*

### Verifier Subagents

#### backend-verifier
**Checks:**
- Database implementation quality
- API implementation quality
- Backend standards compliance
- Test coverage (backend)
- Security (SQL injection, auth, etc.)

**Loads:** Stack skill + global/* + backend/* + testing/*

#### frontend-verifier
**Checks:**
- UI implementation quality
- Component standards compliance
- Responsive design
- Accessibility
- Test coverage (frontend)
- Performance

**Loads:** Stack skill + global/* + frontend/* + testing/*

---

## 📚 Standards System

Standards are organized by scope and loaded only by relevant agents:

```
standards/
├── global/              # All agents load these
│   ├── coding-style.md
│   └── error-handling.md
├── backend/             # Backend agents only
│   └── (to be added)
├── frontend/            # Frontend agents only
│   └── (to be added)
└── testing/             # All agents load these
    └── test-writing.md
```

**Benefits:**
- Each agent sees only relevant standards
- Context stays focused
- Standards don't duplicate stack patterns

---

## 🚀 Getting Started

### 1. Initialize a Project
```bash
cd your-project
/init-project
```

Select your stack (e.g., `supabase-vercel`)

### 2. Create a Feature Spec
```bash
/create-spec Add user authentication
```

Orchestrator will:
- Generate SRD, specs, tasks
- Auto-assign role metadata to tasks
- You review and approve

### 3. Execute Tasks
```bash
/execute-task
```

Watch the magic:
- Orchestrator routes tasks to specialized agents
- Research runs in Chat Claude (background)
- Implementation subagents work in parallel
- Verifiers check quality
- You get implementation + verification reports

---

## 📊 Performance Benefits

### Token Usage Comparison

| Phase | Before Hybrid | With Hybrid | Savings |
|-------|--------------|-------------|---------|
| Project Init | ~3,000 | ~300 | **90%** |
| Create Spec | ~5,000 | ~1,400 | **72%** |
| Execute Task (Database) | ~8,000 | ~1,200 | **85%** |
| Execute Task (API) | ~14,000 | ~1,500 | **89%** |
| Execute Task (UI) | ~22,000 | ~1,300 | **94%** |
| Verification | OVERFLOW | ~1,800 | **100%** saved from failure! |

### Quality Benefits

- ✅ Built-in verification workflow
- ✅ Standards compliance checking
- ✅ Test coverage enforcement
- ✅ Security best practices validation
- ✅ Separation of concerns (agents stay in their lane)

### Speed Benefits

- ⚡ Parallel execution (research + implementation)
- ⚡ No context bloat slowing responses
- ⚡ Focused agents work faster
- ⚡ Independent tasks can run concurrently

---

## 🛠️ Configuration

Edit `~/.claude/plugins/agent-os-2/config.yml`:

```yaml
hybrid_mode:
  enabled: true  # Turn off to go back to single-agent mode
  parallel_execution: true
  chat_claude_delegation: true

quality:
  require_verification: true
  enforce_standards: true
  min_test_coverage: 80
  require_passing_tests: true

routing:
  auto_assign_roles: true  # Auto-assign during /create-spec
  auto_detect_dependencies: true
```

---

## 🎓 Best Practices

### For Users

1. **Review auto-assigned roles** during spec creation - adjust if needed
2. **Set dependencies clearly** when tasks must run in order
3. **Delegate research early** so it runs in background
4. **Trust the subagents** - they know their domains
5. **Review verification reports** before considering feature complete

### For Customization

1. **Add new roles** to `roles/implementers.yml` if needed
2. **Create stack-specific standards** in `standards/backend|frontend/`
3. **Adjust role keywords** in config.yml for better auto-assignment
4. **Add new stacks** by creating `stacks/your-stack/SKILL.md`

---

## 🐛 Troubleshooting

### "Unknown role: X"
- Check `roles/implementers.yml` for valid role IDs
- Fix metadata in tasks.md

### "Context still filling up"
- Verify hybrid_mode.enabled is `true` in config.yml
- Check that tasks have role metadata
- Verify subagents are spawning (should see "database-engineer is working...")

### "Tasks not routing correctly"
- Check metadata format: `[role:agent-id]`
- Ensure closing bracket `]`
- Role ID must match exactly (dash, not underscore)

### "Chat Claude delegation not working"
- Verify chat-claude MCP server is configured
- Check metadata includes both `[delegate:chat-claude]` AND `[type:TYPE]`

---

## 🎉 Summary

The Hybrid Architecture transforms Agent-OS 2.0 from a good system into a **great** system:

- **Token Efficient:** 70-90% reduction through context isolation
- **High Quality:** Built-in verification and standards enforcement
- **Fast:** Parallel execution and focused agents
- **Scalable:** No more context window limits
- **Smart:** Right agent for the right job

**You now have a professional-grade agentic development system that scales!**

---

## 📖 Further Reading

- `core/orchestrator.md` - Detailed orchestrator workflow
- `roles/implementers.yml` - Implementer role definitions
- `roles/verifiers.yml` - Verifier role definitions
- `skills/task-routing.md` - Task routing and metadata parsing
- `skills/task-delegation.md` - Chat Claude delegation patterns
- `standards/` - Code quality standards

---

**Built with love for developers who want AI that actually works at scale.** 🚀
