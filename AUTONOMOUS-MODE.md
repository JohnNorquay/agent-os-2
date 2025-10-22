# Agent-OS 2.0 Autonomous Development Mode

## 🎯 Vision

**You design the feature. Walk away. Come back to a deployed, tested, verified implementation.**

Autonomous Mode enables Agent-OS 2.0 to work independently for hours, making smart decisions, recovering from errors, and notifying you of progress—all while you focus on other work.

---

## 🚀 The Autonomous Workflow

```
┌─────────────────────────────────────────────────────────┐
│  Phase 1: Collaborative Planning (You + AI)             │
│  Time: 15-30 minutes                                     │
├─────────────────────────────────────────────────────────┤
│  1. /init-project (if new)                              │
│  2. /create-spec [feature description]                  │
│     • AI asks clarifying questions                      │
│     • You provide requirements, mockups, preferences    │
│     • AI generates spec with decision guidelines        │
│  3. You review and approve spec                         │
│  4. /execute-task --autonomous                          │
│     • You click "Start" and walk away!                  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ You're free to do other work
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 2: Autonomous Execution (AI Only)                │
│  Time: 1-4 hours (depending on feature complexity)      │
├─────────────────────────────────────────────────────────┤
│  FOR EACH TASK GROUP:                                   │
│                                                          │
│  1. Spawn subagent (database, API, UI, testing)         │
│  2. Implement with decision-making framework            │
│     • Follow guidelines from spec                       │
│     • Make reasonable defaults                          │
│     • Log all decisions                                 │
│  3. If error occurs:                                    │
│     • Analyze error                                     │
│     • Search for solution (docs, web, patterns)         │
│     • Try alternative approach                          │
│     • Retry (up to 3 attempts)                          │
│     • If still failing, log and continue or pause       │
│  4. Run tests                                           │
│  5. If tests fail:                                      │
│     • Analyze failure                                   │
│     • Fix implementation                                │
│     • Re-run tests                                      │
│     • Iterate (up to 5 attempts)                        │
│  6. Create implementation report                        │
│  7. Send progress notification                          │
│                                                          │
│  AFTER ALL IMPLEMENTATION:                              │
│                                                          │
│  8. Run verifiers                                       │
│  9. If verification fails:                              │
│     • Analyze issues                                    │
│     • Re-implement problematic areas                    │
│     • Re-verify                                         │
│ 10. Visual testing (if UI changes):                     │
│     • Launch dev server                                 │
│     • Open browser via MCP                              │
│     • Take screenshots (mobile, tablet, desktop)        │
│     • Run visual regression tests                       │
│     • Test interactions                                 │
│ 11. Deploy to staging                                   │
│ 12. Run smoke tests                                     │
│ 13. Create preview URL                                  │
│ 14. NOTIFY YOU: "Feature ready for review!"            │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Notification arrives
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 3: Review & Deploy (You + AI)                    │
│  Time: 5-15 minutes                                      │
├─────────────────────────────────────────────────────────┤
│  1. You receive notification with:                      │
│     • Preview URL                                       │
│     • Implementation summary                            │
│     • Test results                                      │
│     • Screenshots                                       │
│     • Decisions made log                                │
│  2. You review:                                         │
│     • Click preview URL                                 │
│     • Check screenshots                                 │
│     • Review decision log                               │
│  3. You approve or request changes                      │
│  4. If approved: /deploy-to-production                  │
│     • AI deploys                                        │
│     • Runs production smoke tests                       │
│     • Updates roadmap                                   │
│     • Done! 🎉                                          │
└─────────────────────────────────────────────────────────┘
```

**Total Your Time: ~20-45 minutes**
**Total AI Time: 1-4 hours (while you do other things)**

---

## 🧠 Decision-Making Framework

### Decision Guidelines in Spec

During `/create-spec`, the spec includes a **Decision Guidelines** section:

