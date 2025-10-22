# Task Delegation Skill

## Overview
This skill enables parallel workflow execution by allowing Claude Code to delegate specific types of tasks to Chat Claude via the Chat Claude MCP server. This creates a powerful division of labor where each AI works on what it does best.

## When to Use Task Delegation

### Delegate to Chat Claude
These tasks are **better handled by Chat Claude** because they require exploration, research, and long-form content creation:

1. **Research Tasks**
   - Comparing technologies, frameworks, or approaches
   - Investigating best practices
   - Analyzing third-party APIs or services
   - Creating comparison matrices
   - Exploring design patterns

2. **Documentation Tasks**
   - Writing comprehensive API documentation
   - Creating user guides
   - Drafting technical specifications
   - Generating changelog entries
   - Writing architecture decision records (ADRs)

3. **Design Tasks**
   - Designing system architecture
   - Planning database schemas
   - Creating API endpoint designs
   - Designing data flow diagrams
   - Architecting component structures

4. **Analysis Tasks**
   - Analyzing existing codebases
   - Reviewing architecture
   - Identifying optimization opportunities
   - Analyzing security implications
   - Evaluating performance bottlenecks

5. **Planning Tasks**
   - Breaking down complex features
   - Creating project timelines
   - Planning migration strategies
   - Designing test strategies
   - Creating deployment plans

### Handle Locally (Claude Code)
These tasks are **better handled by Claude Code** because they require direct file access and tool usage:

1. **Implementation Tasks**
   - Writing code
   - Creating new files
   - Editing existing files
   - Refactoring code

2. **Testing Tasks**
   - Writing tests
   - Running tests
   - Debugging test failures
   - Checking test coverage

3. **Build/Deploy Tasks**
   - Running builds
   - Deployment operations
   - Environment configuration
   - CI/CD operations

4. **Git Operations**
   - Creating commits
   - Managing branches
   - Merging code
   - Resolving conflicts

5. **Debugging Tasks**
   - Investigating bugs
   - Reading error logs
   - Testing fixes
   - Reproducing issues

## Task Delegation Metadata Format

When creating tasks in `tasks.md`, use this metadata format for delegated tasks:

```markdown
- [ ] Task description [delegate:chat-claude] [type:research] [output:filename.md]
```

### Metadata Fields

1. **`[delegate:chat-claude]`** (required for delegated tasks)
   - Indicates this task should be delegated to Chat Claude
   - Claude Code will use the Chat Claude MCP server for this task

2. **`[type:TYPE]`** (required)
   - Valid types: `research`, `documentation`, `design`, `analysis`, `planning`
   - Tells Chat Claude what kind of task this is
   - Chat Claude uses different system prompts for each type

3. **`[output:filename.md]`** (optional but recommended)
   - Specifies the filename for storing the result
   - Result will be stored in `.agent-os/specs/YYYY-MM-DD-feature/delegated-results/filename.md`
   - If not specified, a filename will be auto-generated

### Examples

```markdown
## Authentication Feature

### Research & Design (Delegated to Chat Claude)
- [ ] Research OAuth 2.0 providers (Google, GitHub, Microsoft) [delegate:chat-claude] [type:research] [output:oauth-providers-comparison.md]
- [ ] Design database schema for user authentication [delegate:chat-claude] [type:design] [output:auth-database-schema.md]
- [ ] Create API documentation structure [delegate:chat-claude] [type:documentation] [output:api-docs-structure.md]
- [ ] Analyze security best practices for password storage [delegate:chat-claude] [type:analysis] [output:password-security-analysis.md]

### Implementation (Claude Code Handles)
- [ ] Set up Supabase auth tables [delegate:claude-code] [type:implementation]
- [ ] Implement OAuth integration with Supabase [delegate:claude-code] [type:implementation]
- [ ] Create login/signup API endpoints [delegate:claude-code] [type:implementation]
- [ ] Write unit tests for auth service [delegate:claude-code] [type:testing]
- [ ] Add auth middleware to protected routes [delegate:claude-code] [type:implementation]
```

## Workflow Integration

### Phase 2: Spec Creation
When creating specs with `/create-spec`, the orchestrator should:

1. Analyze the feature requirements
2. Identify which tasks should be delegated vs handled locally
3. Add appropriate delegation metadata to tasks in `tasks.md`
4. Group delegated tasks together for easy identification

### Phase 3: Task Execution
When executing tasks with `/execute-task`, the orchestrator should:

1. **Check for delegation metadata** when reading tasks
2. **For delegated tasks**:
   ```javascript
   // Pseudo-code for the workflow
   if (task.metadata.includes('[delegate:chat-claude]')) {
     // Extract task details
     const taskType = extractMetadata(task, 'type');
     const outputFile = extractMetadata(task, 'output');

     // Build context from project docs
     const context = buildTaskContext(mission, roadmap, specs);

     // Delegate to Chat Claude via MCP
     await delegateTask({
       task_id: generateTaskId(task),
       task_type: taskType,
       description: task.description,
       context: context,
       output_format: 'markdown'
     });

     // Mark task as in-progress
     // Results will be available later
   }
   ```

3. **For local tasks**: Execute normally with code editing, testing, etc.

## Using the Chat Claude MCP Server

