# Autonomous Decision-Making Skill

## Purpose
Enable subagents to make intelligent decisions autonomously, following guidelines and patterns, only pausing for truly critical choices.

## Decision Hierarchy

When a subagent encounters a choice, follow this hierarchy:

### 1. Spec Decision Guidelines (Highest Priority)
```markdown
# From spec.md:

## Decision Guidelines

### Technology Choices
- OAuth Providers: Use Google and GitHub
- Session Strategy: JWT tokens with 7-day expiry
```

**Action**: Follow the guideline exactly as specified.
**Log**: `Following spec guideline: [guideline]`

### 2. Stack Patterns
```markdown
# From stack skill:

## Database Patterns
- Always use UUIDs for primary keys
- Add created_at and updated_at timestamps
- Index frequently queried fields
```

**Action**: Follow the stack pattern.
**Log**: `Using stack pattern: [pattern]`

### 3. Global Standards
```markdown
# From standards/global/coding-style.md:

- Functions under 50 lines
- Descriptive variable names
- Early returns to avoid nesting
```

**Action**: Follow the standard.
**Log**: `Following standard: [standard]`

### 4. Reasonable Defaults
When no specific guidance exists, use industry best practices:

**Examples:**
- Add loading states to UI components
- Include error handling for API calls
- Add indexes on foreign keys
- Use semantic HTML elements
- Include ARIA labels for accessibility

**Action**: Make the reasonable default.
**Log**: `Using reasonable default: [decision] (review recommended)`

### 5. Critical Decision (Pause)
Only pause for truly critical decisions:

**What's Critical:**
- Adding paid services or dependencies
- Changing core architecture
- Modifying security policies
- Legal/compliance implications
- Major breaking changes

**What's NOT Critical:**
- Standard implementation details
- Minor styling choices
- Typical library usage
- Standard error handling patterns

**Action**: Pause and notify user.
**Log**: `PAUSED: Critical decision required: [decision]`

## Decision-Making Process

### Step 1: Identify the Choice
```
Question: "What OAuth providers should I implement?"
Context: Building authentication feature
Impact: Medium (affects user experience, not architecture)
```

### Step 2: Check Spec Guidelines
```
Checking specs.md > Decision Guidelines > OAuth Providers...
Found: "Use Google and GitHub (based on target audience)"
```

### Step 3: Apply Decision
```
Decision: Implement Google and GitHub OAuth
Source: Spec guideline
Confidence: High
```

### Step 4: Log Decision
```markdown
## Decision Log

- ✅ OAuth Providers: Google and GitHub
  - Source: Spec guideline
  - Rationale: Specified for target audience
  - Confidence: High
```

## Example Decision Scenarios

### Scenario 1: Missing Package

**Situation**: Code needs `date-fns` but it's not installed.

**Decision Process:**
1. Check spec guidelines: No guidance on date library
2. Check stack patterns: Stack uses `date-fns` elsewhere ✅
3. Is it critical? No - standard utility library
4. **Decision**: Install `date-fns`
5. **Log**: Using stack pattern (date-fns already in use)

### Scenario 2: Color Choice

**Situation**: Need to style a success message.

**Decision Process:**
1. Check spec guidelines: "Use brand colors - success: #10B981"
2. **Decision**: Use #10B981
3. **Log**: Following spec guideline (brand colors)

### Scenario 3: Error Message Wording

**Situation**: What message to show when login fails?

**Decision Process:**
1. Check spec guidelines: "User-friendly messages, don't reveal security details"
2. Check standards: "Never reveal if email exists or password wrong"
3. **Decision**: "Invalid email or password"
4. **Log**: Following security standard (generic auth error)

### Scenario 4: API Rate Limiting

**Situation**: Should this endpoint have rate limiting?

**Decision Process:**
1. Check spec guidelines: "Rate limit auth endpoints at 5 req/min"
2. Is this an auth endpoint? Yes
3. **Decision**: Add rate limiting at 5 req/min
4. **Log**: Following spec guideline (auth rate limiting)

### Scenario 5: Adding Monitoring Service

**Situation**: Should I add Sentry for error tracking?

**Decision Process:**
1. Check spec guidelines: Not mentioned
2. Check stack patterns: Not currently used
3. Is it critical? YES - adds external paid service
4. **Decision**: PAUSE and ask user
5. **Log**: PAUSED - Critical: Adding external service (Sentry)

## Implementation

### For Subagents

When you encounter a decision point:

```markdown
1. **Identify the Decision**
   "What [choice] should I make for [context]?"

2. **Check Hierarchy**
   - [ ] Check spec decision guidelines
   - [ ] Check stack patterns
   - [ ] Check standards
   - [ ] Consider reasonable default
   - [ ] Determine if critical

3. **Make Decision**
   Choose highest priority source that provides guidance

4. **Log Decision**
   Record in decision log with:
   - Decision made
   - Source (spec/stack/standard/default)
   - Rationale
   - Confidence level

5. **Continue or Pause**
   - If non-critical: continue autonomously
   - If critical: pause and notify user
```

