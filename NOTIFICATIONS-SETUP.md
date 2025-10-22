# Agent-OS 2.0 Notification Setup Guide

## Overview

Stay informed about autonomous development progress via:
- ✉️ **Email** - Detailed updates with rich formatting
- 📱 **SMS/Text** - Quick status updates on your phone
- 💬 **Slack** - Team visibility (already configured)
- 🔗 **Webhook** - Custom integrations

---

## 📧 Email Notifications

### Option 1: Using Gmail (Simplest)

**Step 1: Enable Gmail App Password**

1. Go to Google Account settings: https://myaccount.google.com/
2. Security → 2-Step Verification (enable if not already)
3. Security → App passwords
4. Generate password for "Mail" on "Other (Agent-OS)"
5. Copy the 16-character password

**Step 2: Configure Agent-OS**

Create `.env` file in your project:

```bash
# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here  # 16-char password from Step 1
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=your-email@gmail.com      # Can be different email
```

**Step 3: Update config.yml**

```yaml
autonomous_mode:
  notifications:
    enabled: true

    email:
      enabled: true
      from: ${EMAIL_FROM}
      to: ${EMAIL_TO}
      smtp:
        host: ${SMTP_HOST}
        port: ${SMTP_PORT}
        secure: ${SMTP_SECURE}
        auth:
          user: ${SMTP_USER}
          pass: ${SMTP_PASS}

      notify_on:
        - feature_complete      # ✅ Always
        - critical_error        # ✅ Always
        - verification_complete # Optional
        - deployment_complete   # Optional

      format: html              # Rich formatting
      include_screenshots: true # Attach screenshots
```

**Test it:**
```bash
/test-notifications --email
```

---

### Option 2: Using SendGrid (Recommended for Production)

**Step 1: Create SendGrid Account**

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Create API Key: Settings → API Keys → Create API Key
3. Give it "Mail Send" permissions
4. Copy the API key

**Step 2: Configure**

```bash
# .env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=notifications@yourdomain.com  # Must be verified in SendGrid
EMAIL_TO=your-email@gmail.com
```

```yaml
# config.yml
autonomous_mode:
  notifications:
    email:
      enabled: true
      provider: sendgrid
      api_key: ${SENDGRID_API_KEY}
      from: ${EMAIL_FROM}
      to: ${EMAIL_TO}
      notify_on:
        - feature_complete
        - critical_error
```

---

### Option 3: Using Any SMTP Server

```bash
# .env for custom SMTP
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=notifications@yourdomain.com
SMTP_PASS=your-password
EMAIL_FROM=notifications@yourdomain.com
EMAIL_TO=your-email@example.com
```

---

### Email Notification Examples

#### Feature Complete Email

**Subject:** ✅ Feature Ready: User Authentication

**Body:**
```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6;">
  <div style="background: #f4f4f4; padding: 20px;">
    <div style="background: white; padding: 30px; border-radius: 10px;">

      <h1 style="color: #10B981;">🎉 Feature Complete!</h1>

      <h2>User Authentication</h2>
      <p><strong>Spec:</strong> 2025-01-15-authentication</p>
      <p><strong>Duration:</strong> 2 hours 14 minutes</p>

      <hr>

      <h3>Implementation Summary</h3>
      <ul>
        <li>✅ Database Layer: 3 files, 12 tests passing</li>
        <li>✅ API Layer: 5 files, 24 tests passing</li>
        <li>✅ UI Layer: 8 files, 31 tests passing</li>
        <li>✅ Tests: 18 test files, 67 tests passing</li>
      </ul>

      <h3>Verification Results</h3>
      <ul>
        <li>✅ Backend: APPROVED (87% coverage)</li>
        <li>✅ Frontend: APPROVED (92% coverage)</li>
      </ul>

      <h3>Visual Testing</h3>
      <p>36 screenshots captured across 3 viewports</p>

      <h3>Quick Links</h3>
      <div style="margin: 20px 0;">
        <a href="https://your-app-staging.vercel.app"
           style="background: #3B82F6; color: white; padding: 10px 20px;
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          View Staging
        </a>

        <a href="https://your-app-git-auth.vercel.app"
           style="background: #10B981; color: white; padding: 10px 20px;
                  text-decoration: none; border-radius: 5px; display: inline-block;
                  margin-left: 10px;">
          View Preview
        </a>
      </div>

      <h3>Decisions Made</h3>
      <p>12 autonomous decisions (see decision-log.md)</p>

      <h3>Errors Resolved</h3>
      <p>4 errors automatically resolved</p>

      <hr>

      <h3>Next Steps</h3>
      <p>Ready to deploy to production?</p>
      <p>Run: <code>/deploy-to-production</code></p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;
                  color: #666; font-size: 12px;">
        <p>Agent-OS 2.0 Autonomous Development</p>
        <p>Your time saved: ~6 hours</p>
      </div>

    </div>
  </div>
</body>
</html>
```

