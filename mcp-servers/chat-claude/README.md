# Chat Claude MCP Server

Enables parallel workflow execution in Agent-OS 2.0 by delegating research, documentation, design, and planning tasks to Chat Claude while Claude Code handles implementation tasks in the IDE.

## Overview

This MCP server creates a powerful division of labor:

- **Chat Claude**: Research, documentation, design, analysis, planning
- **Claude Code**: Implementation, testing, debugging, git operations, deployment

By working in parallel, features are developed significantly faster while maintaining high quality.

## Installation

### 1. Dependencies

The server is already installed with dependencies. If you need to reinstall:

```bash
cd ~/.claude/plugins/agent-os-2/mcp-servers/chat-claude
npm install
```

### 2. Configuration

The server is already configured in `~/.claude/mcp.json` with your API key.

To verify configuration:

```json
{
  "mcpServers": {
    "chat-claude": {
      "command": "node",
      "args": [
        "/home/ohn_orquay/.claude/plugins/agent-os-2/mcp-servers/chat-claude/chat-claude-server.js"
      ],
      "env": {
        "ANTHROPIC_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### 3. Test Connection

In Claude Code, test the connection:

```javascript
await mcp__chat_claude__test_connection();
// Should return: "Connection successful!"
```

## Usage

### Basic Delegation

When you encounter a task in `tasks.md` with `[delegate:chat-claude]` metadata:

```javascript
await mcp__chat_claude__delegate_task({
  task_id: "oauth-research-2025-01-15",
  task_type: "research",
  description: "Research OAuth 2.0 providers and compare features",
  context: "Project uses Next.js + Supabase...",
  output_format: "markdown"
});
```

### Task Types

1. **research**: Comparative research, technology evaluation, best practices
2. **documentation**: API docs, user guides, technical specifications
3. **design**: Architecture design, database schemas, API designs
4. **analysis**: Code analysis, performance analysis, security reviews
5. **planning**: Project planning, task breakdown, migration strategies

### Checking Status

```javascript
// List all tasks
await mcp__chat_claude__list_tasks({ status: "all" });

// Check completed tasks
await mcp__chat_claude__list_tasks({ status: "completed" });

// Check failed tasks
await mcp__chat_claude__list_tasks({ status: "failed" });
```

### Retrieving Results

```javascript
await mcp__chat_claude__get_task_result({
  task_id: "oauth-research-2025-01-15"
});
```

Results are automatically stored in:
```
.agent-os/specs/YYYY-MM-DD-feature-name/delegated-results/filename.md
```

## MCP Tools

### delegate_task

Delegate a task to Chat Claude for execution.

**Parameters**:
- `task_id` (string, required): Unique identifier
- `task_type` (enum, required): research | documentation | design | analysis | planning
- `description` (string, required): Detailed task description
- `context` (string, optional): Project context to help Chat Claude
- `output_format` (enum, optional): markdown | json | text (default: markdown)

**Returns**:
- Task confirmation with file path where result will be stored
- Token usage stats
- Preview of result

### get_task_result

Retrieve the result of a delegated task.

**Parameters**:
- `task_id` (string, required): Task identifier

**Returns**:
- Task metadata (status, timestamps, etc.)
- Full content of the result
- File path if stored

### list_tasks

List all delegated tasks with optional status filter.

**Parameters**:
- `status` (enum, optional): all | pending | in_progress | completed | failed (default: all)

**Returns**:
- Statistics (total, pending, completed, failed)
- List of tasks with metadata

### cancel_task

Cancel a pending or in-progress task.

**Parameters**:
- `task_id` (string, required): Task identifier

**Returns**:
- Confirmation of cancellation

### test_connection

Test connection to Claude API.

**Parameters**: None

**Returns**:
- Connection status
- Test response from Claude API

## Integration with Agent-OS 2.0

### In Spec Creation (`/create-spec`)

Tasks are automatically tagged with delegation metadata:

```markdown
## Feature Tasks

### Research & Design (Chat Claude)
- [ ] Research OAuth providers [delegate:chat-claude] [type:research] [output:oauth-comparison.md]
- [ ] Design database schema [delegate:chat-claude] [type:design] [output:auth-schema.md]

