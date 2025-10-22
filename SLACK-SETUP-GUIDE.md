# Slack MCP Server Setup Guide - Step by Step

## What You Need

To use the Slack MCP server, you need:
1. **Slack Bot Token** (format: `xoxb-...`)
2. **Slack Team ID** (format: `T...`)

Let me walk you through getting both!

---

## Part 1: Create Your Slack App & Get Bot Token

### Step 1: Go to Slack API Apps Page

1. Open your browser and go to: **https://api.slack.com/apps**
2. Sign in to your Slack workspace if prompted

### Step 2: Create a New App

1. Click the green **"Create New App"** button
2. You'll see two options:
   - **"From scratch"** ← Choose this one
   - "From an app manifest"
3. Click **"From scratch"**

### Step 3: Name Your App

1. **App Name**: Enter something like:
   - `Claude Code MCP Bot`
   - `Agent-OS-2 Bot`
   - Or any name you prefer
2. **Pick a workspace**: Select the Slack workspace where you want to use this bot
3. Click **"Create App"**

You'll be taken to your app's settings page!

### Step 4: Add Bot Token Scopes

Now we need to give your bot permissions:

1. In the left sidebar, click **"OAuth & Permissions"**
2. Scroll down to **"Scopes"** section
3. Under **"Bot Token Scopes"**, click **"Add an OAuth Scope"**
4. Add each of these scopes one by one:

   **Required (add these for sure)**:
   ```
   channels:read        - View basic information about public channels
   channels:history     - View messages in public channels
   chat:write          - Send messages as your bot
   chat:write.public   - Send messages to channels without joining
   users:read          - View people in the workspace
   ```

   **Optional (add if you need private channel/DM access)**:
   ```
   groups:read         - View basic private channel info
   groups:history      - View messages in private channels
   im:history          - View direct messages
   mpim:history        - View group direct messages
   ```

   To add each scope:
   - Click "Add an OAuth Scope"
   - Type the scope name (e.g., `channels:read`)
   - Click on it to add
   - Repeat for each scope

### Step 5: Install the App to Your Workspace

1. Scroll back up to the **"OAuth Tokens for Your Workspace"** section
2. Click the **"Install to Workspace"** button
3. You'll see a permission review page listing all the scopes
4. Click **"Allow"** to authorize the app

### Step 6: Copy Your Bot Token! 🎉

After installation, you'll see:

```
Bot User OAuth Token
xoxb-YOUR-BOT-TOKEN-WILL-APPEAR-HERE
```

1. **Copy this entire token** (it starts with `xoxb-`)
2. **Save it somewhere safe** (you'll need to paste it in a moment)

**This is your SLACK_BOT_TOKEN!** ✅

---

## Part 2: Get Your Slack Team ID

You need to find your workspace's Team ID. Here are 3 easy ways:

### Method 1: From the Slack App Settings Page (Easiest!)

You're already on the Slack API apps page from Part 1, so:

1. In the left sidebar, click **"Basic Information"**
2. Scroll down to **"App Credentials"** section
3. Look for **"Signing Secret"** - just above it you'll see:
   ```
   Team ID: T01234567
   ```
4. **Copy the Team ID** (it starts with `T`)

**This is your SLACK_TEAM_ID!** ✅

### Method 2: From Your Slack Workspace URL

1. Open Slack in your browser
2. Look at the URL in the address bar:
   ```
   https://app.slack.com/client/T01234567/...
                                ↑↑↑↑↑↑↑↑↑
                                Team ID
   ```
3. The part after `/client/` that starts with `T` is your Team ID
4. Copy it!

### Method 3: Using the API (If you're technical)

If you have the bot token from Part 1, you can use this command:

```bash
curl -s https://slack.com/api/auth.test \
  -H "Authorization: Bearer xoxb-your-bot-token-here" \
  | grep team_id
```

This will return something like:
```json
"team_id": "T01234567"
```

---

## Part 3: Test Your Credentials (Optional but Recommended)

Before we add them to the MCP config, let's make sure they work!

You can test with this curl command:

```bash
curl -s https://slack.com/api/conversations.list \
  -H "Authorization: Bearer xoxb-your-bot-token" \
  -d "types=public_channel&limit=5"
```

If it works, you'll see a JSON response with your Slack channels! ✅

If it fails, you'll see an error message explaining what's wrong.

---

## Part 4: Invite the Bot to Channels (Important!)

Your bot needs to be invited to channels to interact with them:

### For Public Channels:
1. Open Slack
2. Go to a channel you want the bot to access
3. Type `/invite @your-bot-name` (replace with your bot's name)
4. Or: Click channel name → "Integrations" → "Add apps" → Select your bot

### For Private Channels:
1. Open the private channel
2. Click channel name → "Settings" → "Integrations"
3. Click "Add apps" → Select your bot

**Note**: The bot can send messages to public channels even without joining (using `chat:write.public` scope), but it needs to be invited to read messages or interact more deeply.

---

## Summary: What You Should Have Now

After following this guide, you should have:

1. ✅ **Slack Bot Token**
   - Format: `xoxb-NUMBERS-NUMBERS-RANDOM-STRING`
   - From: OAuth & Permissions page after installing app

2. ✅ **Slack Team ID**
   - Format: `T01234567`
   - From: Basic Information page or workspace URL

---

## What to Do Next

Once you have both credentials, provide them to me in this format:

```
Slack Bot Token: xoxb-...
Slack Team ID: T...
```

Then I'll:
1. Add the Slack server to your `mcp.json`
2. Test it to make sure it works
3. Show you what you can do with it!

---

## Troubleshooting

### "I can't find the OAuth & Permissions page"
- Go to https://api.slack.com/apps
- Click on your app
- Look in the left sidebar for "OAuth & Permissions"

### "I don't see the Install to Workspace button"
- Make sure you added at least one Bot Token Scope first
- The button only appears after you add scopes

### "The token doesn't work"
- Make sure you copied the **Bot User OAuth Token** (starts with `xoxb-`)
- NOT the "OAuth Access Token" or "Signing Secret"

### "I can't find my Team ID"
- Go to your app's "Basic Information" page
- Or look at any Slack URL: `https://app.slack.com/client/T01234567/...`

### "The bot can't see messages in a channel"
- Make sure the bot is invited to that channel
- Use `/invite @bot-name` in the channel
- Or add it via channel settings → Integrations

---

## Quick Checklist

- [ ] Created Slack app at https://api.slack.com/apps
- [ ] Added bot token scopes (at minimum: channels:read, channels:history, chat:write, users:read)
- [ ] Installed app to workspace
- [ ] Copied Bot User OAuth Token (starts with `xoxb-`)
- [ ] Found Team ID (starts with `T`)
- [ ] (Optional) Tested credentials with curl
- [ ] (Optional) Invited bot to channels you want it to access

---

## Need Help?

If you get stuck on any step, just let me know:
- Which step you're on
- What you see on your screen
- Any error messages

I'll guide you through it! 🚀