---

## 📱 SMS/Text Notifications

### Option 1: Using Twilio (Most Popular)

**Step 1: Create Twilio Account**

1. Sign up at https://twilio.com (free trial)
2. Get a phone number (free in trial)
3. Dashboard → Account → Account SID and Auth Token
4. Copy credentials

**Step 2: Configure**

```bash
# .env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_FROM=+1234567890    # Your Twilio number
SMS_TO=+1234567890               # Your mobile number
```

```yaml
# config.yml
autonomous_mode:
  notifications:
    sms:
      enabled: true
      provider: twilio
      account_sid: ${TWILIO_ACCOUNT_SID}
      auth_token: ${TWILIO_AUTH_TOKEN}
      from: ${TWILIO_PHONE_FROM}
      to: ${SMS_TO}

      notify_on:
        - feature_complete      # ✅ Always
        - critical_error        # ✅ Always
        - checkpoint_reached    # Optional

      max_length: 160           # Standard SMS length
      include_links: true       # Short URLs
```

**Test it:**
```bash
/test-notifications --sms
```

---

### Option 2: Using Vonage (formerly Nexmo)

```bash
# .env
VONAGE_API_KEY=xxxxxxxx
VONAGE_API_SECRET=xxxxxxxxxxxxxxxx
VONAGE_PHONE_FROM=1234567890
SMS_TO=+1234567890
```

```yaml
# config.yml
autonomous_mode:
  notifications:
    sms:
      enabled: true
      provider: vonage
      api_key: ${VONAGE_API_KEY}
      api_secret: ${VONAGE_API_SECRET}
      from: ${VONAGE_PHONE_FROM}
      to: ${SMS_TO}
```

---

### Option 3: Using AWS SNS

```bash
# .env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
SMS_TO=+1234567890
```

```yaml
# config.yml
autonomous_mode:
  notifications:
    sms:
      enabled: true
      provider: aws-sns
      region: ${AWS_REGION}
      credentials:
        access_key_id: ${AWS_ACCESS_KEY_ID}
        secret_access_key: ${AWS_SECRET_ACCESS_KEY}
      to: ${SMS_TO}
```

---

### SMS Notification Examples

#### Feature Started
```
🚀 Agent-OS: Started implementing User Authentication
ETA: ~2 hours
```

#### Feature Complete
```
✅ Agent-OS: Authentication COMPLETE!

67 tests passing
Preview: https://bit.ly/3x9K2mP
Staging: https://bit.ly/3xAb1Cd

Time: 2h 14min
Ready to deploy!
```

#### Error Encountered
```
⚠️ Agent-OS: Error in API layer
Attempting automatic recovery...
Status: Attempt 1/3
```

#### Critical Error
```
🚨 Agent-OS: CRITICAL ERROR
Cannot connect to database
Action needed: Check .env file
Paused. Reply CONTINUE when fixed.
```

#### Checkpoint Reached
```
⏸️ Agent-OS: Checkpoint - Database layer complete
Reply RESUME to continue
Reply REVIEW to check first
Auto-resume in 24h
```

---

## 🎚️ Notification Levels

### Minimal (Default)
Only notify for important milestones:
```yaml
notify_on:
  - feature_complete
  - critical_error
```

### Moderate
Include checkpoints:
```yaml
notify_on:
  - feature_complete
  - critical_error
  - checkpoint_reached
  - verification_complete
```

