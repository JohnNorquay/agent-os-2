# Agent-OS 2.0 Core Orchestrator

## Purpose
The orchestrator coordinates the Agent-OS 2.0 workflow, managing project initialization, spec creation, and task execution while intelligently loading only the skills and MCP servers needed for each phase.

## Core Principles
1. **Lazy Loading**: Only load skills when needed for the current task
2. **Stack-Aware**: Understand which stack the project uses and load appropriate patterns
3. **MCP Integration**: Leverage MCP servers for live context (DB schemas, deployment status, etc.)
4. **Token Efficiency**: Minimize context by loading only what's necessary
5. **Workflow Continuity**: Maintain the proven plan → spec → execute workflow

## Project Structure
Every Agent-OS 2.0 project has this structure:
```
.agent-os/
├── config.yml              # Project configuration (which stack, settings)
├── product/
│   ├── mission.md         # What you're building and why
│   ├── roadmap.md         # Feature roadmap with phases
│   ├── tech-stack.md      # Technologies and versions
│   └── decisions.md       # Architectural decisions
└── specs/
    └── YYYY-MM-DD-feature-name/
        ├── srd.md         # Software Requirements Document
        ├── specs.md       # Technical specifications
        └── tasks.md       # Task breakdown
```

## Workflow Phases

### Phase 1: Project Initialization
**Command**: `/init-project` or `/plan-product`

**Process**:
1. Ask user for basic project details:
   - What are you building? (elevator pitch)
   - Who is it for? (target users)
   - What stack do you want to use? (show available stacks from config.yml)
2. Create `.agent-os/` directory structure
3. Generate initial product documentation:
   - mission.md (vision, goals, users, value prop)
   - roadmap.md (phased feature plan)
   - tech-stack.md (technologies, versions, hosting)
   - decisions.md (initial architectural decisions)
4. Create `.agent-os/config.yml` with selected stack
5. Initialize MCP servers for the chosen stack

**Skills Loaded**: None yet - this is lightweight planning
**MCP Used**: None yet

**Output**: Confirmation that project is initialized with stack selection

---

### Phase 2: Feature Specification
**Command**: `/create-spec [feature description]`

**Process**:
1. Read `.agent-os/config.yml` to determine project stack
2. Load the stack-specific skill (e.g., `stacks/supabase-vercel/SKILL.md`)
3. Load relevant sub-skills as needed (e.g., `skills/supabase-auth.md`)
4. Check roadmap.md for context on where this feature fits
5. If MCP servers are available, query for live context:
   - Supabase MCP: Get current database schema
   - Vercel MCP: Get current deployment info
6. Create dated spec folder: `.agent-os/specs/YYYY-MM-DD-feature-name/`
7. Generate three documents:
   - **srd.md**: Requirements (what, why, user stories, acceptance criteria)
   - **specs.md**: Technical design (data models, APIs, UI flows, dependencies)
   - **tasks.md**: Task breakdown (parent tasks with sub-tasks)
8. Present spec to user for review

**Skills Loaded**: 
- Stack skill (e.g., supabase-vercel/SKILL.md)
- Feature-specific skills as needed (e.g., supabase-auth.md)

**MCP Used**: 
- Stack-specific servers for live context

**Output**: Complete spec ready for execution

---

### Phase 3: Task Execution (HYBRID MODE)
**Command**: `/execute-task` or `/execute-task [specific task name]`

**Process**:
1. Read `.agent-os/config.yml` to determine stack
2. Find current spec (or ask which spec if multiple)
3. Read `tasks.md` and parse task metadata to determine routing
4. **Route tasks based on delegation metadata:**

   **A. Tasks delegated to Chat Claude** `[delegate:chat-claude]`:
   - Parse metadata: `[type:research/documentation/design/analysis/planning]`
   - Build context from mission.md, roadmap.md, specs.md
   - Delegate using Chat Claude MCP server
   - Tasks run in background, retrieve results later

   **B. Implementation tasks with role assignments** `[role:agent-id]`:
   - Parse which subagent to spawn (database-engineer, api-engineer, ui-designer, testing-engineer)
   - **Spawn specialized implementer subagent** using Claude Code's Task tool
   - Pass to subagent:
     * Task group description
     * Spec file paths (srd.md, specs.md)
     * Stack name (so subagent can load stack skill)
     * Standards to follow (from roles/implementers.yml)
   - Subagent loads only its relevant stack skill + standards
   - Subagent implements, tests, and returns report
   - Orchestrator updates tasks.md with completion

   **C. Verification phase** (after implementation complete):
   - **Spawn verifier subagents** (backend-verifier, frontend-verifier)
   - Pass implementation details and spec
   - Verifiers check standards compliance, test coverage, quality
   - Verifiers create verification reports
   - Orchestrator reviews reports and informs user

