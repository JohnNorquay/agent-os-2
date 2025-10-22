# Example: Building Authentication with Hybrid Architecture

This example demonstrates the Hybrid Architecture in action by building a complete authentication feature.

---

## Initial Setup

```bash
cd my-saas-app
/init-project
```

**Orchestrator asks:**
- What are you building? *"A SaaS project management tool"*
- Who is it for? *"Teams that need better task collaboration"*
- Which stack? *"supabase-vercel"*

**Creates:**
```
.agent-os/
├── config.yml (stack: supabase-vercel)
└── product/
    ├── mission.md
    ├── roadmap.md
    └── tech-stack.md
```

**Context used:** ~250 tokens

---

## Creating the Spec

```bash
/create-spec Add user authentication with email/password and OAuth
```

**Orchestrator:**
1. Loads stack skill (`stacks/supabase-vercel/SKILL.md`)
2. Generates SRD, specs, and tasks
3. Auto-assigns role metadata based on keywords
4. Presents for review

**Generated tasks.md:**
```markdown
# Implementation Tasks: User Authentication

## Research & Design [delegate:chat-claude] [type:research] [output:oauth-comparison.md]
- [ ] Compare OAuth 2.0 providers (Google, GitHub, Microsoft)
- [ ] Research Supabase Auth best practices
- [ ] Analyze session management strategies

## Database Layer [role:database-engineer]
- [ ] Create auth.users table schema
- [ ] Create auth.sessions table schema
- [ ] Add Row-Level Security (RLS) policies for users
- [ ] Add RLS policies for sessions
- [ ] Create helper function for session validation

## API Layer [role:api-engineer] [depends-on:database-layer]
- [ ] Create POST /api/auth/signup endpoint
- [ ] Create POST /api/auth/login endpoint
- [ ] Create POST /api/auth/logout endpoint
- [ ] Create POST /api/auth/oauth/callback endpoint
- [ ] Add authentication middleware
- [ ] Add rate limiting for auth endpoints

## UI Layer [role:ui-designer] [depends-on:api-layer]
- [ ] Create LoginForm component
- [ ] Create SignupForm component
- [ ] Create OAuthButtons component (Google, GitHub)
- [ ] Create AuthLayout component
- [ ] Create ProtectedRoute wrapper component
- [ ] Add loading and error states for all auth forms

## Testing [role:testing-engineer] [depends-on:ui-layer]
- [ ] Write unit tests for auth API endpoints
- [ ] Write integration tests for signup flow
- [ ] Write integration tests for login flow
- [ ] Write integration tests for OAuth flow
- [ ] Write component tests for LoginForm
- [ ] Write component tests for SignupForm
- [ ] Write E2E test for complete authentication flow

## Documentation [delegate:chat-claude] [type:documentation] [output:auth-guide.md]
- [ ] Write authentication setup guide
- [ ] Document OAuth configuration steps
- [ ] Create troubleshooting guide for common auth issues
```

**User reviews and approves.**

**Context used:** ~1,400 tokens (orchestrator + stack skill)

---

## Executing Tasks

```bash
/execute-task
```

### Time 0: Parallel Kickoff

**Orchestrator:**
1. Parses tasks.md
2. Finds no dependencies for research and database
3. Kicks off in parallel:

```
├─ Delegates to Chat Claude (background):
│  └─ OAuth comparison research
│  └─ Auth best practices research
│
└─ Spawns database-engineer subagent
   └─ Fresh context: ~1,200 tokens
```

**database-engineer:**
```
1. Reads stack skill: stacks/supabase-vercel/SKILL.md
2. Reads standards: global/*, backend/*, testing/*
3. Reads spec: specs/2025-01-15-authentication/specs.md
4. Implements:
   - Creates migration: 20250115_create_auth_schema.sql
   - Adds RLS policies
   - Creates helper functions
5. Runs tests
6. Updates tasks.md (marks tasks [x])
7. Creates report: implementation/01-database-layer.md
8. EXITS (context freed)
```

**Chat Claude (background):**
```
├─ Researches OAuth providers
├─ Compares: Google, GitHub, Microsoft
├─ Analyzes pros/cons, pricing, setup complexity
└─ Saves: delegated-results/oauth-comparison.md
```

---

### Time N: Sequential (API Layer)

**Orchestrator:**
- database-engineer completed
- Sees `[depends-on:database-layer]` for API layer
- Spawns api-engineer

**api-engineer:**
```
Fresh context: ~1,500 tokens

1. Reads stack skill
2. Reads standards
3. Reads spec + database schema (just created)
4. Implements:
   - POST /api/auth/signup (uses Supabase Auth)
   - POST /api/auth/login
   - POST /api/auth/logout
   - POST /api/auth/oauth/callback
   - Authentication middleware
   - Rate limiting
5. Runs tests
6. Updates tasks.md
7. Creates report: implementation/02-api-layer.md
8. EXITS (context freed)
```

---

### Time M: UI Layer

**Orchestrator:**
- api-engineer completed
- Retrieves Chat Claude research (now complete)
- Spawns ui-designer

**ui-designer:**
```
Fresh context: ~1,300 tokens

1. Reads stack skill (Next.js, Tailwind conventions)
2. Reads standards (global/*, frontend/*, testing/*)
3. Reads spec + OAuth research results
4. Implements:
   - components/auth/LoginForm.tsx
   - components/auth/SignupForm.tsx
   - components/auth/OAuthButtons.tsx
   - components/auth/AuthLayout.tsx
   - components/auth/ProtectedRoute.tsx
   - Responsive design (mobile-first)
   - Loading and error states
   - Accessibility (ARIA labels, keyboard nav)
5. Runs tests (component tests)
6. Updates tasks.md
7. Creates report: implementation/03-ui-layer.md
8. EXITS (context freed)
```

