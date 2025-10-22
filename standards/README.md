# Agent-OS 2.0 Standards

## Overview
Standards are organized by scope and loaded by subagents based on their role assignments. This keeps context windows lean while ensuring consistency.

## Directory Structure

```
standards/
├── global/           # Standards that apply to ALL code
│   ├── coding-style.md
│   ├── error-handling.md
│   └── ...
├── backend/          # Backend-specific standards
│   ├── api-design.md
│   ├── database.md
│   └── ...
├── frontend/         # Frontend-specific standards
│   ├── components.md
│   ├── styling.md
│   └── ...
└── testing/          # Testing standards
    ├── test-writing.md
    └── ...
```

## How Standards Are Loaded

### By Implementer Subagents

Each implementer loads only relevant standards:

**database-engineer:**
- global/*
- backend/*
- testing/*

**api-engineer:**
- global/*
- backend/*
- testing/*

**ui-designer:**
- global/*
- frontend/*
- testing/*

**testing-engineer:**
- global/*
- testing/*

### By Verifier Subagents

**backend-verifier:**
- global/*
- backend/*
- testing/*

**frontend-verifier:**
- global/*
- frontend/*
- testing/*

## Creating New Standards

### When to Add a Standard
- When you find yourself repeating the same guidance
- When a pattern should be consistent across the project
- When there's a common pitfall to avoid

### How to Add a Standard
1. Choose the appropriate directory (global, backend, frontend, testing)
2. Create a markdown file with a clear name
3. Structure: Overview → Principles → Patterns → Examples → Quick Reference
4. Update role files if needed (roles/implementers.yml or roles/verifiers.yml)

### Standard Template
```markdown
# [Standard Name]

## Overview
[Brief description of what this standard covers]

## Core Principles
[2-4 key principles]

## Patterns
[Recommended approaches with examples]

## Anti-Patterns
[What NOT to do]

## Quick Reference
[Checklist or summary]
```

## Stack Integration

Standards work WITH stack-specific patterns, not against them:

1. **Stack skills define HOW** (which framework, which patterns)
2. **Standards define QUALITY** (consistency, error handling, testing)

When stack patterns and standards overlap, stack patterns take precedence for technical implementation, but standards guide quality attributes.

## Current Standards

### Global (All Agents)
- `coding-style.md` - Naming, formatting, structure
- `error-handling.md` - Error patterns and logging

### Backend
(Add backend-specific standards here as needed)

### Frontend
(Add frontend-specific standards here as needed)

### Testing
- `test-writing.md` - Testing philosophy and patterns

## Best Practices

### For Standard Writers
- Be concise but comprehensive
- Provide clear examples
- Explain the "why" not just the "what"
- Include anti-patterns (what NOT to do)
- Keep it actionable

### For Implementers
- Read relevant standards before implementing
- Follow standards consistently
- Ask questions if standards are unclear
- Suggest improvements to standards

### For Verifiers
- Check standards compliance during verification
- Note specific standard violations in reports
- Distinguish between style preferences and standard violations

---

**Remember**: Standards enable quality at scale. They're living documents that should evolve with your project.
