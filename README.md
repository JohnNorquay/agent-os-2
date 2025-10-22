# Agent-OS 2.0 HYBRID

**The best of both worlds: Token-efficient skills + Multi-agent specialization = Scalable, quality-first agentic development.**

## 🎯 What is Agent-OS 2.0 Hybrid?

Agent-OS 2.0 Hybrid combines:
- **Lazy-loading skills** from Agent-OS 2.0 (token efficient)
- **Specialized subagents** from Agent-OS 1.x (context isolation)
- **Stack-aware patterns** (works with any tech stack)
- **MCP-first integration** (live context, not guessing)
- **Built-in verification** (quality control)

### The Hybrid Advantage

| Feature | Agent-OS 1.x | Agent-OS 2.0 (Before) | Agent-OS 2.0 HYBRID |
|---------|--------------|--------------|---------------------|
| Context Management | Subagents (good) | Single agent (accumulates) | Subagents (excellent) |
| Token Efficiency | Moderate | Good | Excellent |
| Stack Support | Limited | Excellent | Excellent |
| MCP Integration | None | Excellent | Excellent |
| Verification | Built-in | Manual | Built-in |
| Context Isolation | Yes | No | Yes |
| **Peak Context** | ~5,000 | ~30,000+ ⚠️ | ~1,800 ✅ |

### Core Philosophy

1. **Context Isolation**: Specialized subagents start fresh, implement, exit
2. **Lazy Loading**: Only load skills needed for current task
3. **Stack-Aware**: Patterns for your specific tech stack
4. **MCP-First**: Live context (database schemas, deployment status)
5. **Quality-First**: Built-in verification and standards enforcement
6. **Proven Workflow**: Plan → Spec → Execute → Verify

## 🏗️ Hybrid Architecture

```
                    ┌─────────────────────┐
                    │   ORCHESTRATOR      │
                    │  (Minimal Context)  │
                    │   ~500 tokens       │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
        Spawns Subagents              Delegates to Chat Claude
                │                             │
                ▼                             ▼
    ┌───────────────────────┐    ┌───────────────────────┐
    │  IMPLEMENTERS         │    │  CHAT CLAUDE          │
    │  (Fresh Context)      │    │  (Background)         │
    │                       │    │                       │
    │  database-engineer    │    │  • Research           │
    │  api-engineer         │    │  • Documentation      │
    │  ui-designer          │    │  • Design             │
    │  testing-engineer     │    │  • Analysis           │
    │                       │    └───────────────────────┘
    │  Each ~800-1500 tokens│
    │  Then EXITS           │
    └───────────┬───────────┘
                │
                │ After implementation
                ▼
    ┌───────────────────────┐
    │  VERIFIERS            │
    │  (Fresh Context)      │
    │                       │
    │  backend-verifier     │
    │  frontend-verifier    │
    │                       │
    │  Each ~1500-2000 tokens│
    │  Then EXITS           │
    └───────────────────────┘

Peak Context: ~1,800 tokens (90% reduction!)
```

## 📁 File Structure

```
~/.claude/plugins/agent-os-2/
├── config.yml                      # Hybrid mode + stack configuration
├── core/
│   └── orchestrator.md            # Hybrid orchestrator (routes to subagents)
├── roles/                          # 🆕 HYBRID MODE
│   ├── implementers.yml            # Subagent definitions
│   └── verifiers.yml               # Verifier definitions
├── standards/                      # 🆕 HYBRID MODE
│   ├── global/                     # Standards for all agents
│   ├── backend/                    # Backend-specific standards
│   ├── frontend/                   # Frontend-specific standards
│   └── testing/                    # Testing standards
├── stacks/
│   ├── supabase-vercel/
│   │   ├── SKILL.md               # Stack-specific patterns
│   │   └── mcp-config.md          # MCP server setup
│   └── [other-stacks]/
├── skills/
│   ├── task-routing.md            # 🆕 Task metadata parsing
│   ├── task-delegation.md         # Chat Claude delegation
│   ├── supabase-auth.md           # Reusable skill modules
│   └── [other-skills].md
├── templates/
│   ├── mission.md
│   └── roadmap.md
├── HYBRID-ARCHITECTURE.md         # 🆕 Architecture deep-dive
├── EXAMPLE-WORKFLOW.md            # 🆕 Complete walkthrough
└── UPGRADE-GUIDE.md               # 🆕 Migration guide

~/.claude/commands/
├── init-project.md                # /init-project command
├── create-spec.md                 # /create-spec command
└── execute-task.md                # /execute-task command

# Per-project structure:
your-project/
├── .agent-os/
│   ├── config.yml                 # Which stack this project uses
│   ├── product/
│   │   ├── mission.md
│   │   ├── roadmap.md
│   │   ├── tech-stack.md
│   │   └── decisions.md
│   └── specs/
│       └── YYYY-MM-DD-feature-name/
│           ├── srd.md             # Requirements
│           ├── specs.md           # Technical design
│           └── tasks.md           # Task breakdown
```