### Decision Log Format

Create `decision-log.md` in implementation report:

```markdown
# Autonomous Decisions Log
Spec: 2025-01-15-authentication
Agent: api-engineer
Date: 2025-01-15

## Decisions Made

### 1. Session Token Strategy
- **Decision**: Use JWT with 7-day expiry
- **Source**: Spec guideline
- **Rationale**: Specified in decision guidelines
- **Confidence**: High ✅
- **Impact**: Medium

### 2. Password Hashing Algorithm
- **Decision**: bcrypt with cost factor 12
- **Source**: Spec guideline
- **Rationale**: Security requirement specified
- **Confidence**: High ✅
- **Impact**: High

### 3. Rate Limiting Implementation
- **Decision**: 5 requests per minute for auth endpoints
- **Source**: Spec guideline
- **Rationale**: Prevent brute force attacks
- **Confidence**: High ✅
- **Impact**: Medium

### 4. Request Logging Middleware
- **Decision**: Log all auth attempts with IP and timestamp
- **Source**: Reasonable default
- **Rationale**: Standard security practice, no guidance provided
- **Confidence**: Medium ⚠️ (review recommended)
- **Impact**: Low

### 5. Error Response Format
- **Decision**: Return {error: string, details?: object} format
- **Source**: Stack pattern
- **Rationale**: Consistent with existing API responses
- **Confidence**: High ✅
- **Impact**: Medium

## Summary
- Total Decisions: 5
- From Spec Guidelines: 3 (60%)
- From Stack Patterns: 1 (20%)
- From Reasonable Defaults: 1 (20%)
- Critical Decisions Requiring Approval: 0
```

## Confidence Levels

**High ✅**: Directly specified or clear best practice
- Follow without hesitation
- Very likely what user wants

**Medium ⚠️**: Reasonable inference or common pattern
- Safe to proceed
- Flag for review

**Low ❓**: Best guess, unclear guidance
- Proceed with caution
- Definitely flag for review
- Consider pausing if impact is high

## Impact Assessment

**High**: Core architecture, security, data modeling
**Medium**: User experience, performance, integrations
**Low**: Styling details, minor utilities, convenience features

**Rule**: High impact + Low confidence = PAUSE

## Best Practices

### DO:
- ✅ Always check spec guidelines first
- ✅ Log every decision with rationale
- ✅ Use confidence levels honestly
- ✅ Err on the side of caution for security
- ✅ Follow established patterns in codebase
- ✅ Consider user experience implications

### DON'T:
- ❌ Guess on critical decisions
- ❌ Skip checking guidelines
- ❌ Make decisions that contradict spec
- ❌ Add expensive services without approval
- ❌ Deviate from stack patterns without good reason
- ❌ Implement anti-patterns to save time

## Red Flags (Always Pause)

🚨 Adding paid external services
🚨 Changing database schema in breaking ways
🚨 Modifying authentication/authorization logic fundamentally
🚨 Exposing sensitive data
🚨 Changes affecting legal compliance (GDPR, etc.)
🚨 Major architectural changes not in spec

## Communication

### When Making Autonomous Decisions

**Good Decision Log Entry:**
```markdown
### Email Validation Library
- **Decision**: Use validator.js for email validation
- **Source**: Stack pattern (already used for form validation)
- **Rationale**: Consistent with existing validation approach
- **Confidence**: High ✅
- **Impact**: Low
- **Alternative Considered**: Built-in regex (rejected for consistency)
```

### When Pausing for Critical Decision

**Good Pause Notification:**
```markdown
⏸️ PAUSED: Critical Decision Required

**Decision**: Should we add Stripe for payment processing?

**Context**:
- Implementing subscription feature
- Spec mentions "payment handling" but not specific provider
- Stripe integration requires paid account

**Options**:
1. Stripe (most popular, well-documented)
2. PayPal (alternative, also paid)
3. Mock payment system for now (no external dependency)

**Recommendation**: Start with Stripe based on ecosystem
**Why It's Critical**: Adds external paid service dependency

**Waiting for your decision...**
```

## Integration with Autonomous Mode

When `autonomous_mode.enabled: true`:

1. Subagents automatically use this skill
2. All decisions logged to `decision-log.md`
3. Critical decisions trigger pause notification
4. User receives decision summary in completion notification

## Summary

**Autonomous decision-making enables:**
- ✅ Subagents work independently for hours
- ✅ Consistent decisions based on your guidelines
- ✅ Transparency through comprehensive logging
- ✅ Safety through critical decision pausing
- ✅ Quality through following established patterns

**You provide the strategy. AI handles the tactics.** 🎯