### Implementation (Claude Code)
- [ ] Implement auth tables [delegate:claude-code] [type:implementation]
- [ ] Write unit tests [delegate:claude-code] [type:testing]
```

### In Task Execution (`/execute-task`)

Claude Code automatically:
1. Detects delegation metadata
2. Routes Chat Claude tasks to MCP server
3. Continues with local implementation tasks
4. Retrieves results when needed

## Workflow Example

### Scenario: Building Authentication Feature

**Step 1: Create Spec**
```bash
/create-spec Add user authentication with OAuth and password reset
```

Generated tasks.md includes:
```markdown
- [ ] Research OAuth providers [delegate:chat-claude] [type:research]
- [ ] Design auth schema [delegate:chat-claude] [type:design]
- [ ] Implement Supabase auth [delegate:claude-code] [type:implementation]
- [ ] Write tests [delegate:claude-code] [type:testing]
```

**Step 2: Execute Tasks**
```bash
/execute-task
```

Claude Code:
1. Delegates OAuth research to Chat Claude (background)
2. Delegates schema design to Chat Claude (background)
3. Starts implementing Supabase auth setup
4. Chat Claude completes research (15-20 min)
5. Claude Code retrieves research results
6. Uses findings to complete OAuth implementation
7. All tasks done in ~35 min vs 60+ min sequential

## Best Practices

### Do ✅

- Delegate research-heavy tasks to Chat Claude
- Keep implementation tasks with Claude Code
- Provide rich context when delegating
- Use descriptive, unique task IDs
- Specify output filenames
- Delegate all independent tasks early
- Retrieve results only when needed

### Don't ❌

- Delegate file editing tasks to Chat Claude
- Delegate testing/debugging to Chat Claude
- Wait for delegated results before starting local work
- Forget to provide project context
- Use vague task descriptions
- Delegate tasks that depend on local file state

## Troubleshooting

### Server Won't Start

**Check**:
1. Node.js version (requires >= 18.0.0)
2. Dependencies installed: `npm install`
3. MCP configuration in `~/.claude/mcp.json`

### API Connection Fails

**Check**:
1. ANTHROPIC_API_KEY is set correctly
2. API key has valid permissions
3. Network connectivity
4. Test with: `mcp__chat_claude__test_connection()`

### Task Fails

**Reasons**:
- Description too vague
- Missing context
- Invalid parameters
- API rate limits

**Solution**:
- Check error message with `get_task_result`
- Improve task description
- Add more context
- Retry or handle locally

### Can't Find Results

**Check**:
1. Task actually completed (not pending/failed)
2. Look in `.agent-os/specs/[spec-name]/delegated-results/`
3. Use `get_task_result` to retrieve content
4. Check task ID is correct

## Performance

### Token Efficiency

Chat Claude MCP uses token-efficient prompts:
- Research: ~4,000-6,000 output tokens
- Documentation: ~3,000-5,000 output tokens
- Design: ~2,000-4,000 output tokens

### Speed Improvement

Parallel execution typically provides:
- 30-50% faster feature development
- Better quality research and documentation
- More thorough design exploration
- Reduced context-switching for implementation

## Architecture

### Components

1. **chat-claude-server.js**: Main MCP server
2. **claude-api-client.js**: Claude API integration
3. **task-manager.js**: Task state management

### Data Flow

```
Claude Code → MCP Server → Claude API → Chat Claude
                ↓
          Task Manager
                ↓
     Result Storage (.agent-os/)
                ↓
           Claude Code (retrieves results)
```

### Result Storage

```
.agent-os/specs/YYYY-MM-DD-feature-name/
└── delegated-results/
    ├── oauth-providers-comparison.md
    ├── auth-database-schema.md
    └── api-documentation.md
```

Each result file includes:
- Task metadata
- Full content from Chat Claude
- Timestamps
- Generation attribution

## API Rate Limits

Be aware of Anthropic API rate limits:
- Requests per minute: Varies by plan
- Tokens per minute: Varies by plan

The MCP server executes tasks sequentially to avoid rate limit issues.

## Security

- API key stored securely in MCP configuration
- No credentials logged
- Results stored locally in project
- No data sent to third parties

## Development

### Running Locally

```bash
cd ~/.claude/plugins/agent-os-2/mcp-servers/chat-claude
node chat-claude-server.js
```

### Testing

```javascript
// Test connection
await mcp__chat_claude__test_connection();

// Test delegation
await mcp__chat_claude__delegate_task({
  task_id: "test-task-123",
  task_type: "research",
  description: "Test task",
  output_format: "markdown"
});

// Check result
await mcp__chat_claude__get_task_result({
  task_id: "test-task-123"
});
```

## Support

For issues or questions:
1. Check this README
2. Review `~/.claude/plugins/agent-os-2/skills/task-delegation.md`
3. Check `~/.claude/plugins/agent-os-2/core/parallel-workflow-guide.md`
4. Test MCP connection
5. Check Claude Code logs

## Version

Current version: 0.1.0

## License

MIT License - Part of Agent-OS 2.0

---

**Remember**: This integration is about smart delegation. Chat Claude excels at exploration and comprehensiveness, while Claude Code excels at precision and implementation. Together, they're unstoppable.