## 🚀 Quick Start

### 1. Installation

Agent-OS 2.0 is already installed in your `~/.claude/` directory!

Verify installation:
```bash
ls ~/.claude/plugins/agent-os-2/
ls ~/.claude/commands/
```

### 2. Initialize a Project

Navigate to your project directory and run:
```bash
/init-project
```

This will:
- Ask about your project (what, who, why)
- Let you select a stack (e.g., supabase-vercel)
- Create `.agent-os/` directory structure
- Generate product documentation

### 3. Create a Feature Spec

```bash
/create-spec Add user authentication with email/password and OAuth
```

This will:
- Load your stack's patterns
- Query MCP servers for current state (if available)
- Create comprehensive specification
- Break down into actionable tasks

### 4. Execute Tasks

```bash
/execute-task
```

This will:
- Find next uncompleted task
- Load relevant skills
- Write code following your stack's conventions
- Run tests
- Update task tracking

## 📚 Available Commands

### `/init-project`
Initialize a new project with Agent-OS 2.0.

**Usage:**
```bash
/init-project
```

**What it does:**
- Guides you through product planning
- Creates mission, roadmap, tech-stack documentation
- Sets up project structure
- Configures stack selection

---

### `/create-spec [description]`
Create a detailed feature specification.

**Usage:**
```bash
/create-spec Add user authentication
/create-spec Build analytics dashboard
/create-spec
```

**What it does:**
- Analyzes feature requirements
- Loads appropriate stack patterns
- Queries MCP for current state
- Generates SRD, specs, and tasks
- Asks for your review before proceeding

---

### `/execute-task [task-name]`
Execute tasks from current specification.

**Usage:**
```bash
/execute-task                           # Next task
/execute-task Implement login endpoint  # Specific task
/execute-task --spec 2025-01-15-auth   # Specific spec
```

**What it does:**
- Identifies which task to work on
- Loads stack patterns and relevant skills
- Uses MCP for live context
- Writes code, tests, commits
- Updates task tracking

## 🎨 Available Stacks

### Supabase + Vercel
**Best for:** Full-stack web apps, SaaS products  
**Includes:**
- Next.js (App Router)
- Supabase (Auth, Database, Storage)
- Vercel deployment
- TypeScript, Tailwind CSS

### Supabase + Fly.io
**Best for:** Backend services, APIs, long-running processes  
**Includes:**
- Node.js or Python backend
- Supabase database
- Fly.io deployment
- Docker containers

### Adding New Stacks

