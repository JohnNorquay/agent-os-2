# Parallel Workflow Guide
## Integrating Chat Claude Delegation with Agent-OS 2.0

This guide extends the orchestrator with parallel workflow capabilities using the Chat Claude MCP server.

## Overview

The parallel workflow system enables Claude Code to delegate specific tasks to Chat Claude, allowing both AIs to work simultaneously on different aspects of the project. This dramatically speeds up development by having each AI focus on what it does best.

## Enhanced Workflow Phases

### Phase 2: Feature Specification (Enhanced)

When running `/create-spec`, follow these additional steps:

**After Step 3** (loading sub-skills):
- Load `skills/task-delegation.md` to understand delegation patterns

**After Step 7** (creating spec folder):
- Create `delegated-results/` subdirectory:
  ```bash
  mkdir -p .agent-os/specs/YYYY-MM-DD-feature-name/delegated-results
  ```

**During Step 8** (generating tasks.md):
- Analyze each task and add delegation metadata
- Use the task-delegation skill to determine which tasks to delegate
- Format: `- [ ] Task description [delegate:chat-claude] [type:TYPE] [output:filename.md]`

**Task Categorization Logic**:
```
IF task involves:
  - Researching options/approaches → delegate:chat-claude, type:research
  - Writing documentation → delegate:chat-claude, type:documentation
  - Designing architecture/schemas → delegate:chat-claude, type:design
  - Analyzing code/systems → delegate:chat-claude, type:analysis
  - Planning/strategy → delegate:chat-claude, type:planning

ELSE IF task involves:
  - Writing/editing code → delegate:claude-code, type:implementation
  - Running tests → delegate:claude-code, type:testing
  - Git operations → delegate:claude-code, type:git
  - Build/deploy → delegate:claude-code, type:deployment
  - Debugging → delegate:claude-code, type:debugging
```

### Phase 3: Task Execution (Enhanced)

When running `/execute-task`, follow this enhanced workflow:

**Step 1: Parse Task Metadata**
```markdown
# Example task.md entry
- [ ] Research OAuth providers and create comparison [delegate:chat-claude] [type:research] [output:oauth-comparison.md]

# Parse into:
{
  description: "Research OAuth providers and create comparison",
  delegate: "chat-claude",
  type: "research",
  output: "oauth-comparison.md"
}
```

**Step 2: Route Task Based on Delegation**

**If `[delegate:chat-claude]`:**

1. **Build Task Context**:
   ```javascript
   const context = `
   # Project Context
   ${readFile('.agent-os/product/mission.md')}

   ## Tech Stack
   ${readFile('.agent-os/product/tech-stack.md')}

   ## Current Feature
   ${readFile('.agent-os/specs/current-spec/srd.md')}
   ${readFile('.agent-os/specs/current-spec/specs.md')}
   `;
   ```

2. **Generate Task ID**:
   ```javascript
   const taskId = `${sanitize(task.output)}-${currentDate}`;
   // Example: "oauth-comparison-2025-01-15"
   ```

3. **Delegate via MCP**:
   ```javascript
   await mcp__chat_claude__delegate_task({
     task_id: taskId,
     task_type: task.type,
     description: task.description,
     context: context,
     output_format: 'markdown'
   });
   ```

