# Setup Guide: Phase 1 + Slack MCP Server Integration

## Quick Summary

We're adding **4 new MCP servers** to your agent-os-2 system:
- ✨ **Filesystem** - File operations (no credentials needed)
- ✨ **GitHub** - Repository management (needs GitHub token)
- ✨ **Playwright** - Browser automation (no credentials needed)
- ✨ **Slack** - Team communication (needs Slack bot token + team ID)

---

## Current Progress

### ✅ Completed
1. Research and evaluation of MCP servers
2. Integration plan created
3. Configuration backup created:
   - `~/.claude/mcp.json.backup-20251022-072439`
   - `~/.claude/plugins/agent-os-2/.mcp.json.backup-20251022-072441`
4. New configuration template prepared:
   - `mcp-config-phase1-slack.json`

### ⏳ Waiting For
**Your credentials** to complete the setup:
- GitHub Personal Access Token
- Slack Bot Token
- Slack Team ID

### 📋 Next Steps (After Credentials)
1. Update global `~/.claude/mcp.json` with new config
2. Test each new server
3. Verify all 9 servers work together
4. Update documentation

---

## What You'll Have After Integration

### Before (Current)
```
5 MCP Servers:
├── chat-claude          (custom)
├── vercel              (custom)
├── flyio               (custom)
├── supabase-PickSix    (official)
└── supabase-IntegrationDirector (official)

~20-30 MCP tools
```

### After (Phase 1 + Slack)
```
9 MCP Servers:
├── chat-claude          (custom)
├── vercel              (custom)
├── flyio               (custom)
├── supabase-PickSix    (official)
├── supabase-IntegrationDirector (official)
├── filesystem          (official Anthropic) ✨ NEW
├── github              (official GitHub)    ✨ NEW
├── playwright          (official Microsoft) ✨ NEW
└── slack               (official Anthropic) ✨ NEW

~60-80 MCP tools
```

---

## New Capabilities

### Filesystem Server
**What You Can Do**:
```
✅ Read files from any directory
✅ Write/create new files
✅ Search directories
✅ List files with filters
✅ Move/delete files
✅ Get file info (size, modified date, etc.)
```

**Example Commands**:
- "Read all package.json files in this project"
- "Create a new README.md file"
- "Search for all .env files"
- "List all JavaScript files modified today"

**Security**: Restricted to `/home/ohn_orquay` and `/tmp` only

---

### GitHub Server
**What You Can Do**:
```
✅ List repositories
✅ Search code across repos
✅ Create/update/close issues
✅ Manage pull requests
✅ View file contents
✅ Get repository information
✅ Search repositories
✅ Fork repositories
```

**Example Commands**:
- "Show all my open PRs"
- "Create an issue in repo X for bug Y"
- "Search for 'TODO' in all my repositories"
- "List issues labeled 'bug' in project Z"
- "Show recent commits in main branch"

---

### Playwright Server
**What You Can Do**:
```
✅ Navigate to web pages
✅ Take screenshots
✅ Click elements
✅ Fill forms
✅ Run JavaScript
✅ Extract data from pages
✅ Test web applications
✅ Automate browser interactions
```

**Example Commands**:
- "Take a screenshot of https://example.com"
- "Test the login form at https://myapp.com"
- "Scrape product prices from this page"
- "Fill out the contact form with test data"
- "Check if the homepage loads correctly"

---

### Slack Server
**What You Can Do**:
```
✅ Send messages to channels
✅ Read channel history
✅ List channels
✅ Get user information
✅ Post threaded messages
✅ React to messages
✅ Send DMs (if bot has permission)
```

**Example Commands**:
- "Send a deployment success message to #engineering"
- "Notify the team in #general about the new release"
- "Get the last 10 messages from #support"
- "List all channels in the workspace"
- "Post standup updates to #daily-standup"

**Perfect for Your Project**: Since you mentioned you're working on a project that will utilize Slack!

---

## Configuration Details

### Filesystem Configuration
```json
"filesystem": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "/home/ohn_orquay",
    "/tmp"
  ]
}
```
**Allowed directories**: `/home/ohn_orquay` and `/tmp`
**Security**: Cannot access system files outside these directories

### GitHub Configuration
```json
"github": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
  }
}
```
**Requires**: GitHub Personal Access Token with `repo`, `read:org`, `workflow` scopes

### Playwright Configuration
```json
"playwright": {
  "command": "npx",
  "args": ["@playwright/mcp@latest"]
}
```
**No credentials needed**: Works out of the box!

### Slack Configuration
```json
"slack": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-slack"],
  "env": {
    "SLACK_BOT_TOKEN": "xoxb_your_token_here",
    "SLACK_TEAM_ID": "T12345678"
  }
}
```
**Requires**: Slack Bot Token and Team ID

---

## Integration Process

