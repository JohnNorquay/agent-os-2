# Global Coding Style Standards

## Overview
These coding style standards apply to ALL code in Agent-OS 2.0 projects, regardless of stack or language. Follow your stack's specific conventions (defined in the stack skill) when these standards don't specify.

## General Principles

### 1. Consistency
- Follow existing patterns in the codebase
- When in doubt, match the style of surrounding code
- Don't mix styles within a single file

### 2. Readability
- Code is read more often than written
- Optimize for clarity, not cleverness
- Use descriptive names over comments when possible

### 3. Simplicity
- Prefer simple solutions over complex ones
- Avoid premature optimization
- Don't repeat yourself (DRY)

## File Organization

### File Structure
```
# Good: Organized sections
# Imports/requires at top
# Constants
# Helper functions
# Main code
# Exports at bottom

# Bad: Random order, mixed concerns
```

### File Length
- Keep files under 300 lines when possible
- Split large files into logical modules
- One primary concern per file

## Naming Conventions

### Stack-Specific
Defer to your stack skill for:
- File naming (camelCase, kebab-case, snake_case)
- Variable naming conventions
- Class/component naming

### Universal Rules
- Use descriptive names that reveal intent
- Avoid abbreviations unless universally understood (e.g., `id`, `url`, `api`)
- Boolean variables should read as questions: `isActive`, `hasPermission`, `canEdit`
- Functions should be verbs: `fetchUser`, `calculateTotal`, `validateInput`

**Examples:**
```javascript
// Good
const isUserAuthenticated = checkAuthStatus();
const activeUserCount = users.filter(u => u.isActive).length;

// Bad
const auth = check(); // What does this return?
const cnt = users.filter(u => u.active).length; // Avoid abbreviations
```

## Formatting

### Indentation
- Use 2 spaces (not tabs) unless stack specifies otherwise
- Maintain consistent indentation depth

### Line Length
- Aim for 80-100 characters per line
- Break long lines at logical points
- OK to exceed for strings, URLs, or when breaking would reduce readability

### Whitespace
- One blank line between logical sections
- No trailing whitespace
- One space after commas, colons (in objects)
- Spaces around operators: `a + b`, not `a+b`

### Brackets/Braces
Follow your stack's convention (same-line vs. new-line), but be consistent:

```javascript
// JavaScript/TypeScript: Same-line braces
function example() {
  if (condition) {
    doSomething();
  }
}

// Python: No braces needed
def example():
    if condition:
        do_something()
```

## Code Structure

### Functions/Methods
- Keep functions small (under 50 lines ideally)
- One responsibility per function
- Limit parameters (3-4 max; use objects for more)
- Return early to avoid deep nesting

**Example:**
```javascript
// Good: Early return
function processUser(user) {
  if (!user) return null;
  if (!user.isActive) return null;

  return performProcessing(user);
}

// Bad: Deep nesting
function processUser(user) {
  if (user) {
    if (user.isActive) {
      return performProcessing(user);
    }
  }
  return null;
}
```

### Classes/Components
- Single responsibility
- Composition over inheritance
- Keep constructor/initialization simple

### Modules
- Export only what's needed
- Group related exports
- Avoid circular dependencies

## Error Handling

See `error-handling.md` for detailed patterns, but in general:
- Handle errors at appropriate levels
- Don't swallow errors silently
- Provide context in error messages
- Use try-catch or stack-specific error handling

## Comments

### When to Comment
- Complex algorithms or business logic
- Non-obvious workarounds
- TODOs with context
- Public API documentation

### When NOT to Comment
- Don't explain what code does (use better names instead)
- Don't leave commented-out code
- Don't write obvious comments

**Examples:**
```javascript
// Good: Explains WHY
// Using exponential backoff because API rate limits are aggressive
const delay = Math.pow(2, retryCount) * 1000;

// Bad: Explains WHAT (code already shows this)
// Set delay to 2 to the power of retryCount times 1000
const delay = Math.pow(2, retryCount) * 1000;

// Good: Self-documenting
const millisecondsDelay = calculateExponentialBackoff(retryCount);

// No comment needed!
```

### Documentation Comments
Follow your stack's documentation style:
- JSDoc for JavaScript/TypeScript
- Docstrings for Python
- XML comments for C#
- etc.

## Code Organization Patterns

### Imports/Requires
```javascript
// Order:
// 1. External libraries
// 2. Absolute imports from your project
// 3. Relative imports

// Good
import React from 'react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from './Button';

// Bad: Mixed order
import { Button } from './Button';
import React from 'react';
import { api } from '@/lib/api';
```

### Constants
- Define constants at top of file or in separate constants file
- Use UPPER_SNAKE_CASE for true constants
- Group related constants

### Configuration
- Keep configuration separate from code
- Use environment variables for secrets
- Follow stack conventions for config files

## Version Control

### Commits
- Make atomic commits (one logical change)
- Write clear commit messages
- Don't commit debugging code, console logs, or commented code

### Branches
- Keep branches short-lived
- Sync with main/master frequently
- Delete branches after merging

## Performance Considerations

### Premature Optimization
- Don't optimize without measuring
- Profile before optimizing
- Readability > premature optimization

### Common Sense Optimizations
- Avoid unnecessary loops or re-renders
- Cache expensive computations when appropriate
- Lazy-load heavy resources
- Don't fetch data you don't need

## Security

### Never Commit
- API keys, tokens, secrets
- Passwords or credentials
- Private keys or certificates

### Always Validate
- User input
- API responses
- File uploads

### Follow Standards
- See `error-handling.md` for security error handling
- See `validation.md` for input validation patterns

## Stack-Specific Conventions

Always check your stack skill file for:
- File naming conventions
- Directory structure
- Framework-specific patterns
- Linting rules and configs
- Testing conventions

When stack standards and these global standards overlap, stack standards take precedence.

## Tooling

### Linters
- Use the linter specified in your stack
- Configure linter in project (`.eslintrc`, `.pylintrc`, etc.)
- Run linter before committing

### Formatters
- Use the formatter specified in your stack (Prettier, Black, etc.)
- Configure formatter in project
- Consider auto-format on save

### Type Checking
- Use TypeScript or type hints if stack supports it
- Run type checker in CI/CD
- Fix type errors; don't use `any`/`ignore` without good reason

## Quick Reference

✅ **DO:**
- Follow existing patterns
- Use descriptive names
- Keep functions small
- Handle errors properly
- Write comments for complex logic
- Be consistent

❌ **DON'T:**
- Mix styles in one file
- Use cryptic abbreviations
- Write giant functions
- Ignore errors
- Leave commented code
- Commit secrets

---

**Remember**: These are guidelines, not laws. Use judgment. When in doubt, ask yourself: "Will this be easy for someone else to understand in 6 months?"