4. **Mark Task Status**:
   - Update tasks.md: `- [⏳] Research OAuth providers...` (in progress)
   - Log: "Delegated to Chat Claude: {taskId}"
   - Continue to next task (don't wait for completion)

**If `[delegate:claude-code]` or no delegation metadata:**

1. Execute task normally with local tools
2. Follow standard TDD workflow
3. Create commits
4. Mark task complete

**Step 3: Parallel Execution Strategy**

**At Start of Feature**:
```
1. Scan all tasks in tasks.md
2. Identify all [delegate:chat-claude] tasks
3. Delegate all independent research/design tasks immediately
4. Begin working on implementation tasks
```

**During Feature Development**:
```
1. Work on implementation tasks
2. When you need delegated results, check status with list_tasks
3. Retrieve completed results with get_task_result
4. Integrate findings into implementation
5. Continue with remaining tasks
```

**Before Completing Feature**:
```
1. Ensure all delegated tasks are completed
2. Retrieve and review all results
3. Integrate any remaining documentation
4. Mark all tasks complete
5. Update roadmap
```

## MCP Tool Usage Patterns

### 1. Delegating a Task

```javascript
// When encountering [delegate:chat-claude] task

const result = await mcp__chat_claude__delegate_task({
  task_id: "oauth-research-2025-01-15",
  task_type: "research",
  description: `Research and compare OAuth 2.0 providers (Google, GitHub, Microsoft).

  Include:
  - Setup complexity
  - API capabilities
  - Rate limits
  - Pricing
  - Recommendations`,
  context: projectContext,
  output_format: "markdown"
});

// Result includes:
// - Confirmation of delegation
// - File path where result will be stored
// - Estimated completion (immediate in most cases)
```

### 2. Checking Task Status

```javascript
// List all delegated tasks
const tasks = await mcp__chat_claude__list_tasks({ status: "all" });

// Check specific status
const completed = await mcp__chat_claude__list_tasks({ status: "completed" });
const pending = await mcp__chat_claude__list_tasks({ status: "pending" });
const failed = await mcp__chat_claude__list_tasks({ status: "failed" });
```

### 3. Retrieving Results

```javascript
// Get specific task result
const result = await mcp__chat_claude__get_task_result({
  task_id: "oauth-research-2025-01-15"
});

// Result includes:
// - Task metadata
// - Full content
// - File path
// - Completion timestamp
```

### 4. Handling Failures

```javascript
// If a task fails
if (result.status === "failed") {
  console.log(`Task failed: ${result.error}`);

  // Options:
  // 1. Retry with improved description
  // 2. Handle locally instead
  // 3. Ask user for clarification
}
```

## Example: Complete Feature Workflow

### Scenario: Implementing Authentication Feature

**Initial `/create-spec` Output** (tasks.md):
```markdown
# Authentication Feature Tasks

## Research & Design (Chat Claude)
- [ ] Research OAuth 2.0 providers comparison [delegate:chat-claude] [type:research] [output:oauth-providers.md]
- [ ] Design user authentication database schema [delegate:chat-claude] [type:design] [output:auth-schema.md]
- [ ] Analyze security best practices for password storage [delegate:chat-claude] [type:analysis] [output:security-analysis.md]
- [ ] Create API documentation structure [delegate:chat-claude] [type:documentation] [output:api-docs.md]

## Implementation (Claude Code)
- [ ] Set up Supabase auth tables [delegate:claude-code] [type:implementation]
- [ ] Implement OAuth provider integration [delegate:claude-code] [type:implementation]
- [ ] Create login/signup API endpoints [delegate:claude-code] [type:implementation]
- [ ] Add JWT token handling [delegate:claude-code] [type:implementation]
- [ ] Implement password reset flow [delegate:claude-code] [type:implementation]

## Testing (Claude Code)
- [ ] Write auth service unit tests [delegate:claude-code] [type:testing]
- [ ] Test OAuth flows [delegate:claude-code] [type:testing]
- [ ] Test password reset [delegate:claude-code] [type:testing]
```

**Execution Timeline**:

**T+0min (Start)**:
```bash
/execute-task
```

Claude Code:
1. Parses tasks.md
2. Identifies 4 Chat Claude tasks
3. Delegates all 4 research/design tasks immediately
4. Begins working on "Set up Supabase auth tables"

**T+5min**:
Claude Code completes Supabase tables setup, starts OAuth implementation

Chat Claude completes OAuth providers research

**T+10min**:
Claude Code working on OAuth integration

Chat Claude completes schema design

**T+15min**:
Claude Code completes OAuth integration, retrieves OAuth research to inform implementation

Chat Claude completes security analysis

**T+20min**:
Claude Code working on API endpoints

Chat Claude completes API documentation

**T+30min**:
Claude Code completes all implementation tasks

All Chat Claude tasks complete

Claude Code retrieves all results, integrates documentation

**T+35min**:
All tasks marked complete

Feature implementation done!

**Result**: Feature completed in 35 minutes instead of 60+ minutes sequential execution.

## Integration with Existing Commands

### `/create-spec` Integration

Add to the command implementation:

```javascript
// After generating initial tasks.md
const tasks = parseTasksFromDescription(featureDescription, specs);

// Enhance with delegation metadata
const enhancedTasks = tasks.map(task => {
  const metadata = determineTaskDelegation(task);
  return {
    ...task,
    metadata: metadata
  };
});

// Write enhanced tasks.md
writeTasksFile(enhancedTasks);
```

### `/execute-task` Integration

Add to the command implementation:

```javascript
// Read and parse task
const task = getCurrentTask(tasksFile);

if (task.delegate === 'chat-claude') {
  // Delegate path
  await delegateTaskToChatClaude(task);
  // Move to next task (don't wait)
  await executeNextTask();
} else {
  // Local execution path
  await executeTaskLocally(task);
}
```

## Best Practices

### Do
✅ Delegate independent research tasks at the start
✅ Continue with implementation while Chat Claude works
✅ Provide rich project context when delegating
✅ Use descriptive output filenames
✅ Retrieve results only when needed
✅ Check for failed tasks and handle gracefully

### Don't
❌ Wait for Chat Claude results before starting local work
❌ Delegate tasks that require file system access
❌ Delegate tasks that depend on uncommitted local changes
❌ Forget to retrieve and integrate delegated results
❌ Delegate debugging or testing tasks

## Monitoring and Debugging

### Check MCP Server Status
```bash
# Test connection
mcp__chat_claude__test_connection()

# Should return: "Connection successful!"
```

### Monitor Active Tasks
```bash
# List all tasks with status
mcp__chat_claude__list_tasks({ status: "all" })

# Output shows:
# - Task IDs
# - Types
# - Status (pending/in_progress/completed/failed)
# - Creation/completion times
```

### Debug Failed Tasks
```javascript
// Get detailed error
const result = await mcp__chat_claude__get_task_result({
  task_id: "failed-task-id"
});

console.log(result.error);
console.log(result.metadata);
```

## Performance Impact

**Traditional Sequential Workflow**:
```
Research (20min) → Design (15min) → Implementation (30min) → Testing (15min) = 80min
```

**Parallel Workflow**:
```
Delegate Research + Design (1min)
  ↓
Implementation (30min) ← Research/Design complete in background (15-20min)
  ↓
Testing (15min)
= 46min total
```

**Improvement**: ~40% faster for typical features

## Troubleshooting

### Issue: Chat Claude MCP Server Not Available

**Solution**:
1. Check mcp.json configuration
2. Verify ANTHROPIC_API_KEY is set
3. Test connection: `mcp__chat_claude__test_connection()`
4. Check server logs in Claude Code

### Issue: Delegated Task Failed

**Solution**:
1. Retrieve error details
2. Check if description was clear enough
3. Verify context was provided
4. Retry with improved description or handle locally

### Issue: Can't Find Delegated Results

**Solution**:
1. Check `.agent-os/specs/YYYY-MM-DD-feature/delegated-results/`
2. Use `get_task_result` to retrieve content
3. Verify task actually completed (not still pending)

## Summary

The parallel workflow system transforms Agent-OS 2.0 from a sequential process into a concurrent execution engine:

- **Spec Creation**: Automatically identifies and tags delegatable tasks
- **Task Execution**: Routes tasks to appropriate executor (Chat Claude or Claude Code)
- **Result Integration**: Seamlessly incorporates Chat Claude results
- **Performance**: Significantly faster feature development
- **Quality**: Each AI handles what it does best

This creates a true "pair programming" experience where both AIs contribute their strengths simultaneously.

---

**Remember**: The key is identifying which tasks benefit from Chat Claude's exploratory nature vs Claude Code's implementation precision. When in doubt, delegate research/docs/design, handle implementation/testing locally.
