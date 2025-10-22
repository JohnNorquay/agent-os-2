# How to Verify MCP Servers Start Correctly

This guide explains how to verify that your MCP servers spin up and are ready when Claude Code starts in this project.

## Quick Verification

### Method 1: Run the verification script

```bash
./verify-mcp-simple.sh
```

This will show:
- Which MCP server processes are currently running
- What servers are configured in `.mcp.json`
- Whether required dependencies are installed
- The status of each server file

### Method 2: Run the startup test

```bash
./test-mcp-on-startup.sh
```

This simulates what happens when Claude Code starts and shows:
- All configured servers
- Whether each server can start
- What tools will be available
- Any missing dependencies

### Method 3: Manual check

```bash
# Check running MCP processes
ps aux | grep -E 'mcp-server|vercel-mcp|flyio-mcp|chat-claude-server' | grep -v grep

# Should show something like:
# node /path/to/chat-claude-server.js
```

## What to Expect When Claude Code Starts

When you start Claude Code in this project directory (`/home/ohn_orquay/.claude/plugins/agent-os-2`):

1. **Claude Code detects `.mcp.json`** in the project root
2. **Spawns child processes** for each configured server
3. **Each server starts** and prints to stderr (not visible to user):
   - `"Chat Claude MCP server running on stdio"`
   - `"Vercel MCP server running on stdio"`
   - `"Fly.io MCP server running on stdio"`
   - Supabase servers (via npx)
4. **Tools become available** prefixed with `mcp__`

## Configured MCP Servers

Your `.mcp.json` has **5 MCP servers** configured:

| Server | Status | Command | Environment |
|--------|--------|---------|-------------|
| chat-claude | ✓ Ready | node mcp-servers/chat-claude/... | ANTHROPIC_API_KEY |
| vercel | ✓ Ready | node mcp-servers/vercel-mcp-wrapper.js | VERCEL_TOKEN |
| flyio | ✓ Ready | node mcp-servers/flyio-mcp-wrapper.js | FLY_API_TOKEN |
| supabase-PickSix | ✓ Ready | npx @supabase/mcp-server-supabase | SUPABASE_URL, KEY |
| supabase-IntegrationDirector | ✓ Ready | npx @supabase/mcp-server-supabase | SUPABASE_URL, KEY |

## How to Test Individual Servers

### Test chat-claude server

In Claude Code, try:
```
Can you test the chat-claude MCP server connection?
```

Or directly call:
```javascript
mcp__chat-claude__test_connection()
```

**Expected tools**:
- `mcp__chat-claude__delegate_task`
- `mcp__chat-claude__get_task_result`
- `mcp__chat-claude__list_tasks`
- `mcp__chat-claude__cancel_task`
- `mcp__chat-claude__test_connection`

### Test Vercel server

In Claude Code, try:
```
List my Vercel projects
```

**Expected tools**:
- `mcp__vercel__list_deployments`
- `mcp__vercel__list_projects`
- `mcp__vercel__deploy`
- `mcp__vercel__logs`
- `mcp__vercel__env`
- `mcp__vercel__domains`
- `mcp__vercel__inspect`

**Note**: Requires Vercel CLI installed (`npm i -g vercel`)

### Test Fly.io server

In Claude Code, try:
```
List my Fly.io apps
```

**Expected tools**:
- `mcp__fly__list_apps`
- `mcp__fly__app_status`
- `mcp__fly__deploy`
- `mcp__fly__logs`
- `mcp__fly__scale`
- `mcp__fly__regions`
- `mcp__fly__secrets`
- `mcp__fly__postgres_list`
- `mcp__fly__machine_list`
- And more...

**Note**: Requires Fly.io CLI installed (`curl -L https://fly.io/install.sh | sh`)

### Test Supabase servers

In Claude Code, try:
```
Query the Supabase database for PickSix project
```

The Supabase MCP server will be downloaded via npx on first use.

## Troubleshooting

### Problem: No MCP processes showing

**This is normal!** MCP servers are child processes started by Claude Code. When Claude Code isn't running, the servers won't be running either.

**To verify**: Start Claude Code in this directory, then run:
```bash
ps aux | grep mcp
```

### Problem: Server starts but tools don't work

**Possible causes**:
1. **Missing CLI tools** (Vercel CLI, Fly.io CLI)
   - Install with: `npm i -g vercel` or `curl -L https://fly.io/install.sh | sh`

2. **Invalid API credentials**
   - Check environment variables in `.mcp.json`
   - Verify API keys are valid and not expired

3. **Server dependencies not installed**
   - For chat-claude: `cd mcp-servers/chat-claude && npm install`

### Problem: Authentication errors

**Symptom**: Tools return 401 or authentication errors

**Solution**: Update the API keys in `.mcp.json`:
- `chat-claude`: Update `ANTHROPIC_API_KEY`
- `vercel`: Update `VERCEL_TOKEN`
- `flyio`: Update `FLY_API_TOKEN`
- `supabase-*`: Update `SUPABASE_SERVICE_KEY`

## Verification Checklist

Use this checklist to verify everything is working:

- [ ] `.mcp.json` file exists in project root
- [ ] All server files exist:
  - [ ] `mcp-servers/chat-claude/chat-claude-server.js`
  - [ ] `mcp-servers/vercel-mcp-wrapper.js`
  - [ ] `mcp-servers/flyio-mcp-wrapper.js`
- [ ] Dependencies installed:
  - [ ] Node.js (v20.19.5 ✓)
  - [ ] npx ✓
  - [ ] Vercel CLI (optional, for Vercel features)
  - [ ] Fly.io CLI (optional, for Fly.io features)
- [ ] chat-claude dependencies: `mcp-servers/chat-claude/node_modules` exists
- [ ] When Claude Code starts, at least 1 MCP process is running
- [ ] MCP tools are available (test with `mcp__chat-claude__test_connection`)

## Current Status

As of the last verification:

✓ **Configuration**: Valid `.mcp.json` with 5 servers
✓ **Server Files**: All present and ready
✓ **Dependencies**: Node.js and npx available
✓ **Running**: 1 MCP server currently active (chat-claude)
⚠ **Action Items**:
  - Install Vercel CLI for full Vercel functionality
  - Install Fly.io CLI for full Fly.io functionality
  - Verify ANTHROPIC_API_KEY is valid

## Understanding MCP Server Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                  Claude Code Starts                     │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Reads .mcp.json from project               │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────┐              ┌──────────────────┐
│ Spawn Server │              │ For each server: │
│  Process 1   │              │  - Start process │
│ (chat-claude)│              │  - stdio connect │
└──────┬───────┘              │  - Initialize    │
       │                      └────────┬─────────┘
       │                               │
       ▼                               ▼
┌─────────────────────────────────────────────────────────┐
│         Server sends tool list via MCP protocol         │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│    Tools available as mcp__servername__toolname         │
└─────────────────────────────────────────────────────────┘
```

## Files Created for Verification

This project includes several verification scripts:

1. **`verify-mcp-simple.sh`** - Quick status check of all MCP servers
2. **`test-mcp-on-startup.sh`** - Detailed simulation of startup process
3. **`MCP-SERVER-STATUS.md`** - Full status report
4. **`HOW-TO-VERIFY-MCP-SERVERS.md`** - This guide

Run any of these to verify your MCP server setup!

## Next Steps

1. Run `./verify-mcp-simple.sh` to see current status
2. Install missing CLI tools if you need those features
3. Start Claude Code in this directory
4. Try calling an MCP tool to confirm servers are working
5. Check process list to see servers running

Your MCP servers are configured correctly and will automatically start when Claude Code launches in this directory!
