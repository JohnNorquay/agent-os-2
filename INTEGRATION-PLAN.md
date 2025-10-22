# Agent-OS-2 MCP Server Integration Plan

## Overview

This document outlines the step-by-step plan to integrate popular MCP servers into your agent-os-2 system.

## Current State

### Existing MCP Servers (5 total)
- ✅ chat-claude (custom)
- ✅ vercel (custom)
- ✅ flyio (custom)
- ✅ supabase-PickSix (official)
- ✅ supabase-IntegrationDirector (official)

### Proposed New Servers (5 total)
- 🆕 filesystem (official Anthropic)
- 🆕 github (official GitHub)
- 🆕 playwright (official Microsoft)
- 🆕 slack (official Anthropic) - optional
- 🆕 git (official Anthropic) - optional

## Integration Phases

### Phase 1: Essential Servers (Recommended Now)
**Timeline**: Immediate
**Servers**: Filesystem, GitHub, Playwright
**Prerequisites**: GitHub Personal Access Token

### Phase 2: Collaboration (Add Later)
**Timeline**: As needed
**Servers**: Slack, Git
**Prerequisites**: Slack Bot Token (for Slack)

### Phase 3: Specialized (Project-specific)
**Timeline**: When required
**Servers**: Postgres, others
**Prerequisites**: Database connection string

---

## Detailed Integration Steps

### Step 1: Preparation

#### 1.1 Backup Current Configuration
```bash
cp ~/.claude/mcp.json ~/.claude/mcp.json.backup
cp ~/.claude/plugins/agent-os-2/.mcp.json ~/.claude/plugins/agent-os-2/.mcp.json.backup
```

#### 1.2 Verify Current Setup Works
```bash
cd ~/.claude/plugins/agent-os-2
./verify-mcp-simple.sh
```

Expected: Shows current 5 servers configured

#### 1.3 Document Current Tools
Before adding new servers, list current available MCP tools to compare after integration.

---

### Step 2: Obtain Required Credentials

#### 2.1 GitHub Personal Access Token
**Steps**:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a descriptive name: "Claude Code MCP Server"
4. Select scopes:
   - ✅ `repo` (for private repos)
   - ✅ `read:org` (if needed for organization repos)
   - ✅ `workflow` (for GitHub Actions)
5. Click "Generate token"
6. **Copy token immediately** (shown only once)

**Example token format**: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### 2.2 Slack Bot Token (Optional - Phase 2)
**Steps**:
1. Go to https://api.slack.com/apps
2. Create new app or use existing
3. Go to "OAuth & Permissions"
4. Add Bot Token Scopes:
   - ✅ `channels:read`
   - ✅ `channels:history`
   - ✅ `chat:write`
   - ✅ `users:read`
5. Install app to workspace
6. Copy "Bot User OAuth Token"

**Example token format**: `xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx`

#### 2.3 Get Slack Team ID (Optional - Phase 2)
**Method 1**: From URL when logged into Slack
- Format: `https://<workspace>.slack.com` → Team ID is in settings

**Method 2**: From API
```bash
curl https://slack.com/api/auth.test \
  -H "Authorization: Bearer xoxb-your-token"
```

**Example format**: `T01234567`

---

### Step 3: Update Global MCP Configuration

#### 3.1 Option A: Add Phase 1 Servers Only (Recommended)

Create updated config with essential servers:

```json
{
  "mcpServers": {
    // === EXISTING SERVERS ===
    "chat-claude": {
      "command": "node",
      "args": ["/home/ohn_orquay/.claude/plugins/agent-os-2/mcp-servers/chat-claude/chat-claude-server.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-oat01-..."
      }
    },
    "vercel": {
      "command": "node",
      "args": ["/home/ohn_orquay/.claude/plugins/agent-os-2/mcp-servers/vercel-mcp-wrapper.js"],
      "env": {
        "VERCEL_TOKEN": "14zoFbLVAjOPMrq8xPGqwXP4"
      }
    },
    "flyio": {
      "command": "node",
      "args": ["/home/ohn_orquay/.claude/plugins/agent-os-2/mcp-servers/flyio-mcp-wrapper.js"],
      "env": {
        "FLY_API_TOKEN": "FlyV1 fm2_..."
      }
    },
    "supabase-PickSix": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "https://aidaxmvsmfjdnimuxrex.supabase.co",
        "SUPABASE_SERVICE_KEY": "eyJhbGciOiJI..."
      }
    },
    "supabase-IntegrationDirector": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "https://evllxrejudhifvsllqho.supabase.co",
        "SUPABASE_SERVICE_KEY": "eyJhbGciOiJI..."
      }
    },

    // === NEW PHASE 1 SERVERS ===
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/ohn_orquay",
        "/tmp"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_GITHUB_TOKEN_HERE>"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

#### 3.2 Option B: Add All Servers (Phase 1 + 2)

Add Slack and Git as well (requires Slack credentials):

```json
{
  "mcpServers": {
    // ... (existing servers from Option A) ...

    // === PHASE 2 SERVERS ===
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "<YOUR_SLACK_BOT_TOKEN>",
        "SLACK_TEAM_ID": "<YOUR_TEAM_ID>"
      }
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    }
  }
}
```

---

### Step 4: Testing Plan

#### 4.1 Test Filesystem Server
```
Test: "List files in my home directory"
Expected: Should show files from /home/ohn_orquay
Tool used: mcp__filesystem__list_directory
```

```
Test: "Read the contents of ~/.bashrc"
Expected: Should display bashrc file contents
Tool used: mcp__filesystem__read_file
```

**Security Test**:
```
Test: "Try to read /etc/passwd"
Expected: Should be DENIED (not in allowed paths)
```

#### 4.2 Test GitHub Server
```
Test: "List my GitHub repositories"
Expected: Shows your repos
Tool used: mcp__github__list_repos
```

```
Test: "Show open issues in repository X"
Expected: Lists issues
Tool used: mcp__github__list_issues
```

```
Test: "Search for 'TODO' in my code"
Expected: Finds TODO comments across repos
Tool used: mcp__github__search_code
```

#### 4.3 Test Playwright Server
```
Test: "Navigate to https://example.com and take a screenshot"
Expected: Returns screenshot
Tool used: mcp__playwright__navigate, mcp__playwright__screenshot
```

```
Test: "What's the title of https://github.com?"
Expected: Returns page title
Tool used: mcp__playwright__navigate, mcp__playwright__evaluate
```

#### 4.4 Test Slack Server (if added)
```
Test: "Send a test message to #general"
Expected: Message appears in Slack
Tool used: mcp__slack__post_message
```

```
Test: "List all channels"
Expected: Shows channel list
Tool used: mcp__slack__list_channels
```

#### 4.5 Test Git Server (if added)
```
Test: "Show git log for this repository"
Expected: Shows commit history
Tool used: mcp__git__log
```

---

### Step 5: Verification

#### 5.1 Update Verification Scripts

Update `verify-mcp-simple.sh` to check for new servers:

```bash
# Add to process checks section
check_process "filesystem" "@modelcontextprotocol/server-filesystem"
check_process "github" "@modelcontextprotocol/server-github"
check_process "playwright" "@playwright/mcp"
```

#### 5.2 Create New Verification Test

Create `test-new-mcp-servers.sh`:

```bash
#!/bin/bash