### Detailed
Know everything:
```yaml
notify_on:
  - task_started
  - task_completed
  - error_encountered
  - error_resolved
  - verification_complete
  - deployment_complete
  - feature_complete
```

### Custom Per Channel

```yaml
notifications:
  email:
    notify_on:
      - feature_complete
      - verification_complete
      - deployment_complete

  sms:
    notify_on:
      - feature_complete
      - critical_error
      # Only essentials via SMS

  slack:
    notify_on:
      - task_started
      - task_completed
      - error_encountered
      - error_resolved
      - feature_complete
      # Detailed for team visibility
```

---

## 📬 Multiple Recipients

### Email: Multiple Addresses

```yaml
email:
  to:
    - you@example.com
    - teammate@example.com
    - manager@example.com
```

### SMS: Multiple Numbers

```yaml
sms:
  to:
    - +12345678901
    - +12345678902
```

---

## 🕐 Notification Timing

### Quiet Hours

```yaml
notifications:
  quiet_hours:
    enabled: true
    start: "22:00"  # 10 PM
    end: "08:00"    # 8 AM
    timezone: America/New_York

    # What to do during quiet hours
    behavior: queue  # Options: queue, send_anyway, disable

    # Always send these even during quiet hours
    exceptions:
      - critical_error
```

### Rate Limiting

```yaml
notifications:
  rate_limiting:
    enabled: true
    min_interval: 5_minutes      # Don't send more often than every 5 min
    max_per_hour: 10             # Max 10 notifications per hour

    # Combine multiple updates into summaries
    batch_updates: true
    batch_interval: 15_minutes
```

---

## 🎨 Notification Templates

### Customize Email Templates

Create `~/.claude/plugins/agent-os-2/templates/notifications/`:

**feature-complete.html:**
```html
<!DOCTYPE html>
<html>
<body>
  <h1>🎉 {{feature_name}} Complete!</h1>

  <p><strong>Duration:</strong> {{duration}}</p>
  <p><strong>Test Coverage:</strong> {{coverage}}%</p>

  <h2>Summary</h2>
  <ul>
    {{#each layers}}
    <li>{{this.name}}: {{this.files}} files, {{this.tests}} tests</li>
    {{/each}}
  </ul>

  <a href="{{preview_url}}">View Preview</a>
</body>
</html>
```

**critical-error.html:**
```html
<!DOCTYPE html>
<html>
<body style="background: #FEE; padding: 20px;">
  <h1 style="color: #C00;">🚨 Critical Error</h1>

  <p><strong>Feature:</strong> {{feature_name}}</p>
  <p><strong>Agent:</strong> {{agent_name}}</p>
  <p><strong>Error:</strong> {{error_message}}</p>

  <h2>What Was Tried</h2>
  <ol>
    {{#each attempts}}
    <li>{{this}}</li>
    {{/each}}
  </ol>

  <h2>Action Needed</h2>
  <p>{{recommended_action}}</p>
</body>
</html>
```

### Customize SMS Templates

**sms-templates.yml:**
```yaml
templates:
  feature_complete: |
    ✅ {{feature_name}} COMPLETE!
    Tests: {{test_count}} passing
    Preview: {{short_url}}

  critical_error: |
    🚨 CRITICAL: {{error_type}}
    {{feature_name}}
    {{action_needed}}

  checkpoint: |
    ⏸️ Checkpoint: {{layer_name}} complete
    Reply RESUME to continue
```

---

## 🔐 Security Best Practices

### Environment Variables

**DO:**
```bash
# .env (never commit!)
TWILIO_AUTH_TOKEN=secret-token-here
SMTP_PASS=secret-password-here
```

**DON'T:**
```yaml
# config.yml (committed to git!)
sms:
  auth_token: secret-token-here  # ❌ NEVER DO THIS
```

### Sensitive Information

```yaml
notifications:
  security:
    # Don't include sensitive data in notifications
    redact_sensitive: true

    # What to redact
    redact_patterns:
      - api_keys
      - passwords
      - tokens
      - connection_strings

    # Use short links instead of full URLs with tokens
    use_short_links: true
```

---

## 📊 Complete Configuration Example