```markdown
# Feature Spec: User Authentication

## Decision Guidelines

### Technology Choices
- OAuth Providers: Use Google and GitHub (based on target audience)
- Session Strategy: JWT tokens with 7-day expiry
- Password Requirements: Min 8 chars, must include number and special char

### UI/UX Decisions
- Color Scheme: Use brand colors (primary: #3B82F6, secondary: #10B981)
- Form Validation: Real-time on blur, show errors inline
- Loading States: Skeleton loaders (not spinners)
- Responsive Breakpoints: Mobile-first, breakpoints at 640px, 1024px

### Error Handling
- API Errors: Show user-friendly message, log details
- Network Errors: Retry up to 3 times with exponential backoff
- Validation Errors: Highlight field, show specific message

### Performance Targets
- Page Load: < 2 seconds
- API Response: < 500ms
- Bundle Size: < 200KB initial load

### Security Decisions
- Password Hashing: Use bcrypt (cost factor 12)
- HTTPS: Required for all auth endpoints
- CSRF Protection: Enabled
- Rate Limiting: 5 login attempts per minute per IP

### When to Ask User
- NEVER: Standard implementation details
- NEVER: Minor styling adjustments
- ASK: Major architectural changes
- ASK: Adding paid services or dependencies
- ASK: Changes that affect pricing or legal compliance
```

### Subagent Decision Process

When a subagent encounters a choice:

```javascript
// 1. Check decision guidelines
if (hasGuidelineForDecision(decision)) {
  followGuideline();
  logDecision(`Following guideline: ${guideline}`);
  continue;
}

// 2. Check stack patterns
if (hasStackPattern(decision)) {
  followStackPattern();
  logDecision(`Using stack pattern: ${pattern}`);
  continue;
}

// 3. Make reasonable default
if (hasReasonableDefault(decision)) {
  useDefault();
  logDecision(`Using reasonable default: ${default}`);
  continue;
}

// 4. Check if critical
if (isCriticalDecision(decision)) {
  pauseAndNotifyUser(decision);
  waitForUserInput();
} else {
  // Make best guess and continue
  makeBestGuess();
  logDecision(`Best guess (review recommended): ${guess}`);
}
```

### Decision Log

Every decision is logged:

```markdown
# Decisions Made During Implementation

## Database Layer
- ✅ Used UUID for user IDs (guideline: use UUIDs for all primary keys)
- ✅ Created index on email field (stack pattern: index frequently queried fields)
- ⚠️ Added created_at/updated_at timestamps (reasonable default - review recommended)

## API Layer
- ✅ Used bcrypt cost factor 12 (guideline: specified in spec)
- ✅ Implemented rate limiting at 5 req/min (guideline: specified)
- ⚠️ Added request logging middleware (reasonable default - review recommended)

## UI Layer
- ✅ Used Tailwind color primary-500 (#3B82F6) (guideline: brand colors)
- ✅ Implemented skeleton loaders (guideline: specified)
- ⚠️ Added focus ring styles for accessibility (reasonable default - review recommended)
```

---

## 🔧 Smart Error Recovery

### Error Recovery Strategies

```yaml
error_recovery:
  # How many times to retry after error
  max_retries: 3

  # Retry strategies
  strategies:
    - analyze_error_message
    - search_documentation
    - search_stack_overflow
    - try_alternative_approach
    - simplify_implementation
    - ask_different_subagent

  # When to pause vs. continue
  pause_on:
    - security_vulnerability_detected
    - cannot_resolve_after_max_retries
    - critical_service_unavailable
    - user_approval_required

  continue_on:
    - test_failure_with_clear_fix
    - missing_package_can_install
    - minor_linting_issues
    - documentation_warnings
```

### Error Recovery Example

```markdown
## Error Recovery Log: API Implementation

### Error 1: Import Error
**Error**: Cannot find module '@/lib/supabase'
**Strategy**: Analyze error → Check file structure
**Solution**: Created missing file at lib/supabase.ts
**Attempt**: 1/3
**Result**: ✅ Resolved

### Error 2: Type Error
**Error**: Property 'user' does not exist on type 'Session'
**Strategy**: Search documentation → Supabase docs
**Solution**: Updated type to use Session['user']
**Attempt**: 1/3
**Result**: ✅ Resolved

### Error 3: Test Failure
**Error**: Expected 201, received 400
**Analysis**: Missing email validation
**Strategy**: Try alternative approach
**Solution**: Added email validation before user creation
**Attempt**: 2/3
**Result**: ✅ Tests now passing

### Error 4: Build Error
**Error**: Module not found: 'bcryptjs'
**Strategy**: Install missing package
**Solution**: npm install bcryptjs @types/bcryptjs
**Attempt**: 1/3
**Result**: ✅ Resolved
```