---

### Time P: Testing

**Orchestrator:**
- ui-designer completed
- Spawns testing-engineer

**testing-engineer:**
```
Fresh context: ~1,100 tokens

1. Reads stack skill (Jest, React Testing Library)
2. Reads standards (testing/*)
3. Reads all implemented code
4. Implements:
   - tests/api/auth.test.ts (API endpoint tests)
   - tests/integration/signup.test.ts
   - tests/integration/login.test.ts
   - tests/integration/oauth.test.ts
   - tests/components/LoginForm.test.tsx
   - tests/components/SignupForm.test.tsx
   - tests/e2e/authentication.spec.ts
5. Runs full test suite
6. Checks coverage (>80%)
7. Updates tasks.md
8. Creates report: implementation/04-testing.md
9. EXITS (context freed)
```

---

### Time Q: Verification

**Orchestrator:**
- All implementation complete
- Spawns verifiers in parallel

**backend-verifier:**
```
Fresh context: ~1,800 tokens

1. Reads stack skill
2. Reads standards (global/*, backend/*, testing/*)
3. Reviews:
   - Database migrations
   - API endpoints
   - Business logic
   - Test coverage
4. Checks:
   - Standards compliance ✅
   - Security (SQL injection, auth) ✅
   - Error handling ✅
   - Test coverage: 87% ✅
5. Creates: verification/backend-verification.md
6. Status: APPROVED
7. EXITS
```

**frontend-verifier:**
```
Fresh context: ~1,600 tokens

1. Reads stack skill
2. Reads standards (global/*, frontend/*, testing/*)
3. Reviews:
   - React components
   - Styling implementation
   - User interactions
4. Checks:
   - Responsive design ✅
   - Accessibility ✅
   - Component tests ✅
   - Loading/error states ✅
   - Test coverage: 91% ✅
5. Creates: verification/frontend-verification.md
6. Status: APPROVED
7. EXITS
```

---

### Time R: Delegation Completion

**Orchestrator:**
- Retrieves completed Chat Claude tasks:
  - `delegated-results/oauth-comparison.md`
  - `delegated-results/auth-guide.md` (documentation task)
- Updates tasks.md (marks delegated tasks [x])

---

## Final Summary

**Orchestrator presents:**

```
✅ Authentication feature COMPLETE

Implementation Reports:
  • 01-database-layer.md
  • 02-api-layer.md
  • 03-ui-layer.md
  • 04-testing.md

Verification Reports:
  • backend-verification.md (APPROVED)
  • frontend-verification.md (APPROVED)

Delegated Results:
  • oauth-comparison.md
  • auth-guide.md

Test Coverage:
  • Backend: 87%
  • Frontend: 91%
  • Overall: 89% ✅

Files Created: 23
Lines of Code: 1,847
Tests Written: 34
All Tests: PASSING ✅

Next Steps:
  1. Review OAuth provider recommendation
  2. Deploy to staging
  3. Test OAuth flows manually
  4. Update roadmap
```

---

## Context Usage Summary

| Agent | Peak Context | Duration |
|-------|-------------|----------|
| Orchestrator | ~500 tokens | Entire time |
| database-engineer | ~1,200 tokens | 5 minutes → EXIT |
| api-engineer | ~1,500 tokens | 8 minutes → EXIT |
| ui-designer | ~1,300 tokens | 7 minutes → EXIT |
| testing-engineer | ~1,100 tokens | 4 minutes → EXIT |
| backend-verifier | ~1,800 tokens | 3 minutes → EXIT |
| frontend-verifier | ~1,600 tokens | 3 minutes → EXIT |
| Chat Claude | N/A (background) | Entire time |

**Peak Context at Any Time:** ~1,800 tokens
**Total Implementation Time:** ~30 minutes
**Context Savings vs Single Agent:** ~90%

---

## What Just Happened?

1. ✅ **Parallel execution** - Research ran while implementation happened
2. ✅ **Context isolation** - Each agent started fresh, no bloat
3. ✅ **Specialization** - Right agent for right task
4. ✅ **Quality control** - Built-in verification caught issues
5. ✅ **Standards compliance** - All code follows conventions
6. ✅ **Complete feature** - Database → API → UI → Tests → Docs
7. ✅ **No context overflow** - Peak only 1,800 tokens!

---

## Compare to Before Hybrid

**Single Agent (Old Way):**
```
Start:           1,000 tokens
After DB:        8,000 tokens
After API:      16,000 tokens
After UI:       26,000 tokens  ⚠️
After Testing:  35,000 tokens  ⚠️ CONTEXT OVERFLOW
Verification:   IMPOSSIBLE ❌
```

**Hybrid (New Way):**
```
Orchestrator:      500 tokens (always)
Each subagent:  1,000-1,800 tokens → EXITS
Peak context:    1,800 tokens ✅
All phases:      COMPLETED ✅
```

---

## Try It Yourself!

1. Install Agent-OS 2.0 Hybrid
2. Run through this example
3. Observe context usage
4. Watch subagents spawn and exit
5. Review the quality of implementation and verification reports

**Welcome to the future of agentic development!** 🚀
