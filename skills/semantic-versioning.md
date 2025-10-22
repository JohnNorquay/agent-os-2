# Semantic Versioning Skill

## Purpose
Patterns for semantic versioning, conventional commits, and automated releases in IntegrationDirector.

---

## Version Format

**MAJOR.MINOR.PATCH** (e.g., 1.2.3)

- **MAJOR** (1.x.x): Breaking changes, incompatible API changes
- **MINOR** (x.1.x): New features, backwards-compatible
- **PATCH** (x.x.1): Bug fixes, backwards-compatible

**Pre-release**: `1.0.0-alpha.1`, `1.0.0-beta.2`, `1.0.0-rc.1`

**Starting Version**: `0.1.0` (development), `1.0.0` (production-ready)

---

## Commit Message Format

```
<type>(<scope>): <subject>

<optional body>

<optional footer>
```

### Types (determines version bump)

| Type | Bump | Example |
|------|------|---------|
| `feat` | MINOR | `feat(frontend): add driver tracking` |
| `fix` | PATCH | `fix(auth): resolve token refresh` |
| `feat!` or `BREAKING CHANGE:` | MAJOR | `feat(api)!: redesign vessel endpoint` |
| `docs`, `style`, `refactor`, `test`, `chore` | NONE | `docs: update README` |

### Scopes
Common scopes: `frontend`, `backend`, `api`, `auth`, `db`, `ui`, `deps`

---

## Examples

```bash
# Feature - MINOR bump (0.1.0 → 0.2.0)
git commit -m "feat(frontend): add real-time vessel tracking"
git commit -m "feat(backend): implement Vessey API integration"

# Bug fix - PATCH bump (0.1.0 → 0.1.1)
git commit -m "fix(auth): resolve token expiration issue"
git commit -m "fix(ui): correct mobile layout on iOS"

# Breaking change - MAJOR bump (0.1.0 → 1.0.0)
git commit -m "feat(api)!: redesign vessel endpoints

BREAKING CHANGE: vessel endpoint returns normalized structure"

# No version bump
git commit -m "docs: update setup instructions"
git commit -m "chore(deps): update dependencies"
git commit -m "refactor(auth): simplify token logic"
```

---

## Release Commands

### Standard-Version (Manual)

```bash
# Automatic version bump based on commits
npm run release

# Force specific bump
npm run release:patch   # 0.1.0 → 0.1.1
npm run release:minor   # 0.1.0 → 0.2.0
npm run release:major   # 0.1.0 → 1.0.0

# Pre-release
npm run release -- --prerelease alpha  # 0.1.0 → 0.1.1-alpha.0

# First release
npm run release -- --first-release
```

### What happens when you run `npm run release`:
1. Analyzes commits since last tag
2. Determines version bump
3. Updates `package.json`, `pyproject.toml`
4. Generates/updates `CHANGELOG.md`
5. Creates git commit: `chore(release): v0.2.0`
6. Creates git tag: `v0.2.0`

### After release:
```bash
git push --follow-tags origin main
```

---

## Release Workflow

```bash
# 1. Develop feature
git checkout -b feat/vessel-monitoring
# make changes
git commit -m "feat(frontend): add vessel monitoring dashboard"
git push origin feat/vessel-monitoring

# 2. Create PR on GitHub → merge to main

# 3. Create release (on main branch)
git checkout main
git pull
npm run release
git push --follow-tags origin main

# 4. GitHub Actions automatically deploys
```

---

## Configuration Files

### `.versionrc.json` - Changelog Configuration
```json
{
  "types": [
    {"type": "feat", "section": "Features"},
    {"type": "fix", "section": "Bug Fixes"},
    {"type": "perf", "section": "Performance"},
    {"type": "refactor", "section": "Refactoring"}
  ]
}
```

### `.commitlintrc.json` - Commit Validation
```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [2, "always", [
      "feat", "fix", "docs", "style", 
      "refactor", "perf", "test", "chore", "ci"
    ]]
  }
}
```

### `package.json` - Scripts
```json
{
  "scripts": {
    "release": "standard-version",
    "release:minor": "standard-version --release-as minor",
    "release:major": "standard-version --release-as major",
    "release:patch": "standard-version --release-as patch"
  }
}
```

---

## Version Display

### Frontend (React)
```typescript
// src/version.ts (auto-generated on build)
export const VERSION_INFO = {
  version: "0.2.0",
  buildDate: "2025-10-21T10:30:00Z",
  gitCommit: "a1b2c3d"
};

// Component
import { VERSION_INFO } from '@/version';

<div>v{VERSION_INFO.version}</div>
```

### Backend (FastAPI)
```python
# api/__init__.py
__version__ = "0.2.0"

@app.get("/version")
async def version():
    return {"version": __version__}
```

---

## GitHub Workflow (Automated)

### `.github/workflows/release.yml`
```yaml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run release
      - run: git push --follow-tags
```

---

## Branch Strategy

```
main (protected)
  ↓
feature/driver-tracking
feature/vessel-alerts
fix/auth-bug
hotfix/critical-issue
```

**Branch naming**:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `hotfix/description` - Urgent production fixes

**Protection**: Require PR reviews, status checks before merging to `main`

---

## Changelog Format (Auto-generated)

```markdown
# Changelog

## [0.2.0] - 2025-10-21

### Features
* **frontend:** add vessel monitoring dashboard ([a1b2c3d])
* **backend:** implement Vessey API integration ([e4f5g6h])

### Bug Fixes
* **auth:** resolve token refresh issue ([i7j8k9l])

## [0.1.0] - 2025-10-20

### Features
* **frontend:** initial React setup
* **backend:** FastAPI with Supabase
```

---

## Quick Reference

```bash
# Daily workflow
git checkout -b feat/my-feature
git commit -m "feat(scope): description"
git push origin feat/my-feature
# → Create PR → Merge

# Release
git checkout main && git pull
npm run release
git push --follow-tags origin main

# Check version
cat package.json | grep version
```

---

## Common Issues

**Issue**: "Version not bumping"  
**Fix**: Ensure commits use conventional format (`feat:`, `fix:`)

**Issue**: "Tag already exists"  
**Fix**: Delete tag: `git tag -d v0.1.0 && git push origin :refs/tags/v0.1.0`

**Issue**: "CHANGELOG not updating"  
**Fix**: Check `.versionrc.json` configuration

---

## Integration with Agent-OS

When generating code that needs versioning:
- Use conventional commit format
- Reference version in API responses
- Display version in UI
- Update version in deployment workflows

**Example**: When creating new feature, Agent-OS should generate:
1. Code with proper structure
2. Test files
3. Conventional commit message
4. Version update if needed