---

## 📊 Progress Notifications

### Notification Channels

Configure where you want updates:

```yaml
notifications:
  enabled: true

  channels:
    slack:
      enabled: true
      webhook_url: ${SLACK_WEBHOOK_URL}
      channel: "#agent-os-updates"
      notify_on:
        - task_group_started
        - task_group_completed
        - error_encountered
        - error_resolved
        - verification_complete
        - deployment_complete

    email:
      enabled: false
      to: you@example.com
      notify_on:
        - verification_complete
        - deployment_complete
        - critical_error

    webhook:
      enabled: false
      url: https://your-app.com/webhooks/agent-os
      notify_on:
        - all

  frequency:
    min_interval: 5_minutes  # Don't spam
    summary_interval: 30_minutes  # Send summary every 30 min
```

### Notification Examples

**Slack Message: Task Started**
```
🚀 Agent-OS: Started implementing Database Layer
Spec: 2025-01-15-authentication
Agent: database-engineer
Tasks: 5
ETA: ~10 minutes
```

**Slack Message: Task Completed**
```
✅ Agent-OS: Database Layer complete!
Spec: 2025-01-15-authentication
Agent: database-engineer
Duration: 8 minutes
Files: 3 created, 0 modified
Tests: 12 passing
Report: implementation/01-database-layer.md
```

**Slack Message: Error Encountered**
```
⚠️ Agent-OS: Error encountered
Spec: 2025-01-15-authentication
Agent: api-engineer
Error: Missing dependency 'jsonwebtoken'
Strategy: Installing package
Status: Resolving automatically...
```

**Slack Message: Error Resolved**
```
✅ Agent-OS: Error resolved
Spec: 2025-01-15-authentication
Agent: api-engineer
Solution: Installed jsonwebtoken package
Attempts: 1/3
Status: Continuing implementation
```

**Slack Message: Feature Complete**
```
🎉 Agent-OS: Feature ready for review!
Spec: 2025-01-15-authentication

Implementation:
  ✅ Database: 3 files, 12 tests passing
  ✅ API: 5 files, 24 tests passing
  ✅ UI: 8 files, 31 tests passing
  ✅ Tests: 18 test files, 67 tests passing

Verification:
  ✅ Backend: APPROVED (87% coverage)
  ✅ Frontend: APPROVED (92% coverage)

Visual Testing:
  ✅ Desktop: 8 screenshots attached
  ✅ Tablet: 8 screenshots attached
  ✅ Mobile: 8 screenshots attached

Staging: https://your-app-staging.vercel.app
Preview: https://your-app-git-feat-auth.vercel.app

Decisions Made: 12 (see log)
Errors Resolved: 4

Total Time: 2 hours 14 minutes
Your Time Saved: ~6-8 hours

Ready to deploy? Reply "/deploy-to-production"
```

---

## 🔄 Autonomous Testing & Iteration

### Test-Fix-Retry Loop

```yaml
autonomous_testing:
  enabled: true

  max_iterations: 5  # Try up to 5 times to fix

  test_types:
    - unit
    - integration
    - e2e
    - visual_regression

  on_test_failure:
    1_analyze_failure:
      - read_error_message
      - identify_failing_test
      - understand_expected_vs_actual

    2_diagnose_cause:
      - check_implementation
      - verify_test_setup
      - check_dependencies
      - review_recent_changes

    3_attempt_fix:
      - fix_implementation
      - update_test_if_needed
      - verify_fix_makes_sense

    4_rerun_tests:
      - run_failing_test_only
      - if_passes_run_full_suite

    5_iterate:
      - if_still_failing_and_attempts_remaining: repeat
      - if_max_iterations_reached: log_and_notify
      - if_all_passing: continue
```

