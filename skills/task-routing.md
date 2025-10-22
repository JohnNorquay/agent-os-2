# Task Routing Skill

## Overview
This skill enables the Agent-OS 2.0 hybrid orchestrator to intelligently route tasks to the appropriate execution environment: Chat Claude for research/design/docs, specialized subagents for implementation, or verifiers for quality control.

## Task Metadata Format

Tasks in `tasks.md` use metadata tags to indicate routing:

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
- [ ] Write auth API tests
- [ ] Write component tests
```

### Delegated Tasks (Chat Claude)
```markdown
## Research & Design [delegate:chat-claude] [type:research]
- [ ] Research OAuth 2.0 provider comparison
- [ ] Analyze password security best practices

## Documentation [delegate:chat-claude] [type:documentation]
- [ ] Write API documentation for auth endpoints
- [ ] Create user guide for authentication
```

### No Metadata (Orchestrator Handles)
```markdown
## Setup Tasks
- [ ] Initialize project structure
- [ ] Configure environment variables
```

## Metadata Tags

### [role:agent-id]
**Purpose**: Route task group to specialized implementer subagent

**Valid Values:**
- `database-engineer` - Database migrations, models, queries
- `api-engineer` - API endpoints, controllers, business logic
- `ui-designer` - UI components, styling, layouts
- `testing-engineer` - Test files and test coverage

**Example:**
```markdown
## Database Setup [role:database-engineer]
- [ ] Create user schema
- [ ] Add indexes
```

### [delegate:chat-claude]
**Purpose**: Route task to Chat Claude via MCP for background execution

**Must be combined with:** `[type:TYPE]`

**Valid Types:**
- `research` - Comparing options, investigating approaches
- `documentation` - Writing docs, guides, API documentation
- `design` - Architecture design, database schema design
- `analysis` - Analyzing codebases, security, performance
- `planning` - Creating plans, strategies, timelines

**Optional:** `[output:filename.md]` - Specifies output filename

**Example:**
```markdown
## Authentication Research [delegate:chat-claude] [type:research] [output:oauth-comparison.md]
- [ ] Compare OAuth providers (Google, GitHub, Microsoft)
- [ ] Analyze security implications