See [Creating Custom Stacks](#creating-custom-stacks) below.

## 🛠️ How It Works

### The Token-Efficiency Secret

**Traditional approach (Agent-OS 1.x):**
```
Every command loads:
- All standards (~1000 tokens)
- All instructions (~2000 tokens)
- Product docs (~500 tokens)
- Relevant specs (~1000 tokens)
= ~4500 tokens EVERY TIME
```

**Agent-OS 2.0 approach:**
```
/init-project loads:
- Orchestrator skill (~200 tokens)
- No stack needed yet
= ~200 tokens

/create-spec loads:
- Orchestrator skill (~200 tokens)
- Stack skill (~800 tokens, only when needed)
- Specific sub-skills (~400 tokens, only relevant ones)
= ~1400 tokens, but way more targeted

/execute-task loads:
- Orchestrator skill (~200 tokens)
- Stack skill (~800 tokens)
- Task-specific sub-skill (~300 tokens)
= ~1300 tokens of highly relevant context
```

### MCP Integration

When MCP servers are configured, Agent-OS 2.0 can:

**Supabase MCP:**
- Query current database schema
- Check existing RLS policies
- Verify table structures
- Understand current auth setup

**Vercel MCP:**
- Check deployment status
- Manage environment variables
- View deployment logs
- Trigger deployments

**Git MCP:**
- Check repository status
- View commit history
- Manage branches
- Create commits

This **live context** means fewer hallucinations and better decisions.

## 📖 Workflow Phases

### Phase 1: Project Initialization
1. Run `/init-project`
2. Answer questions about your product
3. Select your stack
4. Review generated product documentation
5. Refine as needed

**Output:**
- `.agent-os/config.yml` with stack selection
- `.agent-os/product/mission.md`
- `.agent-os/product/roadmap.md`
- `.agent-os/product/tech-stack.md`
- `.agent-os/product/decisions.md`

---

### Phase 2: Feature Specification
1. Run `/create-spec [feature description]`
2. AI loads appropriate stack patterns
3. AI queries MCP for current state
4. AI generates comprehensive spec
5. Review and refine the spec
6. Approve to move to execution

**Output:**
- `.agent-os/specs/YYYY-MM-DD-feature-name/srd.md` (requirements)
- `.agent-os/specs/YYYY-MM-DD-feature-name/specs.md` (technical design)
- `.agent-os/specs/YYYY-MM-DD-feature-name/tasks.md` (task breakdown)

---

### Phase 3: Task Execution
1. Run `/execute-task`
2. AI finds next uncompleted task
3. AI loads relevant patterns and skills
4. AI uses MCP for live context
5. AI writes code following conventions
6. AI runs tests, commits, updates tracking
7. Repeat until spec complete

**Output:**
- Production-ready code
- Passing tests
- Git commits
- Updated task tracking
- Updated roadmap when spec completes

## 🎓 Creating Custom Stacks

Want to add a new stack? Here's how:

### 1. Create Stack Directory
```bash
mkdir -p ~/.claude/plugins/agent-os-2/stacks/your-stack
```

### 2. Create Stack Skill
```bash
touch ~/.claude/plugins/agent-os-2/stacks/your-stack/SKILL.md
```

**Template:**
```markdown
# Your Stack Name

## Stack Overview
[Describe your stack]

## Tech Stack Details
[List technologies and versions]

## Project Structure
[Show directory structure]

## Patterns & Conventions
[Document coding patterns]

## Database Patterns
[If applicable]

## API Patterns
[If applicable]

## Deployment
[How to deploy]

## Testing
[Testing approach]

## Best Practices
[Stack-specific best practices]
```

### 3. Add to Config
Edit `~/.claude/plugins/agent-os-2/config.yml`:
```yaml
stacks:
  your-stack:
    name: "Your Stack Name"
    description: "Brief description"
    skills:
      - skill-1
      - skill-2
    mcp_servers:
      - server-1
      - server-2
    default: false
```

### 4. Create Skills (Optional)
If you have reusable patterns, create skill files:
```bash
touch ~/.claude/plugins/agent-os-2/skills/your-pattern.md
```

### 5. MCP Configuration (Optional)
Document MCP servers for your stack:
```bash
touch ~/.claude/plugins/agent-os-2/stacks/your-stack/mcp-config.md
```

### 6. Test Your Stack
```bash
cd new-project
/init-project
# Select your new stack
```

## 🔧 Customization

### Modify Orchestrator Workflow
Edit `~/.claude/plugins/agent-os-2/core/orchestrator.md` to change:
- How specs are created
- Task execution flow
- Documentation structure
- Integration points

### Add New Skills
Create new skill files in `skills/` directory for reusable patterns:
```bash
touch ~/.claude/plugins/agent-os-2/skills/redis-caching.md
touch ~/.claude/plugins/agent-os-2/skills/stripe-integration.md
```

### Customize Templates
Edit templates in `templates/` directory:
```bash
~/.claude/plugins/agent-os-2/templates/mission.md
~/.claude/plugins/agent-os-2/templates/roadmap.md
```

## 🐛 Troubleshooting

### Command Not Found
```bash
# Verify commands are in place
ls ~/.claude/commands/

# If missing, recreate them
# (See installation section)
```

### Skills Not Loading
```bash
# Verify plugins directory
ls ~/.claude/plugins/agent-os-2/

# Check file permissions
chmod -R 755 ~/.claude/plugins/agent-os-2/
```

### MCP Servers Not Working
1. Check MCP configuration in Claude Code settings
2. Verify environment variables are set
3. Test MCP server connectivity manually
4. Check server logs for errors

### Wrong Stack Being Used
```bash
# Check project configuration
cat .agent-os/config.yml

# Should show:
# stack: supabase-vercel (or your stack)
```

## 📊 Performance Comparison

### Token Usage (Per Command)

| Command | Agent-OS 1.x | Agent-OS 2.0 | Savings |
|---------|--------------|--------------|---------|
| init-project | ~3000 tokens | ~250 tokens | **92%** |
| create-spec | ~5000 tokens | ~1400 tokens | **72%** |
| execute-task | ~4500 tokens | ~1300 tokens | **71%** |

### Why This Matters

**Cost Savings:**
- 70-90% reduction in token usage
- Significant cost savings for API usage
- Faster response times

**Better Context:**
- More targeted, relevant information
- Less noise, better signal
- Higher quality outputs

**Scalability:**
- Can handle larger projects
- More context budget for actual code
- Room for more complex features

## 🤝 Contributing

### Adding Skills
Have a useful pattern? Add it to `skills/`:
```bash
~/.claude/plugins/agent-os-2/skills/your-skill.md
```

### Improving Stacks
Make a stack better? Update its SKILL.md:
```bash
~/.claude/plugins/agent-os-2/stacks/[stack-name]/SKILL.md
```

### Reporting Issues
Found a bug or have a suggestion? Document it and share with the community.

## 📝 Best Practices

### For Project Initialization
1. Be specific about your product vision
2. Choose the right stack for your use case
3. Review generated docs carefully
4. Refine roadmap to match priorities

### For Spec Creation
1. Provide detailed feature descriptions
2. Review specs thoroughly before execution
3. Adjust tasks if needed
4. Consider dependencies between features

### For Task Execution
1. Execute tasks in order when possible
2. Review code after each task
3. Run tests locally
4. Keep specs up to date as you learn

### General
1. Commit frequently with descriptive messages
2. Keep documentation in sync with code
3. Update roadmap as priorities change
4. Use MCP servers when available for live context

## 🎉 What's Next?

Now that Agent-OS 2.0 is installed:

1. **Initialize your first project**: `/init-project`
2. **Create your first spec**: `/create-spec [feature]`
3. **Execute your first task**: `/execute-task`
4. **Iterate and improve**: Refine your workflow

## 💡 Tips & Tricks

### Tip 1: Use Specific Task Names
```bash
# Good
/execute-task Implement user login API endpoint

# Less specific
/execute-task work on auth
```

### Tip 2: Review Before Executing
Always review specs before running `/execute-task`. It's easier to adjust the plan than fix the code.

### Tip 3: Leverage MCP
When MCP servers are available, use them! They provide accurate, live context.

### Tip 4: Customize for Your Team
Don't hesitate to modify stack skills to match your team's conventions.

### Tip 5: Start Small
Begin with a small feature to understand the workflow before tackling larger initiatives.

---

**Agent-OS 2.0**: Smart orchestration, minimal tokens, maximum productivity. 🚀

Built for professional developers who want AI that understands their stack, follows their patterns, and ships quality code—fast.