```yaml
# config.yml
autonomous_mode:
  notifications:
    enabled: true

    # Timing
    quiet_hours:
      enabled: true
      start: "22:00"
      end: "08:00"
      timezone: America/New_York
      behavior: queue
      exceptions:
        - critical_error

    rate_limiting:
      min_interval: 5_minutes
      batch_updates: true
      batch_interval: 15_minutes

    # Email (detailed updates)
    email:
      enabled: true
      provider: gmail
      smtp:
        host: ${SMTP_HOST}
        port: ${SMTP_PORT}
        auth:
          user: ${SMTP_USER}
          pass: ${SMTP_PASS}
      from: ${EMAIL_FROM}
      to:
        - you@example.com
        - teammate@example.com
      format: html
      include_screenshots: true
      notify_on:
        - feature_complete
        - verification_complete
        - deployment_complete
        - critical_error

    # SMS (critical only)
    sms:
      enabled: true
      provider: twilio
      account_sid: ${TWILIO_ACCOUNT_SID}
      auth_token: ${TWILIO_AUTH_TOKEN}
      from: ${TWILIO_PHONE_FROM}
      to: ${SMS_TO}
      notify_on:
        - feature_complete
        - critical_error

    # Slack (team updates)
    slack:
      enabled: true
      webhook_url: ${SLACK_WEBHOOK_URL}
      channel: "#agent-os-builds"
      notify_on:
        - task_started
        - task_completed
        - error_encountered
        - error_resolved
        - feature_complete
```

---

## 🧪 Testing Notifications

```bash
# Test email
/test-notifications --email

# Test SMS
/test-notifications --sms

# Test all channels
/test-notifications --all

# Send test with specific message
/test-notifications --email --message "This is a test"
```

---

## 💰 Cost Estimates

### Email
- **Gmail**: Free (with app password)
- **SendGrid**: Free tier (100 emails/day)
- **AWS SES**: $0.10 per 1000 emails

### SMS
- **Twilio**: $0.0075 per SMS (US)
- **Vonage**: $0.0067 per SMS (US)
- **AWS SNS**: $0.00645 per SMS (US)

**Typical Usage:**
- 5-10 notifications per feature
- If building 20 features/month
- = 100-200 notifications/month
- **Cost: ~$1-2/month for SMS**

---

## 🚀 Quick Start

### 1. Choose Your Channels

**For Solo Developers:**
- Email for detailed updates
- SMS for critical errors

**For Teams:**
- Slack for team visibility
- Email for individual updates
- SMS for critical personal alerts

### 2. Set Up Environment Variables

```bash
# Create .env in your project
touch .env

# Add credentials (example for Gmail + Twilio)
cat >> .env << EOF
# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=your-email@gmail.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_FROM=+1234567890
SMS_TO=+1234567890
EOF

# Never commit .env!
echo ".env" >> .gitignore
```

### 3. Update config.yml

```yaml
autonomous_mode:
  notifications:
    enabled: true
    email:
      enabled: true
    sms:
      enabled: true
```

### 4. Test It

```bash
/test-notifications --all
```

### 5. Run Your First Autonomous Build

```bash
/create-spec Add feature
/execute-task --autonomous

# Check your email and phone!
```

---

## 📱 Mobile App Integration (Bonus)

### Push Notifications via Pushover

```bash
# .env
PUSHOVER_USER_KEY=your-user-key
PUSHOVER_APP_TOKEN=your-app-token
```

```yaml
# config.yml
notifications:
  pushover:
    enabled: true
    user_key: ${PUSHOVER_USER_KEY}
    app_token: ${PUSHOVER_APP_TOKEN}
    priority: 1  # High priority notifications
```

**Download Pushover app** → Get instant push notifications on iOS/Android

---

## ✅ Checklist

Setup is complete when you can check these off:

- [ ] Email notifications configured
- [ ] SMS notifications configured (optional)
- [ ] Test notifications sent successfully
- [ ] .env file created and gitignored
- [ ] Quiet hours configured (optional)
- [ ] Notification levels set to preference
- [ ] First autonomous build receives notifications

---

**Now you'll never miss when Agent-OS completes a feature—even if you're away from your computer!** 📧📱🎉
