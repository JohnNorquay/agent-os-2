# Autonomous Error Recovery Skill

## Purpose
Enable subagents to automatically recover from errors, try alternative solutions, and only escalate after exhausting reasonable attempts.

## Error Recovery Philosophy

**Goal**: Keep making progress, not get stuck.

**Principles**:
1. Errors are expected and normal
2. Most errors have known solutions
3. Try multiple approaches before giving up
4. Learn from each attempt
5. Document everything
6. Know when to ask for help

## Recovery Strategies

### 1. Analyze Error Message

**Read the error carefully:**
```
Error: Cannot find module '@/lib/supabase'
```

**Extract key information:**
- Type: Import error / Module not found
- Missing: `@/lib/supabase`
- Likely cause: File doesn't exist or wrong path
- Severity: Blocking (can't continue without it)

### 2. Diagnose Root Cause

**Ask diagnostic questions:**
- Does the file exist?
- Is the path correct?
- Is the import statement right?
- Is there a typo?
- Is it a dependency issue?

**Check evidence:**
```bash
# Check if file exists
ls lib/supabase.ts  # Not found

# Check if directory exists
ls lib/  # Exists

# Conclusion: File missing
```

### 3. Generate Solutions

**Brainstorm approaches:**

**Option A**: Create the missing file
- Pros: Direct solution
- Cons: Need to know what should be in it
- Likelihood: High

**Option B**: Fix the import path
- Pros: File might exist elsewhere
- Cons: Need to find actual location
- Likelihood: Medium

**Option C**: Check if it's a dependency
- Pros: Might need npm install
- Cons: Seems unlikely for custom lib file
- Likelihood: Low

### 4. Try Solutions (Ordered by Likelihood)

**Attempt 1**: Create missing file based on stack patterns
**Attempt 2**: Search codebase for similar files
**Attempt 3**: Check if renamed or moved
**Attempt 4**: Ask user if still stuck

## Error Categories & Strategies

### Import/Module Errors

**Error Pattern:**
```
Cannot find module 'X'
Module not found: 'X'
Cannot resolve 'X'
```

**Recovery Strategy:**
1. Check if file exists
   - If not: Create it based on stack patterns
   - If yes: Fix import path
2. Check if it's a package
   - Run `npm install X`
3. Check tsconfig/paths
   - Verify path aliases are correct
4. Search for actual location
   - Maybe it was moved/renamed

### Type Errors

**Error Pattern:**
```
Property 'X' does not exist on type 'Y'
Type 'X' is not assignable to type 'Y'
```

**Recovery Strategy:**
1. Check documentation for correct type
2. Update type definition
3. Add type assertion if valid
4. Check if type was recently changed
5. Verify import statement

### Test Failures

**Error Pattern:**
```
Expected X but received Y
Test suite failed
Assertion error
```

**Recovery Strategy:**
1. Read test expectation
2. Check if implementation is wrong
   - Fix implementation
   - Re-run test
3. Check if test is wrong
   - Verify test matches spec
   - Update test if spec changed
4. Check if data/setup is wrong
   - Fix test setup
   - Re-run test

### Build Errors

**Error Pattern:**
```
Build failed
Compilation error
Syntax error
```

**Recovery Strategy:**
1. Read error location
2. Check syntax at that line
3. Fix syntax error
4. Check for missing dependencies
   - Install if needed
5. Clear cache and rebuild
   - `rm -rf .next && npm run build`

### Runtime Errors

**Error Pattern:**
```
ReferenceError: X is not defined
TypeError: Cannot read property 'X' of undefined
```

**Recovery Strategy:**
1. Add null/undefined checks
2. Initialize variables properly
3. Add error boundaries
4. Verify data flow
5. Add defensive programming

### Database Errors

**Error Pattern:**
```
Relation "X" does not exist
Column "X" does not exist
Unique constraint violation
```

**Recovery Strategy:**
1. Check if migration ran
   - Run pending migrations
2. Check schema definition
   - Fix schema if wrong
3. Check query syntax
   - Fix SQL/query
4. Check for typos in column names

## Recovery Process

### Step-by-Step Recovery

```markdown
1. **Error Encountered**
   Log: Error captured
   Action: Don't panic

2. **Analyze Error**
   Read error message carefully
   Identify error type
   Assess severity
   Log: Analysis complete

3. **Generate Solutions**
   Brainstorm 3-5 possible fixes
   Order by likelihood
   Log: Solutions identified

4. **Attempt Solution 1**
   Try most likely fix
   Test if it worked
   Log: Attempt 1 - [Result]

5. **If Failed, Attempt Solution 2**
   Try next solution
   Test if it worked
   Log: Attempt 2 - [Result]

6. **Continue Until Resolved or Max Attempts**
   Try each solution
   Log each attempt
   Stop at max retries (default: 3)

7. **If Resolved**
   Continue with implementation
   Log: Error resolved after N attempts

8. **If Not Resolved**
   Check if critical blocking issue
   - If critical: Pause and notify user
   - If not critical: Best effort and continue
   Log: Could not resolve, proceeding with best effort
```

## Error Recovery Log

### Format

Create `error-recovery-log.md`:

```markdown
# Error Recovery Log
Spec: 2025-01-15-authentication
Agent: api-engineer
Date: 2025-01-15

## Errors Encountered & Resolved

### Error 1: Missing Module
**Time**: 9:15 AM
**Error**: Cannot find module '@/lib/supabase'
**Severity**: Blocking
**Impact**: Cannot import Supabase client

**Diagnosis**:
- File does not exist at lib/supabase.ts
- Directory lib/ exists
- Likely: File wasn't created yet

**Attempted Solutions**:
1. ✅ Create lib/supabase.ts with Supabase client initialization
   - Used stack pattern from existing project
   - Added proper TypeScript types
   - Result: SUCCESS

**Resolution**: Created missing file
**Attempts**: 1/3
**Time to Resolve**: 2 minutes
**Status**: ✅ Resolved

---

### Error 2: Type Mismatch
**Time**: 9:22 AM
**Error**: Type 'Session | null' is not assignable to type 'Session'
**Severity**: Blocking
**Impact**: Cannot compile

**Diagnosis**:
- Supabase getSession() returns Session | null
- Function expects non-null Session
- Likely: Missing null check

**Attempted Solutions**:
1. ❌ Add type assertion `as Session`
   - Unsafe, could cause runtime error
   - Result: REJECTED

2. ✅ Add null check before using session
   - Safe approach
   - Return early if null
   - Result: SUCCESS

**Resolution**: Added proper null handling
**Attempts**: 2/3
**Time to Resolve**: 3 minutes
**Status**: ✅ Resolved

---

### Error 3: Test Failure
**Time**: 9:35 AM
**Error**: Expected status 200, received 400
**Severity**: Non-blocking (test only)
**Impact**: Test not passing

**Diagnosis**:
- API endpoint returns 400 Bad Request
- Expected 200 OK
- Likely: Missing required field in request

**Attempted Solutions**:
1. ❌ Check request body in test
   - All required fields present
   - Result: Not the issue

2. ❌ Check API validation logic
   - Validation requires 'email' field
   - Test includes email
   - Result: Not the issue

3. ✅ Check email format validation
   - API validates email format
   - Test used 'test' as email (invalid)
   - Updated test to use 'test@example.com'
   - Result: SUCCESS

**Resolution**: Fixed test data to use valid email
**Attempts**: 3/3
**Time to Resolve**: 5 minutes
**Status**: ✅ Resolved

---

## Summary
- Total Errors: 3
- Resolved: 3 (100%)
- Failed Attempts: 2
- Total Attempts: 6
- Average Resolution Time: 3.3 minutes
- Max Retries Reached: 0
- User Escalations: 0
```

## Search Strategies

### 1. Search Documentation

When error is about a specific library:

```markdown
Query: "Supabase getSession return type TypeScript"
Source: Supabase docs
Result: Returns Promise<{ data: { session: Session | null } }>
Action: Add null handling
```

### 2. Search Web (Stack Overflow, GitHub Issues)

When error is common:

```markdown
Query: "Cannot find module @/ Next.js TypeScript"
Source: Stack Overflow
Result: Check tsconfig.json paths configuration
Action: Verify tsconfig paths are correct
```

### 3. Search Codebase

When error might have been solved before:

```markdown
Query: "Similar Supabase client initialization"
Source: Existing code
Result: Found pattern in lib/database.ts
Action: Follow same pattern
```

## Retry Logic

### When to Retry

**Always Retry:**
- Network timeouts
- Temporary service unavailable
- Flaky tests
- Race conditions

**Sometimes Retry:**
- Build failures (might be cache)
- Type errors (might be generated types)
- Import errors (might be file write delay)

**Never Retry (Fix Instead):**
- Syntax errors
- Logic errors
- Validation errors
- Breaking changes

### Retry Configuration

```yaml
retry:
  max_attempts: 3
  strategies:
    - fix_and_retry
    - alternative_approach
    - simplify_solution

  backoff:
    type: none  # Immediate retry after fix
    # (Not waiting - we're fixing between retries)

  give_up_after:
    attempts: 3
    time: 15_minutes
```

## Escalation Criteria

### When to Pause and Notify User

**Critical Errors:**
- Security vulnerabilities detected
- Data loss risk
- Cannot connect to critical services
- Unsolvable after max retries (and blocks progress)

**Non-Critical Errors:**
- Minor test failures (can skip)
- Linting warnings (can ignore)
- Optional features failing (can continue)
- Low-impact bugs (can fix later)

### Escalation Message

```markdown
🚨 Critical Error - User Input Needed

**Error**: Cannot connect to Supabase database
**Attempts**: 3/3
**Impact**: Blocks all database operations

**What I Tried**:
1. Verified connection string format ❌
2. Checked environment variables ❌
3. Tested direct connection ❌

**Diagnosis**:
Environment variable SUPABASE_URL appears to be incorrect or service is down

**Recommended Action**:
1. Verify SUPABASE_URL in .env file
2. Check Supabase dashboard for service status
3. Confirm API key is correct

**Can I Continue?**
- No: This blocks all database functionality
- Alternative: Use mock database for now (will need to retest later)

**Waiting for your decision...**
```

## Learning from Errors

### Track Patterns

```markdown
# Common Errors & Solutions

## Supabase Import Errors
**Occurrences**: 3
**Pattern**: Missing @/lib/supabase file
**Solution**: Create file with standard Supabase client
**Prevention**: Include in project template

## Email Validation in Tests
**Occurrences**: 2
**Pattern**: Tests use invalid email format
**Solution**: Always use valid emails in test data
**Prevention**: Create test data factory with valid defaults

## Type Errors with Supabase Session
**Occurrences**: 4
**Pattern**: Forgetting Session | null type
**Solution**: Always check for null before using session
**Prevention**: Add type guard helper function
```

## Best Practices

### DO:
- ✅ Read error messages carefully
- ✅ Try obvious solution first
- ✅ Log every attempt
- ✅ Learn from each error
- ✅ Search for known solutions
- ✅ Fix root cause, not symptoms
- ✅ Test after each fix

### DON'T:
- ❌ Ignore error messages
- ❌ Try random fixes
- ❌ Give up after first attempt
- ❌ Skip logging
- ❌ Use hacky workarounds
- ❌ Suppress errors without fixing
- ❌ Retry without changing approach

## Integration with Autonomous Mode

When `autonomous_mode.error_recovery.enabled: true`:

1. Errors trigger automatic recovery attempts
2. Each attempt logged to error-recovery-log.md
3. Max retries configurable (default: 3)
4. User only notified if critical or max retries reached
5. Non-blocking errors allow continuation

## Success Metrics

Error recovery is working well when:

✅ 90%+ of errors resolved automatically
✅ Average resolution time < 5 minutes
✅ Rarely reaching max retries
✅ User escalations < 10% of errors
✅ Learning from patterns (fewer repeats)

---

**Errors are just puzzles. AI agents are getting really good at puzzles.** 🧩