### Available MCP Tools

1. **`delegate_task`**
   - Sends a task to Chat Claude for execution
   - Returns immediately with task ID
   - Task executes and result is stored in project

2. **`get_task_result`**
   - Retrieves the result of a completed task
   - Returns full content or error message

3. **`list_tasks`**
   - Lists all delegated tasks and their status
   - Can filter by status: pending, in_progress, completed, failed

4. **`cancel_task`**
   - Cancels a task that hasn't started yet
   - Useful if requirements change

5. **`test_connection`**
   - Tests the connection to Claude API
   - Useful for debugging MCP server issues

### Example: Delegating a Research Task

```javascript
// In the orchestrator workflow
const result = await mcp.delegate_task({
  task_id: 'oauth-providers-2025-01-15',
  task_type: 'research',
  description: `Research and compare OAuth 2.0 providers (Google, GitHub, Microsoft) for our authentication system.

Include:
- Setup complexity
- User base and adoption
- API capabilities
- Rate limits
- Pricing
- Documentation quality
- Developer experience

Provide a recommendation for which provider(s) to implement.`,
  context: `
Project: SaaS web application
Stack: Next.js + Supabase + Vercel
Target users: B2B professionals
Scale: Starting with <1000 users, scaling to 10k+
`,
  output_format: 'markdown'
});

// Result is stored in .agent-os/specs/2025-01-15-auth/delegated-results/oauth-providers-comparison.md
```

## Parallel Execution Strategy

The power of task delegation is in parallel execution:

1. **Identify Independent Tasks**
   - Find tasks that don't depend on each other
   - Separate research/design from implementation

2. **Delegate Research/Design First**
   - Start delegated tasks at the beginning of spec execution
   - These run in the background while you work on implementation

3. **Work on Implementation**
   - While Chat Claude handles research/docs/design
   - Claude Code handles file operations, code writing, testing

4. **Integrate Results**
   - Retrieve delegated task results when needed
   - Use research findings to inform implementation
   - Include generated documentation in project

### Example Workflow

```markdown
# Day 1 - Parallel Execution

Morning:
1. Delegate research tasks to Chat Claude
   - OAuth provider comparison
   - Security best practices analysis
   - Database schema design

2. While Chat Claude works, start implementation
   - Set up Supabase project
   - Create initial file structure
   - Configure environment variables

Afternoon:
3. Retrieve research results
   - Read OAuth provider comparison
   - Review security recommendations
   - Check database schema design

4. Continue implementation informed by research
   - Implement chosen OAuth provider
   - Apply security best practices
   - Create database tables per schema design

Evening:
5. Delegate documentation tasks
   - API documentation
   - User guide sections

6. Continue with testing and refinement
   - Write unit tests
   - Test OAuth flows
   - Fix any issues

End of Day:
7. Retrieve documentation
8. Review and integrate into project
9. Create commit with all work
```

## Best Practices

### Do
- ✅ Delegate research-heavy tasks to Chat Claude
- ✅ Keep implementation tasks with Claude Code
- ✅ Provide rich context when delegating
- ✅ Use descriptive task IDs
- ✅ Specify output filenames
- ✅ Delegate independent tasks early
- ✅ Retrieve results when needed for implementation

### Don't
- ❌ Delegate file editing tasks to Chat Claude
- ❌ Delegate testing tasks to Chat Claude
- ❌ Wait for delegated results before starting local work
- ❌ Forget to provide project context
- ❌ Use vague task descriptions
- ❌ Delegate tasks that depend on local file state

## Error Handling

If a delegated task fails:

1. **Check the error message**
   ```javascript
   const result = await mcp.get_task_result({ task_id: 'oauth-research' });
   // Check result.status and result.error
   ```

2. **Common issues**:
   - API key not configured
   - Task description too vague
   - Missing context
   - Network issues

3. **Fallback strategy**:
   - If delegation fails, handle task locally
   - Or ask user for clarification
   - Or retry with improved description

## Integration with Agent-OS 2.0

The task delegation system integrates seamlessly with Agent-OS 2.0:

- **Spec Creation**: Automatically identify delegatable tasks
- **Task Execution**: Check for delegation metadata and route accordingly
- **Result Storage**: Store in spec's `delegated-results/` directory
- **Progress Tracking**: Update tasks.md as tasks complete
- **Context Awareness**: Use mission.md, roadmap.md, and specs for context

## Monitoring Delegated Tasks

Use the `list_tasks` MCP tool to monitor progress:

```javascript
// Check all tasks
await mcp.list_tasks({ status: 'all' });

// Check only completed tasks
await mcp.list_tasks({ status: 'completed' });

// Check failed tasks
await mcp.list_tasks({ status: 'failed' });
```

## Summary

Task delegation transforms Agent-OS 2.0 from a sequential workflow into a parallel execution engine:

- **Claude Code**: Fast, precise, file-focused, hands-on implementation
- **Chat Claude**: Thoughtful, exploratory, research-focused, comprehensive

Together, they enable professional development teams to move faster and build better software.

---

**Remember**: The key to effective delegation is choosing the right tasks. When in doubt:
- Can Chat Claude do this without file access? → Delegate
- Does this require editing files or running tools? → Handle locally