### Iteration Log

```markdown
## Test Iteration Log: Login API Endpoint

### Iteration 1
**Test**: POST /api/auth/login returns 200 with valid credentials
**Status**: ❌ FAILED
**Error**: Expected 200, received 500
**Analysis**: Server error - checking logs
**Diagnosis**: Missing password comparison
**Fix**: Added bcrypt.compare() before creating session
**Retest**: ✅ PASSED

### Iteration 2
**Test**: POST /api/auth/login returns 401 with invalid credentials
**Status**: ❌ FAILED
**Error**: Expected 401, received 500
**Analysis**: Error thrown instead of 401 response
**Diagnosis**: Not catching invalid credentials error
**Fix**: Added try-catch with proper 401 response
**Retest**: ✅ PASSED

### Iteration 3
**Test**: POST /api/auth/login rate limits after 5 attempts
**Status**: ❌ FAILED
**Error**: Rate limit not enforced
**Analysis**: Middleware not applied to route
**Diagnosis**: Missing middleware in route definition
**Fix**: Added rateLimitMiddleware to POST /api/auth/login
**Retest**: ✅ PASSED

Final Result: All 24 tests passing ✅
Iterations: 3/5
```

---

## 🖼️ Visual Verification (Browser Testing)

### Using MCP for Visual Testing

```yaml
visual_testing:
  enabled: true

  when_to_run:
    - after_ui_implementation
    - after_verification_passes
    - before_deployment

  viewports:
    mobile:
      width: 375
      height: 667
    tablet:
      width: 768
      height: 1024
    desktop:
      width: 1440
      height: 900

  pages_to_test:
    - auto_detect_from_routes
    - specified_in_spec

  interactions_to_test:
    - form_submissions
    - button_clicks
    - navigation
    - loading_states
    - error_states

  regression_testing:
    enabled: true
    baseline_dir: .agent-os/visual-baselines/
    threshold: 0.05  # 5% diff tolerance
```

### Visual Testing Process

```markdown
## Visual Testing Report

### Setup
- ✅ Started dev server on http://localhost:3000
- ✅ Connected to browser via MCP

### Screenshots Captured

#### Login Page
**Desktop (1440x900)**
- ✅ /auth/login - Initial state
- ✅ /auth/login - Form filled
- ✅ /auth/login - Validation error
- ✅ /auth/login - Loading state

**Tablet (768x1024)**
- ✅ /auth/login - Initial state
- ✅ /auth/login - Form filled

**Mobile (375x667)**
- ✅ /auth/login - Initial state
- ✅ /auth/login - Form filled
- ✅ /auth/login - Keyboard open

#### Signup Page
**Desktop (1440x900)**
- ✅ /auth/signup - Initial state
- ✅ /auth/signup - Form filled
- ✅ /auth/signup - OAuth buttons

**Mobile (375x667)**
- ✅ /auth/signup - Initial state
- ✅ /auth/signup - Form filled

### Interaction Testing
- ✅ Click "Login" button → Loading state → Success
- ✅ Click "Google OAuth" → Redirect to Google
- ✅ Submit invalid email → Validation error shown
- ✅ Submit wrong password → Error message shown
- ✅ Click "Forgot password" → Navigate to reset page

### Visual Regression
- ✅ No baseline found (first run) - Creating baseline
- 📸 24 baseline screenshots saved

### Accessibility Check
- ✅ All form inputs have labels
- ✅ Focus states visible
- ✅ Color contrast: WCAG AA compliant
- ⚠️ Warning: Missing alt text on logo (minor - can fix)

### Performance
- Page Load: 1.2s ✅ (target: < 2s)
- First Contentful Paint: 0.6s ✅
- Time to Interactive: 1.1s ✅

Screenshots saved to:
.agent-os/specs/2025-01-15-authentication/screenshots/
```

---

## 📦 Autonomous Dependency Management

