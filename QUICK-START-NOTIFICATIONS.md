# Quick Start: Email & SMS Notifications

Get notifications in 5 minutes!

---

## 📧 Email Setup (Gmail - Easiest)

### 1. Get Gmail App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other** (type "Agent-OS")
4. Click **Generate**
5. Copy the 16-character password

### 2. Create .env File

In your project directory:

```bash
# Create .env file
cat > .env << 'EOF'
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=your-email@gmail.com
EOF

# Make sure it's gitignored
echo ".env" >> .gitignore
```

### 3. Enable in config.yml

```yaml
# Edit ~/.claude/plugins/agent-os-2/config.yml
autonomous_mode:
  notifications:
    email:
      enabled: true  # Change to true
```

### 4. Test It

```bash
/test-notifications --email
```

**Done! You'll get emails when features complete.** ✅

---

## 📱 SMS Setup (Twilio - Easiest)

### 1. Create Twilio Account

1. Sign up at https://www.twilio.com/try-twilio (free trial)
2. Get a phone number (free)
3. Go to Dashboard
4. Copy **Account SID** and **Auth Token**

### 2. Add to .env File

```bash
# Add to your existing .env file
cat >> .env << 'EOF'

# SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token-here
TWILIO_PHONE_FROM=+1234567890
SMS_TO=+1234567890
EOF
```

### 3. Enable in config.yml

```yaml
# Edit ~/.claude/plugins/agent-os-2/config.yml
autonomous_mode:
  notifications:
    sms:
      enabled: true  # Change to true
```

### 4. Test It

```bash
/test-notifications --sms
```

**Done! You'll get texts when features complete.** ✅

---

## 🎯 Recommended Configuration

### For Solo Developers

```yaml
# config.yml
autonomous_mode:
  notifications:
    email:
      enabled: true
      notify_on:
        - feature_complete
        - critical_error

    sms:
      enabled: true
      notify_on:
        - feature_complete
        - critical_error
```

**You get:**
- Email with full details when feature completes
- Text on your phone (even away from computer)
- Both notify if critical error

---

## 📋 Full .env Template

```bash
# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=your-email@gmail.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_FROM=+1234567890
SMS_TO=+1234567890

# Optional: Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## ✅ Verification Checklist

Setup is complete when:

- [ ] .env file created with credentials
- [ ] .env added to .gitignore
- [ ] Email enabled in config.yml
- [ ] SMS enabled in config.yml (optional)
- [ ] Test email sent successfully
- [ ] Test SMS sent successfully (optional)

---

## 🧪 Testing

```bash
# Test email only
/test-notifications --email

# Test SMS only
/test-notifications --sms

# Test all configured channels
/test-notifications --all
```

---

## 🚀 Try It Out

```bash
# Start an autonomous build
/create-spec Add a simple feature
/execute-task --autonomous

# Go get coffee
# Check your email and phone when complete!
```

---

## 🎉 What You'll Receive

### Email Example

**Subject:** ✅ Feature Ready: Your Feature Name

**Body:**
- Implementation summary
- Test results
- Verification status
- Screenshots attached
- Preview URL
- Staging URL
- Next steps

### SMS Example

```
✅ Agent-OS: Your Feature COMPLETE!

67 tests passing
Preview: https://bit.ly/xyz

Time: 2h 14min
Ready to deploy!
```

---

## 💡 Tips

### Tip 1: Start with Email Only
Get comfortable with email notifications first, add SMS later.

### Tip 2: Use Quiet Hours
Don't get woken up by notifications:

```yaml
notifications:
  quiet_hours:
    enabled: true
    start: "22:00"
    end: "08:00"
```

### Tip 3: Different Notifications Per Channel

```yaml
email:
  notify_on:
    - feature_complete      # Detailed email
    - verification_complete
    - deployment_complete

sms:
  notify_on:
    - feature_complete      # Just the essentials
    - critical_error
```

---

## 🔧 Troubleshooting

### Email Not Sending

**Check:**
1. App password (not regular password)
2. 2-factor authentication enabled on Gmail
3. .env file has correct values
4. No spaces in .env values

**Test connection:**
```bash
# Try sending test email
/test-notifications --email --verbose
```

### SMS Not Sending

**Check:**
1. Phone number has country code (+1 for US)
2. Twilio trial account verified your number
3. Account SID and Auth Token correct
4. From number matches Twilio number

**Test connection:**
```bash
# Try sending test SMS
/test-notifications --sms --verbose
```

---

## 📚 More Information

For advanced configuration (SendGrid, Vonage, AWS, etc.):
👉 See `NOTIFICATIONS-SETUP.md`

---

**That's it! Now you'll never miss when Agent-OS completes a feature—even away from your desk!** 📧📱🎉
