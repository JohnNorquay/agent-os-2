# MCP Server Configuration for Agent-OS 2.0

## REQUIRED: Enable All MCP Servers

Agent-OS 2.0 requires **all 9 configured MCP servers** to be enabled for full functionality.

---

## Configuration Files

### 1. Global Settings: `~/.claude/settings.json`

This enables MCP servers for **ALL Claude Code sessions globally**.

**Location:** `/home/ohn_orquay/.claude/settings.json`

**Required content:**
```json
{
  "feedbackSurveyState": {
    "lastShownTime": 1754496788496
  },
  "alwaysThinkingEnabled": false,
  "enabledMcpjsonServers": [
    "supabase-PickSix",
    "supabase-IntegrationDirector",
    "vercel",
    "flyio",
    "chat-claude",
    "github",
    "slack",
    "playwright",
    "filesystem"
  ]
}
```

### 2. Project Settings: `.claude/settings.local.json`

Each project can override global settings.

**Location:** `/home/ohn_orquay/.claude/plugins/agent-os-2/.claude/settings.local.json`

**Required content:**
```json
{
  "permissions": {
    "allow": [
      "Read(//home/ohn_orquay/.claude/**)",
      "Read(//home/ohn_orquay/**)",
      "Bash(npx:*)",
      "Bash(gh:*)",
      "WebSearch",
      "mcp__chat-claude__*",
      "mcp__github__*",
      "mcp__slack__*",
      "mcp__playwright__*",
      "mcp__filesystem__*",
      "mcp__vercel__*",
      "mcp__flyio__*",
      "mcp__supabase__*"
    ],
    "deny": [],
    "ask": []
  },
  "enabledMcpjsonServers": [
    "supabase-PickSix",
    "supabase-IntegrationDirector",
    "vercel",
    "flyio",
    "chat-claude",
    "github",
    "slack",
    "playwright",
    "filesystem"
  ]
}
```

---

## The 9 Required MCP Servers

### Core Infrastructure Servers
1. **chat-claude** - Task delegation to Chat Claude for research/documentation
2. **filesystem** - Secure file operations with access controls
3. **github** - Repository management and GitHub API operations

### Deployment Servers
4. **vercel** - Vercel deployment management
5. **flyio** - Fly.io deployment management

### Database Servers
6. **supabase-PickSix** - Supabase database for PickSix project
7. **supabase-IntegrationDirector** - Supabase database for IntegrationDirector project

### Testing & Communication Servers
8. **playwright** - Browser automation and visual testing
9. **slack** - Team notifications and communication

---

## Why All 9 Servers?

Agent-OS 2.0's **hybrid multi-agent architecture** relies on these servers:

| Server | Used By | Purpose |
|--------|---------|---------|
| chat-claude | Orchestrator | Delegates research/docs tasks |
| filesystem | All agents | File read/write operations |
| github | All agents | Repository operations |
| vercel | Deployment | Deploy frontend to Vercel |
| flyio | Deployment | Deploy backend to Fly.io |
| supabase-* | Database agent | Database operations |
| playwright | UI/Testing agents | Visual testing, screenshots |
| slack | Notifications | Send progress updates |

---

## Configuration Check

### Verify Global Settings
```bash
cat ~/.claude/settings.json | grep -A 12 enabledMcpjsonServers
```

You should see all 9 servers listed.

### Verify Project Settings
```bash
cat ~/.claude/plugins/agent-os-2/.claude/settings.local.json | grep -A 12 enabledMcpjsonServers
```

You should see all 9 servers listed.

### Verify MCP Server Definitions
```bash
cat ~/.claude/mcp.json
```

You should see configurations for all 9 servers with their commands and credentials.

---

## After Configuration Changes

**IMPORTANT:** After modifying these files, you **MUST** restart your Claude Code session:

1. Exit current Claude Code session
2. Close terminal/IDE
3. Restart Claude Code
4. MCP servers will reload with new configuration

---

## Troubleshooting

### Problem: Only seeing `mcp__chat-claude__*` tools

**Cause:** Other servers not enabled in `enabledMcpjsonServers`

**Fix:**
1. Add all 9 servers to `~/.claude/settings.json`
2. Add all 9 servers to `.claude/settings.local.json`
3. Restart Claude Code

### Problem: Server defined but not available

**Cause:** Server enabled but not configured in `~/.claude/mcp.json`

**Fix:**
1. Verify server exists in `mcp.json`
2. Check credentials are set correctly
3. Restart Claude Code

### Problem: MCP server fails to start

**Cause:** Missing credentials or invalid configuration

**Fix:**
1. Check server logs: `ps aux | grep mcp`
2. Verify environment variables are set
3. Test server manually: `npx @package-name`

---

## How This Works

```
┌─────────────────────────────────────────────────────────────┐
│ Claude Code Session Startup                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. Read ~/.claude/mcp.json                                   │
│    → Finds 9 server definitions                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Read ~/.claude/settings.json                              │
│    → Checks enabledMcpjsonServers list                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Read .claude/settings.local.json (if in project)          │
│    → Overrides global enabledMcpjsonServers if present       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Start only enabled servers                                │
│    → Spawns process for each enabled server                  │
│    → Makes tools available (mcp__servername__*)              │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration Template

For **any project** using Agent-OS 2.0, include this in `.claude/settings.local.json`:

```json
{
  "enabledMcpjsonServers": [
    "supabase-PickSix",
    "supabase-IntegrationDirector",
    "vercel",
    "flyio",
    "chat-claude",
    "github",
    "slack",
    "playwright",
    "filesystem"
  ]
}
```

This ensures all Agent-OS 2.0 capabilities are available in that project.

---

## Status Check

Run this to verify all servers are running:

```bash
ps aux | grep -E "(mcp|chat-claude|github|slack|playwright)" | grep -v grep
```

You should see processes for each enabled server.

---

## Summary

✅ **Global config updated:** All 9 servers enabled globally
✅ **Project config updated:** All 9 servers enabled for agent-os-2
⏳ **Restart required:** Restart Claude Code to activate changes

After restart, you'll have access to:
- `mcp__chat-claude__*` tools
- `mcp__github__*` tools
- `mcp__slack__*` tools
- `mcp__playwright__*` tools
- `mcp__filesystem__*` tools
- `mcp__vercel__*` tools (if configured)
- `mcp__flyio__*` tools (if configured)
- `mcp__supabase__*` tools (if configured)
