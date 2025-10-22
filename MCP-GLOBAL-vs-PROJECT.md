# MCP Server Configuration: Global vs Project-Specific

## Your Current Setup

You have MCP servers configured in **TWO locations**:

### 1. Global Configuration ✓
**Location**: `/home/ohn_orquay/.claude/mcp.json`

**Scope**: Available from **ALL projects** in Claude Code

**Servers configured**:
- chat-claude
- vercel
- flyio
- supabase-PickSix
- supabase-IntegrationDirector

### 2. Project-Specific Configuration ✓
**Location**: `/home/ohn_orquay/.claude/plugins/agent-os-2/.mcp.json`

**Scope**: Only available when working in `agent-os-2` directory

**Servers configured**: (Same as global)
- chat-claude
- vercel
- flyio
- supabase-PickSix
- supabase-IntegrationDirector

## How Claude Code Loads MCP Servers

When Claude Code starts in a project directory, it:

1. **Reads global config** at `~/.claude/mcp.json` (if exists)
2. **Reads project config** at `$PROJECT_ROOT/.mcp.json` (if exists)
3. **Merges both configurations** (project config can override global)
4. **Starts all servers** from the merged configuration

### Example Scenarios

#### Scenario A: Working in agent-os-2 directory
```bash
cd /home/ohn_orquay/.claude/plugins/agent-os-2
# Claude Code starts here
```

**What happens**:
- Loads `~/.claude/mcp.json` (5 servers)
- Loads `./mcp.json` (same 5 servers)
- Merges them (no conflicts, identical)
- **Result**: 5 MCP servers available

#### Scenario B: Working in a different project
```bash
cd /home/ohn_orquay/my-other-project
# Claude Code starts here (no .mcp.json in this directory)
```

**What happens**:
- Loads `~/.claude/mcp.json` (5 servers)
- No local `.mcp.json` found
- **Result**: Same 5 MCP servers available from global config!

#### Scenario C: Working in a project with its own .mcp.json
```bash
cd /home/ohn_orquay/special-project
# This project has its own .mcp.json with different servers
```

**What happens**:
- Loads `~/.claude/mcp.json` (5 servers)
- Loads `./mcp.json` (e.g., 2 different servers)
- Merges them
- **Result**: 7 servers total (5 global + 2 project-specific)

## Your Question: "I would like this functionality whenever I access agent-os-2 from any project file"

### Short Answer
**You already have this!** Your MCP servers are in `~/.claude/mcp.json`, which means they're available from **any project directory**, not just agent-os-2.

### The Confusion
You might be thinking "agent-os-2" is special because that's where the server files live:
- `/home/ohn_orquay/.claude/plugins/agent-os-2/mcp-servers/chat-claude/chat-claude-server.js`
- `/home/ohn_orquay/.claude/plugins/agent-os-2/mcp-servers/vercel-mcp-wrapper.js`
- `/home/ohn_orquay/.claude/plugins/agent-os-2/mcp-servers/flyio-mcp-wrapper.js`

But notice in your global config, the paths are **absolute**:
```json
{
  "chat-claude": {
    "command": "node",
    "args": [
      "/home/ohn_orquay/.claude/plugins/agent-os-2/mcp-servers/chat-claude/chat-claude-server.js"
    ]
  }
}
```

Because the paths are absolute, it doesn't matter which directory you're in - Claude Code will always find the server files!

## Testing Your Setup

### Test 1: Check global config
```bash
cat ~/.claude/mcp.json
```
Expected: Should show your 5 MCP servers ✓

### Test 2: Open Claude Code in a different project
```bash
cd ~/some-other-project
# Start Claude Code here
# Try: "Test the chat-claude MCP server connection"
```
Expected: MCP servers should be available ✓

### Test 3: Verify from any directory
Since we're currently in a Claude Code session, the MCP servers should already be loaded. The `mcp__chat-claude__*` tools you see are proof that global MCP servers are working!

## Current Differences Between Your Configs

The only difference between your global and project configs:

**Project config** has redundant `"type": "stdio"` fields:
```json
{
  "supabase-PickSix": {
    "type": "stdio",  // ← This line is extra
    "command": "npx",
    ...
  }
}
```

**Global config** doesn't have these (stdio is the default anyway).

Both work identically!

## Recommendations

### Option 1: Keep both (current setup) ✓
**Pros**:
- Redundancy - if one file is deleted, the other works
- Project-specific documentation (developers can see what MCP servers are available)

**Cons**:
- Need to update both files if you change server configuration
- Slight confusion about which one is being used

### Option 2: Use only global config (recommended)
**Pros**:
- Single source of truth
- Changes apply to all projects automatically
- No redundancy

**Cons**:
- If global config is deleted/corrupted, servers are gone from all projects

**How to do this**:
```bash
# Remove project-specific config
rm /home/ohn_orquay/.claude/plugins/agent-os-2/.mcp.json

# Keep only global config
# ~/.claude/mcp.json (already exists)
```

### Option 3: Use only project-specific configs
**Pros**:
- Servers only available where needed
- Different projects can have different servers

**Cons**:
- Must configure in every project
- You said you want servers available from "any project" - this defeats that purpose

**How to do this**:
```bash
# Remove global config
rm ~/.claude/mcp.json

# Keep project configs in each project that needs them
```

## Summary for Your Use Case

Since you want MCP servers available from **any project directory**:

✅ **You already have this!**
- Your global config at `~/.claude/mcp.json` makes all 5 MCP servers available everywhere

✅ **The server files in agent-os-2 are fine where they are**
- Global config uses absolute paths to find them
- Doesn't matter which project directory you're in

✅ **Current running servers prove this works**
- We can see `chat-claude` server running (PID 6790)
- It's loaded from global config
- Available in the current session even though we're in agent-os-2

## What You Can Do Next

1. **Test in another project**:
   - Open Claude Code in a different directory
   - Try calling an MCP tool
   - Should work the same!

2. **Simplify (optional)**:
   - Remove the project-specific `.mcp.json` from agent-os-2
   - Keep only the global config
   - Reduces duplication

3. **Verify other projects**:
   - Check if you have other `.mcp.json` files elsewhere:
     ```bash
     find ~ -name ".mcp.json" -type f 2>/dev/null
     ```

## The Bottom Line

**Your MCP servers are already global!** They work from any project directory because they're configured in `~/.claude/mcp.json` with absolute paths to the server files.

The project-specific `.mcp.json` in agent-os-2 is redundant but harmless. You can keep it for documentation purposes or remove it to avoid duplication.