```yaml
dependency_management:
  auto_install: true
  auto_update: false  # Be conservative

  when_missing_package:
    - check_package_registry
    - verify_its_safe
    - install_package
    - update_lockfile
    - rerun_previous_step

  when_version_conflict:
    - analyze_conflict
    - check_compatibility
    - try_compatible_version
    - if_no_compatible: notify_user

  package_verification:
    - check_npm_downloads
    - check_last_updated
    - check_known_vulnerabilities
    - if_risky: notify_user
```

---

## 🚢 Autonomous Deployment

```yaml
deployment:
  staging:
    auto_deploy: true
    after: verification_passes
    run_smoke_tests: true
    create_preview_url: true

  production:
    auto_deploy: false  # Require user approval
    after: user_approves
    run_smoke_tests: true
    rollback_on_failure: true

  smoke_tests:
    - health_check_endpoint
    - database_connection
    - authentication_flow
    - critical_user_paths
```

---

## ⚙️ Configuration

### Enable Autonomous Mode

```yaml
# config.yml

autonomous_mode:
  enabled: true

  # Decision making
  decision_making:
    use_guidelines: true
    use_stack_patterns: true
    use_reasonable_defaults: true
    pause_on_critical: true

  # Error recovery
  error_recovery:
    enabled: true
    max_retries: 3
    search_for_solutions: true
    pause_on_max_retries: false  # Continue with best effort

  # Testing
  autonomous_testing:
    enabled: true
    max_iterations: 5
    fix_and_retry: true

  # Visual testing
  visual_testing:
    enabled: true
    take_screenshots: true
    test_interactions: true
    run_regression: true

  # Notifications
  notifications:
    enabled: true
    slack:
      enabled: true
      webhook_url: ${SLACK_WEBHOOK_URL}

  # Deployment
  deployment:
    auto_deploy_staging: true
    auto_deploy_production: false
```

### Usage

```bash
# Standard mode (stop on decisions/errors)
/execute-task

# Autonomous mode (make decisions, recover from errors)
/execute-task --autonomous

# Autonomous with specific notification channel
/execute-task --autonomous --notify slack

# Autonomous with checkpoints (pause for review at each layer)
/execute-task --autonomous --checkpoints
```

---

## 🎯 Checkpoints (Optional Pauses)

For extra control, configure checkpoints:

```yaml
checkpoints:
  enabled: true

  pause_at:
    - after_database_layer
    - after_api_layer
    - after_ui_layer
    - before_deployment

  auto_resume_after: 24_hours  # Auto-continue if no response

  notification_on_checkpoint:
    - slack
    - email
```

**Checkpoint Notification:**
```
⏸️ Agent-OS: Checkpoint Reached
Spec: 2025-01-15-authentication
Checkpoint: After Database Layer

Completed:
  ✅ Database layer implementation
  ✅ 12 tests passing
  ✅ Verification passed

Next:
  • API Layer implementation
  • UI Layer implementation
  • Final verification
  • Deployment

Options:
  1. /resume - Continue to API layer
  2. /review - Review database implementation first
  3. /adjust - Make changes before continuing

Auto-resume in: 24 hours
```

---

## 📋 Example: Fully Autonomous Feature Development

### Your Input (15 minutes)

```bash
/create-spec Build a user dashboard with activity feed and settings page
```

**AI asks:**
- What should show in activity feed?
- What settings should be configurable?
- Any specific UI preferences?

**You answer:**
- Activity feed: recent logins, profile updates, security events
- Settings: email prefs, 2FA toggle, theme selection, delete account
- UI: Clean, modern, use our brand colors, mobile-first

**AI generates spec with decision guidelines**

**You review and approve**

```bash
/execute-task --autonomous --notify slack
```

**You walk away! ☕️**

---

### AI Works Autonomously (2-3 hours)

**Progress notifications to Slack:**