5. Check if spec is complete, update roadmap.md if entire feature done
6. Provide summary with next steps

**Context Window Optimization**:
- Orchestrator stays lean (only orchestrator skill + stack config)
- Each subagent starts with fresh context
- Each subagent exits after completing work
- No context accumulation in single agent

**Skills Loaded (by Orchestrator)**:
- Orchestrator skill only
- Stack config for routing decisions

**Skills Loaded (by Subagents)**:
- database-engineer: Stack skill + global/* + backend/* + testing/*
- api-engineer: Stack skill + global/* + backend/* + testing/*
- ui-designer: Stack skill + global/* + frontend/* + testing/*
- testing-engineer: Stack skill + global/* + testing/*
- verifiers: Stack skill + relevant standards

**MCP Used**:
- Chat Claude MCP for delegated tasks
- Stack-specific MCP servers (subagents use these)
- Deployment automation where applicable

**Output**: Working code, passing tests, verification reports, updated task tracking

---

### Phase 4: Verification
**Command**: Automatically triggered after Phase 3, or `/verify-spec [spec-name]`

**Process**:
1. Read completed spec and implementation
2. Determine which verifiers needed based on what was implemented
3. **Spawn backend-verifier** if backend tasks were completed
4. **Spawn frontend-verifier** if frontend tasks were completed
5. Verifiers check:
   - Standards compliance
   - Test coverage and passing tests
   - Implementation matches spec
   - Security best practices
   - Performance considerations
6. Verifiers create detailed reports in `.agent-os/specs/[spec-name]/verification/`
7. Orchestrator reviews reports and presents summary to user
8. If issues found, create follow-up tasks

**Output**: Verification reports, quality assurance

---

## Stack Selection Logic

When orchestrating, always:
1. Check if `.agent-os/config.yml` exists in project root
2. If yes, read the `stack` property to know which stack to use
3. Load skills and MCP configs for that stack only
4. If no, we're in initialization phase - offer stack selection

## Subagent Spawning (Hybrid Mode)

### When to Spawn Subagents
- During Phase 3 (Task Execution) for implementation tasks
- During Phase 4 (Verification) for quality checks
- When tasks have `[role:agent-id]` metadata

### How to Spawn Subagents

**Using Claude Code's Task Tool:**
```javascript
// Spawn database-engineer for database tasks
Task({
  subagent_type: "general-purpose",
  description: "Implement database layer for authentication",
  prompt: `You are a database-engineer subagent in Agent-OS 2.0 hybrid mode.

Your role: ${role.your_role}

Areas of responsibility:
${role.areas_of_responsibility.map(a => `- ${a}`).join('\n')}

IMPORTANT: You must ONLY work within your areas of responsibility. Do not touch:
${role.example_areas_outside_of_responsibility.map(a => `- ${a}`).join('\n')}

Project Stack: ${stackName}
Spec Location: ${specPath}

BEFORE IMPLEMENTING:
1. Read the stack skill: ~/.claude/plugins/agent-os-2/stacks/${stackName}/SKILL.md
2. Read relevant standards from: ~/.claude/plugins/agent-os-2/standards/
   ${role.standards.map(s => `   - ${s}`).join('\n')}
3. Read the spec: ${specPath}/specs.md
4. Read your assigned tasks: ${specPath}/tasks.md

YOUR TASKS TO IMPLEMENT:
${taskGroupDescription}

IMPLEMENTATION WORKFLOW:
1. Load stack skill and standards
2. Review existing code patterns
3. Implement following TDD (tests first when possible)
4. Run tests to verify
5. Update ${specPath}/tasks.md - mark your tasks complete with [x]
6. Create an implementation report: ${specPath}/implementation/${reportNumber}-${reportName}.md

REPORT STRUCTURE:
# Implementation Report: ${taskGroupName}

## Tasks Completed
[Copy task list with [x] checkmarks]

## Files Created/Modified
- path/to/file.ext - Description

## Implementation Summary
[What you built and how it follows the stack patterns]

## Testing
- Tests written: Yes/No
- Tests passing: Yes/No
- Test files: [list]

## Standards Applied
[Which standards you followed]

## Notes
[Any decisions, blockers, or items for other agents]

NOW IMPLEMENT YOUR ASSIGNED TASKS.`
})
```

### Subagent Context Isolation

**What Each Subagent Sees:**
- Only its role definition and areas of responsibility
- Only the stack skill relevant to the project
- Only the standards relevant to its role
- Only the spec it's implementing
- Only the task group it's assigned

**What Each Subagent DOESN'T See:**
- Other role definitions
- Unrelated standards
- Other specs or tasks
- Orchestrator complexity

**Benefits:**
- Fresh context window per subagent
- No context accumulation
- Focused, specialized implementation
- Token efficiency through isolation

### Task Metadata Parsing

**Format in tasks.md:**
```markdown
## Database Layer [role:database-engineer]
- [ ] Create users table migration
- [ ] Create auth_sessions table
- [ ] Add RLS policies

## API Layer [role:api-engineer]
- [ ] Create /auth/login endpoint
- [ ] Create /auth/signup endpoint
- [ ] Add JWT middleware

## UI Layer [role:ui-designer]
- [ ] Create LoginForm component
- [ ] Create SignupForm component

## Testing [role:testing-engineer]
- [ ] Write auth API tests
- [ ] Write auth component tests

## Research [delegate:chat-claude] [type:research]
- [ ] Research OAuth 2.0 providers
- [ ] Compare security best practices
```

**Parsing Logic:**
1. Split tasks.md into sections by heading level
2. Extract metadata from headings: `[role:agent-id]` or `[delegate:chat-claude]`
3. Group tasks by their role/delegation
4. Route each group to appropriate agent

### Parallel Execution Strategy

**Orchestrator can spawn multiple subagents:**
```
Time 0:
- Delegate research to Chat Claude
- Spawn database-engineer
- Spawn api-engineer (if independent from database)

Time N:
- database-engineer completes, exits
- api-engineer completes, exits
- Spawn ui-designer (needs API to exist)

Time M:
- ui-designer completes, exits
- Retrieve research from Chat Claude
- Spawn testing-engineer

Time P:
- testing-engineer completes, exits
- Spawn verifiers
```

## Skill Loading Strategy

**DO**:
- Load only skills needed for current phase
- Check skill file exists before trying to load
- Log which skills are loaded (if verbose mode enabled)
- Let subagents load their own skills independently

**DON'T**:
- Load all skills at once
- Load skills speculatively
- Keep skills in context after they're no longer needed
- Load subagent skills in orchestrator context

## MCP Server Management

**Initialization**:
- Read stack's mcp_servers list from config
- Verify each server is available
- Connect only to servers needed for current operation

**During Execution**:
- Use MCP for live data (don't guess or assume)
- Query before making changes (check current schema, env vars)
- Use MCP for deployments instead of manual commands

**Error Handling**:
- If MCP server unavailable, inform user but continue
- Offer manual alternatives if MCP fails
- Log MCP errors for debugging

## File Conventions

**Encoding**: UTF-8  
**Line Endings**: LF  
**Indentation**: 2 spaces  
**Markdown**: No indentation on headers  

## Error Handling

If anything fails:
1. Clearly explain what went wrong
2. Offer actionable next steps
3. Don't abandon workflow - find path forward
4. Log errors if verbose mode enabled

## User Interaction

**Be Conversational**: This is a collaborative process  
**Confirm Decisions**: Ask before making major changes  
**Show Progress**: Let user know what's happening  
**Request Review**: Always ask user to review specs before execution  

## Integration with Claude Code

This orchestrator works as a Claude Code plugin:
- Commands in `~/.claude/commands/` point to this orchestrator
- Skills are loaded via file_read tool
- MCP servers are invoked via Claude Code's MCP integration
- All files created in user's actual project directory

## Next Steps

After reading this orchestrator skill, you should:
1. Understand which phase of workflow we're in
2. Load only the skills needed for that phase
3. Use MCP servers intelligently for live context
4. Execute the workflow systematically
5. Keep token usage minimal by staying focused

---

**Remember**: Agent-OS 2.0 is about smart orchestration, not loading everything at once. Be selective, be efficient, be effective.
