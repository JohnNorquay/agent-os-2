# Credentials Needed for Phase 1 + Slack Integration

## Status: ⏳ Waiting for Credentials

To complete the integration of Phase 1 + Slack MCP servers, please provide the following credentials.

---

## 1. GitHub Personal Access Token

### What It's For
GitHub MCP Server - enables repository management, issue tracking, PR creation, code search

### How to Get It

1. **Go to**: https://github.com/settings/tokens
2. **Click**: "Generate new token (classic)"
3. **Name**: "Claude Code MCP Server"
4. **Expiration**: Choose based on your preference (30 days, 90 days, or No expiration)
5. **Select Scopes**:
   ```
   ✅ repo (Full control of private repositories)
      ✅ repo:status
      ✅ repo_deployment
      ✅ public_repo
      ✅ repo:invite
      ✅ security_events

   ✅ read:org (Read org and team membership, read org projects)

   ✅ workflow (Update GitHub Action workflows)
   ```
6. **Click**: "Generate token"
7. **IMPORTANT**: Copy the token immediately (shown only once!)

### Token Format
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Where to Paste It
```
Replace: <REPLACE_WITH_YOUR_GITHUB_TOKEN>
In file: mcp-config-phase1-slack.json
```

---

## 2. Slack Bot Token

### What It's For
Slack MCP Server - enables sending messages, reading channels, team communication

### How to Get It

#### Step 1: Create/Configure Slack App
1. **Go to**: https://api.slack.com/apps
2. **Click**: "Create New App" (or select existing app)
3. **Choose**: "From scratch"
4. **Name**: "Claude Code MCP Bot"
5. **Select Workspace**: Choose your workspace

#### Step 2: Add Bot Token Scopes
1. **Navigate to**: "OAuth & Permissions" (left sidebar)
2. **Scroll to**: "Scopes" → "Bot Token Scopes"
3. **Click**: "Add an OAuth Scope"
4. **Add these scopes**:
   ```
   ✅ channels:read      (View basic information about public channels)
   ✅ channels:history   (View messages and content in public channels)
   ✅ chat:write         (Send messages as @claude-code-mcp-bot)
   ✅ chat:write.public  (Send messages to channels without joining)
   ✅ users:read         (View people in workspace)
   ✅ groups:read        (View basic info about private channels - optional)
   ✅ groups:history     (View messages in private channels - optional)
   ✅ im:history         (View messages in DMs - optional)
   ✅ mpim:history       (View messages in group DMs - optional)
   ```

#### Step 3: Install App to Workspace
1. **Scroll to top**: "OAuth Tokens for Your Workspace"
2. **Click**: "Install to Workspace"
3. **Click**: "Allow" to authorize

#### Step 4: Copy Bot Token
1. **Copy**: "Bot User OAuth Token"
2. It starts with `xoxb-`

### Token Format
```
xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx
```

### Where to Paste It
```
Replace: <REPLACE_WITH_YOUR_SLACK_BOT_TOKEN>
In file: mcp-config-phase1-slack.json
```

---

## 3. Slack Team ID

### What It's For
Identifies your Slack workspace for the MCP server

### How to Get It

#### Method 1: From Workspace Settings
1. **Click**: Workspace name (top left in Slack)
2. **Go to**: "Settings & administration" → "Workspace settings"
3. **Look at URL**: `https://app.slack.com/client/T01234567/...`
4. **Team ID**: The part starting with `T` (e.g., `T01234567`)

#### Method 2: From API (Using Bot Token)
If you have the bot token already, run this:
```bash
curl -s https://slack.com/api/auth.test \
  -H "Authorization: Bearer xoxb-your-bot-token" \
  | grep -o '"team_id":"[^"]*"' \
  | cut -d'"' -f4
```

#### Method 3: From Any Slack URL
Look at any Slack URL in your browser:
```
https://app.slack.com/client/T01234567/...
                            ↑↑↑↑↑↑↑↑↑
                            This is your Team ID
```

### Team ID Format
```
T01234567
```

### Where to Paste It
```
Replace: <REPLACE_WITH_YOUR_SLACK_TEAM_ID>
In file: mcp-config-phase1-slack.json
```

---

## 4. (Optional) Slack Channel IDs

### What It's For
Restricts MCP server access to specific channels (security feature)

If not provided, the server can access all public channels the bot is in.

### How to Get Channel ID

1. **Open Slack** → Open the channel
2. **Click**: Channel name at top
3. **Scroll down**: To "About" section
4. **Copy**: Channel ID (format: `C01234567`)

### For Multiple Channels
Comma-separate them:
```
C01234567,C76543210,C89012345
```

### Where to Add It (Optional)
```json
"slack": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-slack"],
  "env": {
    "SLACK_BOT_TOKEN": "xoxb-...",
    "SLACK_TEAM_ID": "T...",
    "SLACK_CHANNEL_IDS": "C01234567,C76543210"  ← Add this line
  }
}
```

---

## Security Notes

### ⚠️ Keep These Credentials Secret!

1. **Never commit to Git**
   - These tokens are in `mcp.json` which should be in `.gitignore`
   - If accidentally committed, revoke and regenerate immediately

2. **Token Permissions**
   - GitHub: Only grant scopes you actually need
   - Slack: Bot tokens are safer than user tokens

3. **Rotation**
   - Consider rotating tokens periodically
   - GitHub tokens can be set to expire automatically

4. **Monitoring**
   - GitHub: Check https://github.com/settings/tokens for active tokens
   - Slack: Monitor app usage in workspace settings

---

## What Happens Next

Once you provide these credentials:

1. ✅ I'll update `~/.claude/mcp.json` with the new configuration
2. ✅ I'll test each new server individually
3. ✅ I'll verify all 9 servers work together
4. ✅ I'll create a comprehensive tool reference guide
5. ✅ I'll update verification scripts

---

## Checklist

- [ ] GitHub Personal Access Token (ghp_...)
- [ ] Slack Bot Token (xoxb-...)
- [ ] Slack Team ID (T...)
- [ ] (Optional) Slack Channel IDs (C...,C...)

---

## Ready to Provide Credentials?

You can:
1. **Paste them directly** in this chat
2. **Tell me** you've obtained them and want to update the config
3. **Ask questions** if you need help with any step

**Note**: This chat is between you and Claude Code. Your credentials are used only to update your local configuration file.

---

## Troubleshooting

### GitHub Token Issues
- **Error**: "Bad credentials" → Token is invalid or expired
- **Solution**: Generate a new token with correct scopes

### Slack Token Issues
- **Error**: "Invalid auth" → Bot not installed or token wrong
- **Solution**: Reinstall app to workspace, copy new token

### Slack Team ID Issues
- **Error**: "Team not found" → Team ID is incorrect
- **Solution**: Verify Team ID from workspace URL

### Need Help?
Just ask! I can guide you through any step that's unclear.