### Step 1: Obtain Credentials (You Do This)
See `CREDENTIALS-NEEDED.md` for detailed instructions:

1. **GitHub Token**: https://github.com/settings/tokens
   - Generate new token (classic)
   - Add scopes: `repo`, `read:org`, `workflow`
   - Copy token

2. **Slack Bot Token**: https://api.slack.com/apps
   - Create/configure app
   - Add bot token scopes: `channels:read`, `channels:history`, `chat:write`, `users:read`
   - Install to workspace
   - Copy bot token

3. **Slack Team ID**: From Slack URL or workspace settings
   - Format: `T01234567`

### Step 2: Provide Credentials to Me (You Do This)
Once you have the credentials, just tell me:
```
I have the credentials:
GitHub Token: ghp_...
Slack Bot Token: xoxb_...
Slack Team ID: T...
```

### Step 3: I Update Configuration (I Do This)
I will:
1. Read the template `mcp-config-phase1-slack.json`
2. Replace placeholders with your credentials
3. Write to `~/.claude/mcp.json`
4. Confirm the update

### Step 4: Test Servers (We Do This Together)
I will test each server:
1. **Filesystem**: List home directory, read a file
2. **GitHub**: List your repositories
3. **Playwright**: Take a screenshot of a test page
4. **Slack**: List channels in your workspace

### Step 5: Verification (I Do This)
1. Verify all 9 servers are running
2. Check that new tools are available
3. Update verification scripts
4. Create tool reference guide

---

## Expected Timeline

- **Step 1-2**: ~10-15 minutes (you obtain credentials)
- **Step 3**: ~1 minute (I update config)
- **Step 4**: ~5 minutes (testing)
- **Step 5**: ~5 minutes (verification & docs)

**Total**: ~20-25 minutes to complete integration

---

## Testing Examples After Integration

Once integrated, you can try:

### Test Filesystem
```
"List all markdown files in my home directory"
Expected: Shows *.md files
Tool: mcp__filesystem__list_directory
```

### Test GitHub
```
"Show my GitHub repositories"
Expected: Lists your repos
Tool: mcp__github__list_repositories
```

### Test Playwright
```
"Take a screenshot of https://www.google.com"
Expected: Returns screenshot
Tool: mcp__playwright__navigate, mcp__playwright__screenshot
```

### Test Slack
```
"List all channels in my Slack workspace"
Expected: Shows channel list
Tool: mcp__slack__list_channels
```

### Combined Test
```
"Read the README.md file, create a GitHub issue about it, and notify #engineering on Slack"
Expected: Uses filesystem, github, and slack together!
```

---

## Rollback Plan

If anything goes wrong, we can easily rollback:

```bash
# Restore previous configuration
cp ~/.claude/mcp.json.backup-20251022-072439 ~/.claude/mcp.json

# Restart Claude Code
# Everything will be back to the original 5 servers
```

---

## Security Best Practices

### ✅ Good Practices
- Store tokens in environment variables (we're doing this)
- Use bot tokens for Slack (not user tokens)
- Restrict filesystem to specific directories
- Use minimal GitHub token scopes needed
- Rotate tokens periodically

### ⚠️ Avoid
- Never commit `mcp.json` with tokens to Git
- Don't share tokens in public channels
- Don't use admin-level permissions unless needed
- Don't allow filesystem access to sensitive system directories

---

## After Integration

### Documentation Available
1. `MCP-SERVERS-RECOMMENDATION.md` - Full server analysis
2. `INTEGRATION-PLAN.md` - Detailed integration steps
3. `CREDENTIALS-NEEDED.md` - How to get credentials
4. This guide - Setup process
5. Tool reference guide (will be created after integration)

### Verification Scripts
1. `verify-mcp-simple.sh` - Quick status check
2. `test-mcp-on-startup.sh` - Startup simulation
3. `test-new-mcp-servers.sh` (will be created)

---

## Ready to Proceed?

### Option 1: Have Credentials Now
If you already have the credentials, provide them and I'll complete the integration immediately!

### Option 2: Need to Obtain Credentials
Follow the instructions in `CREDENTIALS-NEEDED.md` to obtain:
- GitHub Personal Access Token
- Slack Bot Token
- Slack Team ID

Then come back and provide them.

### Option 3: Have Questions
Ask me anything! I can clarify any step or help troubleshoot.

---

## Your Project with Slack

You mentioned you're working on a project that will utilize the Slack MCP server. Once integrated, you'll be able to:

- **Automate notifications**: Send deployment/build status to team
- **Create workflows**: Trigger actions based on Slack messages
- **Monitor channels**: Read and respond to specific messages
- **Integration testing**: Test Slack bot functionality
- **Team updates**: Automated standup or progress reports

The Slack MCP server will make your project's communication automation much easier!

---

**Ready when you are!** Just provide the credentials when you have them. 🚀
