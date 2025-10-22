# Answer: MCP Servers Available From Any Project

## Your Question
> "I would like this functionality whenever I access agent-os-2 from any project file. Is this the same?"

## Short Answer
**Yes, you already have this!** Your MCP servers are configured **globally** and are available from **any project directory** you open in Claude Code.

## Evidence

### 1. Global Configuration Exists ✓
**File**: `/home/ohn_orquay/.claude/mcp.json`

This file contains all 5 MCP servers:
- chat-claude
- vercel
- flyio
- supabase-PickSix
- supabase-IntegrationDirector

### 2. Server Paths Are Absolute ✓
Your global config uses **absolute paths**, which means they work from any directory:

```json
{
  "chat-claude": {
    "command": "node",
    "args": [
      "/home/ohn_orquay/.claude/plugins/agent-os-2/mcp-servers/chat-claude/chat-claude-server.js"
      ↑ Absolute path - works from anywhere!
    ]
  }
}
```

### 3. Currently Working ✓
We can prove this is working right now:
- You're in a Claude Code session
- The `mcp__chat-claude__*` tools are available
- These tools came from your global MCP configuration
- They would be available from **any directory** you start Claude Code in

## How Global MCP Config Works

```
┌─────────────────────────────────────────────────────┐
│           Start Claude Code in ANY project          │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│      1. Read ~/.claude/mcp.json (global config)     │
│         - chat-claude                               │
│         - vercel                                    │
│         - flyio                                     │
│         - supabase-PickSix                          │
│         - supabase-IntegrationDirector              │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│   2. Read $PROJECT/.mcp.json (if exists)            │
│      - Merges with global config                   │
│      - Project-specific servers can be added        │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│   3. Start all MCP servers from merged config       │
│      - Servers run as child processes               │
│      - Tools become available as mcp__*__*          │
└─────────────────────────────────────────────────────┘
```

## Examples

### Example 1: Working in agent-os-2
```bash
cd /home/ohn_orquay/.claude/plugins/agent-os-2
# Start Claude Code
```
**Result**: All 5 MCP servers available ✓

### Example 2: Working in a completely different project
```bash
cd /home/ohn_orquay/Documents/my-website
# Start Claude Code
```
**Result**: Same 5 MCP servers available ✓ (from global config)

### Example 3: Working in a temporary directory
```bash
cd /tmp
# Start Claude Code
```
**Result**: Same 5 MCP servers available ✓ (from global config)

## Why You Might Have Been Confused

You have **two** MCP config files:

1. **Global**: `~/.claude/mcp.json` → Works everywhere ✓
2. **Project**: `~/.claude/plugins/agent-os-2/.mcp.json` → Only works in agent-os-2

Both files are **identical**, so you get the same servers either way!

The project-specific one is **redundant** but harmless.

## What "agent-os-2 from any project file" Means

I think you're asking: "Can I use the MCP servers (whose files live in agent-os-2) from any project?"

**Answer: YES!**

The server **files** live here:
```
/home/ohn_orquay/.claude/plugins/agent-os-2/mcp-servers/
├── chat-claude/chat-claude-server.js
├── vercel-mcp-wrapper.js
└── flyio-mcp-wrapper.js
```

But the global **config** points to them with absolute paths, so it doesn't matter what directory you're in - Claude Code can always find them!

## Current Configuration Files

You have 2 MCP configuration files:

| File | Scope | Servers |
|------|-------|---------|
| `/home/ohn_orquay/.claude/mcp.json` | **ALL projects** ✓ | 5 servers |
| `/home/ohn_orquay/.claude/plugins/agent-os-2/.mcp.json` | **Only agent-os-2** | 5 servers (same) |

**Recommendation**: You can safely delete the project-specific one since they're identical:
```bash
rm /home/ohn_orquay/.claude/plugins/agent-os-2/.mcp.json
```

This will simplify your setup - you'll only have one config to maintain.

## Testing

To prove this works from any project:

1. **Open a new terminal** in a different directory
2. **Start Claude Code** there
3. **Ask**: "Test the chat-claude MCP server connection"
4. **Result**: Should work! The MCP servers will load from global config

Or check running processes after starting Claude Code anywhere:
```bash
ps aux | grep chat-claude-server
# Should see the server running
```

## Verification Commands

### Check global config
```bash
cat ~/.claude/mcp.json
```

### Check project config (if exists)
```bash
cat .mcp.json
```

### See which MCP configs exist on your system
```bash
find ~ -name ".mcp.json" -o -name "mcp.json" 2>/dev/null | grep -v node_modules
```

**Your result**:
```
/home/ohn_orquay/.claude/mcp.json           ← Global (ALL projects)
/home/ohn_orquay/.claude/plugins/agent-os-2/.mcp.json  ← Project-specific
```

## Summary

✅ **Yes, your MCP servers are available from any project directory**

✅ **This is because they're configured in the global `~/.claude/mcp.json`**

✅ **The server files in agent-os-2 are referenced with absolute paths**

✅ **The project-specific `.mcp.json` is redundant (but harmless)**

✅ **You can test this by opening Claude Code in any other project**

You already have exactly what you wanted - MCP servers available everywhere!