echo "Testing newly integrated MCP servers..."
echo ""

# Test filesystem
echo "1. Testing filesystem server..."
if ps aux | grep "@modelcontextprotocol/server-filesystem" | grep -v grep > /dev/null; then
  echo "✓ Filesystem server running"
else
  echo "✗ Filesystem server NOT running"
fi

# Test github
echo "2. Testing GitHub server..."
if ps aux | grep "@modelcontextprotocol/server-github" | grep -v grep > /dev/null; then
  echo "✓ GitHub server running"
else
  echo "✗ GitHub server NOT running"
fi

# Test playwright
echo "3. Testing Playwright server..."
if ps aux | grep "@playwright/mcp" | grep -v grep > /dev/null; then
  echo "✓ Playwright server running"
else
  echo "✗ Playwright server NOT running"
fi

echo ""
echo "Total running MCP servers:"
ps aux | grep -E 'mcp-server|@modelcontextprotocol|@playwright|chat-claude|vercel-mcp|flyio-mcp' | grep -v grep | wc -l
```

#### 5.3 Run Full Verification

```bash
cd ~/.claude/plugins/agent-os-2
./verify-mcp-simple.sh
./test-new-mcp-servers.sh
```

---

### Step 6: Documentation Updates

#### 6.1 Update MCP-SERVER-STATUS.md
Add new servers to the status document.

#### 6.2 Update HOW-TO-VERIFY-MCP-SERVERS.md
Add verification steps for new servers.

#### 6.3 Create Tool Reference Guide
Document all available tools from all servers.

---

## Rollback Plan

If something goes wrong:

### Quick Rollback
```bash
# Restore backup
cp ~/.claude/mcp.json.backup ~/.claude/mcp.json

# Restart Claude Code
# MCP servers will reload with old config
```

### Selective Rollback
Remove specific servers from `mcp.json` if they cause issues.

---

## Expected Outcomes

### Before Integration
- 5 MCP servers
- Tools: chat-claude, vercel, flyio, supabase operations
- ~20-30 MCP tools available

### After Phase 1 Integration
- 8 MCP servers (+3)
- New capabilities:
  - File operations (filesystem)
  - GitHub repository management
  - Browser automation (playwright)
- ~50-70 MCP tools available

### After Phase 2 Integration
- 10 MCP servers (+5 total)
- Additional capabilities:
  - Team communication (slack)
  - Local git operations
- ~80-100 MCP tools available

---

## Timeline

### Immediate (Today)
1. ✅ Research completed
2. ⏳ Obtain GitHub token
3. ⏳ Update global mcp.json (Phase 1)
4. ⏳ Test Phase 1 servers
5. ⏳ Verify all servers work

### Short-term (This Week)
6. Add Slack server (if needed)
7. Add Git server
8. Update documentation
9. Create tool reference guide

### Long-term (As Needed)
10. Add specialized servers (Postgres, etc.)
11. Create custom MCP servers for specific needs
12. Optimize server performance

---

## Risk Assessment

### Low Risk
- ✅ Using official/well-maintained servers
- ✅ Servers from Anthropic, GitHub, Microsoft
- ✅ Global config doesn't affect existing projects
- ✅ Easy rollback with backup

### Medium Risk
- ⚠ First npx run downloads packages (takes time)
- ⚠ More servers = more startup time
- ⚠ Need to secure tokens properly

### Mitigation
- Test one server at a time
- Keep backup of working config
- Use environment variables for tokens
- Monitor resource usage

---

## Success Criteria

Integration is successful when:

1. ✅ All new servers show in process list
2. ✅ New MCP tools are available in Claude Code
3. ✅ All test cases pass
4. ✅ No errors in server logs
5. ✅ Existing servers still work
6. ✅ Performance is acceptable

---

## Next Steps

**Ready to integrate?** I can:

1. **Update your global mcp.json** with Phase 1 servers
2. **Test each server** individually
3. **Verify everything works** together
4. **Create tool reference guide** for all available tools

Just provide:
- GitHub Personal Access Token
- (Optional) Slack Bot Token if adding Slack

Let's make agent-os-2 even more powerful! 🚀