```
9:00 AM - 🚀 Started: Database Layer
9:12 AM - ✅ Completed: Database Layer (3 files, 15 tests ✅)
9:12 AM - 🚀 Started: API Layer
9:15 AM - ⚠️ Error: Missing 'date-fns' package
9:15 AM - ✅ Resolved: Installed date-fns
9:35 AM - ❌ Test failed: Activity feed pagination
9:37 AM - ✅ Fixed: Updated pagination logic
9:38 AM - ✅ All tests passing
9:40 AM - ✅ Completed: API Layer (8 files, 34 tests ✅)
9:40 AM - 🚀 Started: UI Layer
10:45 AM - ✅ Completed: UI Layer (12 files, 42 tests ✅)
10:45 AM - 🔍 Running verification...
10:52 AM - ✅ Backend verification: APPROVED
10:55 AM - ✅ Frontend verification: APPROVED
10:55 AM - 📸 Running visual tests...
11:05 AM - ✅ Visual tests: 36 screenshots captured
11:05 AM - 🚢 Deploying to staging...
11:10 AM - ✅ Deployed: https://yourapp-staging.vercel.app
11:10 AM - 🧪 Running smoke tests...
11:12 AM - ✅ All smoke tests passing

11:12 AM - 🎉 FEATURE COMPLETE!
Preview: https://yourapp-git-dashboard.vercel.app
Screenshots: 36 attached
Time: 2h 12min
Ready for your review!
```

---

### Your Review (10 minutes)

**11:30 AM - You check Slack**
- Click preview URL
- Review screenshots
- Check implementation reports
- Review decision log

**Everything looks great!**

```bash
/deploy-to-production
```

**AI deploys to production**

```
11:32 AM - 🚀 Deploying to production...
11:35 AM - ✅ Production deployed
11:35 AM - 🧪 Running production smoke tests...
11:37 AM - ✅ All tests passing
11:37 AM - 📝 Updated roadmap

🎉 Dashboard feature is LIVE!
URL: https://yourapp.com/dashboard
Total time: 2h 37min
Your time: 25 minutes
```

---

## 💡 Smart Features

### 1. Context Awareness

AI remembers across the feature:
- Previous decisions made
- Error patterns encountered
- User preferences from spec
- Codebase patterns

### 2. Learning from Patterns

As it works:
- Notices common errors and prevents them
- Learns your style preferences
- Improves decision-making
- Gets faster over time

### 3. Intelligent Parallelization

Maximizes efficiency:
- Research runs while implementing database
- Testing runs while UI builds
- Visual tests run while deploying
- Multiple viewports tested simultaneously

### 4. Graceful Degradation

If something can't work perfectly:
- Implements best-effort solution
- Logs the compromise
- Suggests improvements
- Continues instead of blocking

---

## 🎓 Best Practices

### For Specs
1. **Be specific in decision guidelines** - The more guidance, the more autonomous
2. **Provide examples** - Show what you like
3. **Set clear boundaries** - What's acceptable vs. needs approval
4. **Include mockups** - Visual targets help UI decisions

### For Autonomous Runs
1. **Start with smaller features** - Build trust
2. **Review decision logs** - Learn what AI prioritizes
3. **Adjust guidelines** - Refine based on results
4. **Use checkpoints first** - Then go fully autonomous

### For Notifications
1. **Don't spam yourself** - Set reasonable intervals
2. **Use Slack for updates** - Email for critical only
3. **Review summaries** - Not every single step
4. **Trust the process** - AI will notify if truly stuck

---

## 🚀 Getting Started with Autonomous Mode

### 1. Configure Notifications

```bash
# Set up Slack webhook
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Or configure in .agent-os/config.yml
```

### 2. Start with Checkpoints

```bash
# First autonomous run - pause at each layer
/execute-task --autonomous --checkpoints

# Review at each checkpoint, build confidence
```

### 3. Go Fully Autonomous

```bash
# Once comfortable - full autonomy
/execute-task --autonomous

# Walk away, come back to completed feature!
```

---

## 📊 Success Metrics

Autonomous mode is working well when:

✅ You spend < 30 min total for feature planning + review
✅ AI resolves 90%+ of errors without your input
✅ Verification passes without manual fixes
✅ Visual tests match expectations
✅ You trust the decision log
✅ You're comfortable deploying to production

---

**You design. AI builds. You approve. Ship.** 🚀

*The future of development: Your creativity + AI's tireless execution.*
