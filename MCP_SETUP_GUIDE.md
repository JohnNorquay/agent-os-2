# MCP Server Setup Guide for Agent-OS-2

## Overview

This guide explains how MCP (Model Context Protocol) servers are configured for the agent-os-2 project, ensuring full functionality for Supabase, Vercel, Fly.io, and chat-claude integrations whenever you start Claude Code.

## Problem Statement

When working with agent-os-2, we need immediate access to:
- **Supabase databases** (PickSix & IntegrationDirector) - for SQL queries and database operations
- **Vercel API** - for deployment management
- **Fly.io API** - for application hosting
- **Chat Claude** - for parallel AI agent workflows

Without proper MCP configuration, these tools won't be available, preventing you from executing SQL queries or managing deployments.

## Solution: Project-Scoped MCP Configuration

Claude Code loads MCP servers from a **`.mcp.json` file in the project root**. This is a project-scoped configuration that ensures all MCP servers start automatically when you open the project.

### File Location

```
/home/ohn_orquay/.claude/plugins/agent-os-2/.mcp.json
```

### Configuration Structure

```json
{
  "mcpServers": {
    "supabase-PickSix": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "https://aidaxmvsmfjdnimuxrex.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-key"
      }
    },
    "supabase-IntegrationDirector": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "https://evllxrejudhifvsllqho.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-key"
      }
    },
    "vercel": { ... },
    "flyio": { ... },
    "chat-claude": { ... }
  }
}
```

## Available MCP Servers

Once configured, you'll have access to the following MCP tools in Claude Code:

### 1. Supabase MCP Servers

**Server Names:**
- `supabase-PickSix`
- `supabase-IntegrationDirector`

**Expected Tools:**
- `mcp__supabase-PickSix__execute_sql` - Execute SQL queries on PickSix database
- `mcp__supabase-PickSix__list_tables` - List all tables in PickSix database
- `mcp__supabase-PickSix__get_schema` - Get table schema information
- *(Same tools available for supabase-IntegrationDirector)*

**Capabilities:**
- Execute raw SQL queries
- Create/modify tables
- Insert/update/delete data
- Query database schema
- Manage database migrations

### 2. Vercel MCP Server

**Server Name:** `vercel`

**Expected Tools:**
- `mcp__vercel__list_projects` - List all Vercel projects
- `mcp__vercel__deploy` - Deploy to Vercel
- `mcp__vercel__get_deployments` - Get deployment history
- `mcp__vercel__get_logs` - Fetch deployment logs

**Capabilities:**
- Deploy applications to Vercel
- Manage projects and domains
- View deployment status and logs
- Configure environment variables

### 3. Fly.io MCP Server

**Server Name:** `flyio`

**Expected Tools:**
- `mcp__flyio__list_apps` - List all Fly.io applications
- `mcp__flyio__deploy` - Deploy to Fly.io
- `mcp__flyio__get_status` - Check application status
- `mcp__flyio__scale` - Scale application resources

**Capabilities:**
- Deploy and manage Fly.io applications
- Scale resources (RAM, CPU, instances)
- View application logs
- Configure secrets and volumes

### 4. Chat Claude MCP Server

**Server Name:** `chat-claude`

**Expected Tools:**
- `mcp__chat-claude__create_conversation` - Start new Claude conversation
- `mcp__chat-claude__send_message` - Send message to Claude
- `mcp__chat-claude__continue_conversation` - Continue existing conversation

**Capabilities:**
- Execute parallel AI workflows
- Delegate complex tasks to separate Claude instances
- Implement multi-agent collaboration patterns

## Verification

### How to Check if MCP Servers are Loaded

After restarting Claude Code, verify that MCP servers are loaded by:

1. **Check available tools:** Look for tools with `mcp__` prefix in your tool list
2. **Review debug logs:** Check `~/.claude/debug/[session-id].txt` for MCP initialization messages
3. **Test functionality:** Try executing a simple SQL query or listing projects

### Expected Log Output

In the debug logs (`~/.claude/debug/*.txt`), you should see:

```
[DEBUG] MCP server "supabase-PickSix": Starting connection with timeout of 30000ms
[DEBUG] MCP server "supabase-PickSix": Successfully connected to stdio server in XXXms
[DEBUG] MCP server "supabase-PickSix": Connection established with capabilities: {"hasTools":true,...}
```

This should repeat for each configured MCP server.

## Troubleshooting

### MCP Servers Not Loading

**Symptom:** No `mcp__supabase__*` tools available

**Solutions:**
1. Verify `.mcp.json` exists in project root
2. Check JSON syntax is valid
3. Restart Claude Code to reload configuration
4. Review debug logs for error messages

### Connection Errors

**Symptom:** MCP server starts but tools fail

**Solutions:**
1. Verify credentials (SUPABASE_SERVICE_KEY, VERCEL_TOKEN, etc.)
2. Check network connectivity
3. Ensure Supabase/Vercel/Fly.io services are accessible
4. Verify NPM packages are installed (`@supabase/mcp-server-supabase`)

### Permission Errors

**Symptom:** Tools execute but return permission denied

**Solutions:**
1. Verify service keys have correct permissions
2. For Supabase, ensure using `service_role` key, not `anon` key
3. Check API token scopes for Vercel/Fly.io

## Security Considerations

**IMPORTANT:** The `.mcp.json` file contains sensitive credentials:
- Supabase service keys
- Vercel API tokens
- Fly.io API tokens
- Anthropic API keys

**Best Practices:**
1. Add `.mcp.json` to `.gitignore`
2. Never commit credentials to version control
3. Use environment variables for team sharing (see `.env.example`)
4. Rotate keys if accidentally exposed

## Environment Variable Support

For team collaboration, you can use environment variable expansion:

```json
{
  "mcpServers": {
    "supabase-PickSix": {
      "env": {
        "SUPABASE_URL": "${SUPABASE_PICKSIX_URL}",
        "SUPABASE_SERVICE_KEY": "${SUPABASE_PICKSIX_SERVICE_KEY}"
      }
    }
  }
}
```

Then share `.env.example` with your team, and each developer maintains their own `.env` file.

## Quick Start for New Projects

When setting up agent-os-2 in a new project:

1. **Copy `.mcp.json`** to your project root
2. **Update credentials** with your actual values
3. **Restart Claude Code** to load MCP servers
4. **Verify tools** are available with `mcp__` prefix
5. **Test functionality** with a simple query

## Additional Resources

- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code/mcp)
- [Supabase MCP Server](https://github.com/supabase/mcp-server-supabase)
- [MCP Protocol Specification](https://modelcontextprotocol.io)

## Support

If you encounter issues with MCP server setup:
1. Check debug logs: `~/.claude/debug/*.txt`
2. Verify configuration syntax
3. Test credentials manually
4. Review Claude Code documentation

---

**Last Updated:** 2025-10-22
**Agent-OS-2 Version:** 2.0+
