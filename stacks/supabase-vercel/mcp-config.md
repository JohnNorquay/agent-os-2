# MCP Server Configuration for Supabase + Vercel Stack

## Overview
This configuration file defines MCP servers that provide live context and automation for the Supabase + Vercel stack.

## Installation

MCP servers are configured in Claude Code's configuration. Add these to your `~/.claude/mcp.json` or project-specific MCP config.

## Supabase MCP Server

### Purpose
- Query database schema
- Check RLS policies  
- View table structures
- Get environment configuration

### Configuration
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    }
  }
}
```

### Available Tools
- `list_tables` - List all tables in database
- `describe_table` - Get schema for specific table
- `list_policies` - List RLS policies
- `execute_sql` - Run SQL queries (read-only recommended)

### Usage Example
When creating a spec for user authentication:
1. Query current database schema
2. Check if users table exists
3. Review existing auth policies
4. Generate appropriate migrations

## Vercel MCP Server (Hypothetical)

### Purpose
- Check deployment status
- Manage environment variables
- View deployment logs
- Trigger deployments

### Configuration
```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vercel/mcp-server"],
      "env": {
        "VERCEL_TOKEN": "${VERCEL_TOKEN}",
        "VERCEL_PROJECT_ID": "${VERCEL_PROJECT_ID}"
      }
    }
  }
}
```

### Available Tools (Hypothetical)
- `list_deployments` - Get recent deployments
- `get_deployment_status` - Check status of specific deployment
- `list_env_vars` - List environment variables
- `set_env_var` - Update environment variable
- `trigger_deployment` - Start new deployment

## Git MCP Server

### Purpose
- Repository operations
- Commit history
- Branch management

### Configuration
```json
{
  "mcpServers": {
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    }
  }
}
```

### Available Tools
- `git_status` - Get repository status
- `git_diff` - View changes
- `git_log` - View commit history
- `git_commit` - Create commits
- `git_branch` - Manage branches

## Filesystem MCP Server

### Purpose
- File system operations
- Read/write files
- Directory management

### Configuration
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"]
    }
  }
}
```

## Security Notes

1. **Service Role Keys**: Only use service role keys in local development or CI/CD
2. **Environment Variables**: Store sensitive keys in environment, not in config files
3. **Read-Only When Possible**: Prefer read-only operations for MCP tools
4. **Token Rotation**: Regularly rotate API tokens and keys

## Troubleshooting

### MCP Server Won't Connect
1. Verify server package is installed: `npm install -g @supabase/mcp-server`
2. Check environment variables are set correctly
3. Ensure tokens/keys have appropriate permissions
4. Check server logs for errors

### Tool Not Available
1. Verify MCP server configuration is correct
2. Restart Claude Code
3. Check server documentation for available tools

## Creating Custom MCP Servers

You can create project-specific MCP servers for:
- Custom API integrations
- Internal tooling
- Proprietary services
- Specialized operations

See MCP documentation: https://modelcontextprotocol.io/

---

**Note**: This configuration is for the Supabase + Vercel stack. Other stacks would have different MCP server configurations appropriate to their tools and services.