## API Documentation [delegate:chat-claude] [type:documentation] [output:api-docs.md]
- [ ] Document all authentication endpoints
- [ ] Include request/response examples
```

## Parsing Algorithm

### Step 1: Read tasks.md
```javascript
const tasksContent = await readFile(`${specPath}/tasks.md`);
```

### Step 2: Split into sections by headings
```javascript
const sections = tasksContent.split(/^## /m).filter(s => s.trim());
```

### Step 3: Parse each section
```javascript
for (const section of sections) {
  const lines = section.split('\n');
  const heading = lines[0]; // First line is the heading

  // Extract metadata
  const roleMatch = heading.match(/\[role:([^\]]+)\]/);
  const delegateMatch = heading.match(/\[delegate:chat-claude\]/);
  const typeMatch = heading.match(/\[type:([^\]]+)\]/);
  const outputMatch = heading.match(/\[output:([^\]]+)\]/);

  // Clean heading (remove metadata)
  const cleanHeading = heading
    .replace(/\[role:[^\]]+\]/g, '')
    .replace(/\[delegate:chat-claude\]/g, '')
    .replace(/\[type:[^\]]+\]/g, '')
    .replace(/\[output:[^\]]+\]/g, '')
    .trim();

  // Extract tasks (lines starting with "- [ ]" or "- [x]")
  const tasks = lines
    .slice(1) // Skip heading
    .filter(line => line.trim().match(/^- \[([ x])\]/))
    .map(line => ({
      text: line.replace(/^- \[([ x])\]/, '').trim(),
      completed: line.includes('[x]')
    }));

  // Route based on metadata
  if (roleMatch) {
    // Route to implementer subagent
    const agentId = roleMatch[1];
    routeToSubagent(agentId, cleanHeading, tasks);
  } else if (delegateMatch && typeMatch) {
    // Route to Chat Claude
    const taskType = typeMatch[1];
    const outputFile = outputMatch ? outputMatch[1] : null;
    routeToChatClaude(taskType, cleanHeading, tasks, outputFile);
  } else {
    // No metadata - orchestrator handles
    routeToOrchestrator(cleanHeading, tasks);
  }
}
```

### Step 4: Route to appropriate executor

## Routing Functions

### Route to Subagent
```javascript
async function routeToSubagent(agentId, heading, tasks) {
  // 1. Load role definition
  const roles = await loadRoles();
  const role = roles.implementers.find(r => r.id === agentId);

  if (!role) {
    throw new Error(`Unknown role: ${agentId}`);
  }

  // 2. Build task description
  const taskDescription = [
    `## ${heading}`,
    ...tasks.map(t => `- ${t.completed ? '[x]' : '[ ]'} ${t.text}`)
  ].join('\n');

  // 3. Determine report number and name
  const existingReports = await listImplementationReports(specPath);
  const reportNumber = existingReports.length + 1;
  const reportName = heading.toLowerCase().replace(/\s+/g, '-');

  // 4. Spawn subagent using Task tool
  await Task({
    subagent_type: "general-purpose",
    description: `Implement ${heading}`,
    prompt: buildSubagentPrompt(role, heading, taskDescription, reportNumber, reportName)
  });
}
```

### Route to Chat Claude
```javascript
async function routeToChatClaude(taskType, heading, tasks, outputFile) {
  // 1. Build task description
  const taskDescription = tasks.map(t => t.text).join('\n');

  // 2. Build context from project docs
  const mission = await readFile(`${projectRoot}/.agent-os/product/mission.md`);
  const specs = await readFile(`${specPath}/specs.md`);

  const context = `
    Project Mission:
    ${mission}

    Feature Specification:
    ${specs}
  `;

  // 3. Generate task ID
  const taskId = `${heading.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

  // 4. Determine output path
  const output = outputFile || `${taskId}.md`;
  const outputPath = `${specPath}/delegated-results/${output}`;

  // 5. Delegate via MCP
  await mcp.delegate_task({
    task_id: taskId,
    task_type: taskType,
    description: `${heading}\n\n${taskDescription}`,
    context: context,
    output_format: 'markdown'
  });

  // 6. Store metadata for later retrieval
  await saveTaskMetadata({
    taskId,
    heading,
    outputPath,
    status: 'delegated',
    timestamp: Date.now()
  });
}
```

### Route to Orchestrator
```javascript
function routeToOrchestrator(heading, tasks) {
  // Tasks without metadata are handled by orchestrator
  // These are typically simple setup tasks or coordination tasks
  console.log(`Orchestrator will handle: ${heading}`);
  // Implement directly or prompt user for clarification
}
```

## Creating tasks.md During Spec Creation

When creating specs with `/create-spec`, the orchestrator should automatically assign role metadata based on task analysis:

```javascript
function assignRoleMetadata(taskGroup) {
  const heading = taskGroup.heading.toLowerCase();

  // Database-related keywords
  if (heading.includes('database') ||
      heading.includes('migration') ||
      heading.includes('schema') ||
      heading.includes('model')) {
    return '[role:database-engineer]';
  }

  // API-related keywords
  if (heading.includes('api') ||
      heading.includes('endpoint') ||
      heading.includes('controller') ||
      heading.includes('backend')) {
    return '[role:api-engineer]';
  }

  // UI-related keywords
  if (heading.includes('ui') ||
      heading.includes('component') ||
      heading.includes('frontend') ||
      heading.includes('view') ||
      heading.includes('page')) {
    return '[role:ui-designer]';
  }

  // Testing-related keywords
  if (heading.includes('test') ||
      heading.includes('testing')) {
    return '[role:testing-engineer]';
  }

  // Research/design/documentation keywords
  if (heading.includes('research') ||
      heading.includes('investigate') ||
      heading.includes('compare')) {
    return '[delegate:chat-claude] [type:research]';
  }

  if (heading.includes('document') ||
      heading.includes('docs')) {
    return '[delegate:chat-claude] [type:documentation]';
  }

  if (heading.includes('design') &&
      (heading.includes('architecture') || heading.includes('schema design'))) {
    return '[delegate:chat-claude] [type:design]';
  }

  // No clear match - leave without metadata for orchestrator review
  return '';
}
```

## Dependency Management

Some tasks depend on others completing first:

```markdown
## Database Layer [role:database-engineer]
- [ ] Create users table migration
- [ ] Create sessions table migration

## API Layer [role:api-engineer] [depends-on:database-layer]
- [ ] Create /auth/login endpoint (needs users table)
- [ ] Create /auth/logout endpoint (needs sessions table)

## UI Layer [role:ui-designer] [depends-on:api-layer]
- [ ] Create LoginForm component (needs /auth/login API)
- [ ] Create LogoutButton component (needs /auth/logout API)
```

**Orchestrator respects dependencies:**
1. Execute `database-layer` first
2. Wait for completion
3. Then execute `api-layer`
4. Wait for completion
5. Then execute `ui-layer`

**Parse dependencies:**
```javascript
const dependsOnMatch = heading.match(/\[depends-on:([^\]]+)\]/);
if (dependsOnMatch) {
  const dependency = dependsOnMatch[1];
  // Wait for dependency to complete before executing this task group
}
```

## Status Tracking

Track task execution status in a separate file:

**`.agent-os/specs/[spec-name]/task-status.json`:**
```json
{
  "database-layer": {
    "role": "database-engineer",
    "status": "completed",
    "started": 1704067200000,
    "completed": 1704070800000,
    "report": "implementation/01-database-layer.md"
  },
  "api-layer": {
    "role": "api-engineer",
    "status": "in-progress",
    "started": 1704070900000
  },
  "oauth-research": {
    "delegate": "chat-claude",
    "type": "research",
    "status": "completed",
    "taskId": "oauth-research-1704067200000",
    "output": "delegated-results/oauth-comparison.md"
  }
}
```

## Error Handling

### Unknown Role
```javascript
if (!role) {
  console.error(`Unknown role: ${agentId}`);
  console.log('Available roles:', roles.implementers.map(r => r.id));
  // Ask user to fix tasks.md or continue with orchestrator
}
```

### Missing Type for Delegation
```javascript
if (delegateMatch && !typeMatch) {
  console.error(`Task "${heading}" has [delegate:chat-claude] but no [type:TYPE]`);
  console.log('Valid types: research, documentation, design, analysis, planning');
  // Skip or ask user to fix
}
```

### Circular Dependencies
```javascript
function detectCircularDependencies(taskGroups) {
  // Build dependency graph
  // Check for cycles
  // Throw error if cycle detected
}
```

## Integration with Orchestrator Workflow

**During `/create-spec`:**
1. Generate task breakdown
2. Auto-assign role metadata based on task analysis
3. User reviews and can adjust metadata
4. Save tasks.md with metadata

**During `/execute-task`:**
1. Parse tasks.md
2. Route each task group appropriately
3. Track execution status
4. Retrieve results from delegated tasks
5. Update tasks.md with completions
6. Generate summary for user

## Quick Reference

**Implementer Roles:**
- `[role:database-engineer]` - Database work
- `[role:api-engineer]` - API endpoints
- `[role:ui-designer]` - UI components
- `[role:testing-engineer]` - Tests

**Delegation:**
- `[delegate:chat-claude] [type:research]` - Research tasks
- `[delegate:chat-claude] [type:documentation]` - Documentation
- `[delegate:chat-claude] [type:design]` - Architecture/schema design
- `[delegate:chat-claude] [type:analysis]` - Code/security analysis
- `[delegate:chat-claude] [type:planning]` - Strategy planning

**Dependencies:**
- `[depends-on:task-group-name]` - Wait for another group to complete

**Output:**
- `[output:filename.md]` - Specify output file for delegated tasks

---

**Remember**: Clear task routing enables parallel execution and context optimization. Let the right agent do the right work.
