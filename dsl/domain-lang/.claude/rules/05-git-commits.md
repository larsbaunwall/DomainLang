# Git Workflow and Commit Conventions

## Commit Message Format

Use **conventional commit format** with two newlines after the title:

```
Add domain validation for circular references


This change introduces validation to detect and prevent circular
references in Domain.in relationships. The validator traverses
the parent domain chain and reports an error when a cycle is detected.

Fixes #123
```

### Structure

1. **Title** (imperative, no trailing punctuation)
2. **Two blank lines**
3. **Body** (motivation, context, breaking changes)
4. **Footer** (issue references, breaking changes)

## Title Guidelines

### Use Imperative Mood

```
✅ Add domain validation
✅ Fix circular reference detection
✅ Update grammar for imports
✅ Remove deprecated API
✅ Refactor scope computation

❌ Added domain validation
❌ Adds domain validation
❌ Adding domain validation
```

### No Trailing Punctuation

```
✅ Add import resolution
❌ Add import resolution.
❌ Add import resolution!
```

### Conventional Commit Prefixes

Optional but recommended:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring (no behavior change)
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks (deps, build, etc.)
- `perf:` - Performance improvements
- `style:` - Code style changes (formatting, etc.)

```
feat: Add Git-native import system
fix: Resolve circular domain detection bug
docs: Update CLAUDE.md with import examples
refactor: Simplify scope computation logic
test: Add validation tests for imports
chore: Update Langium to 4.1.0
perf: Cache scope computation results
```

## Body Guidelines

### Include Motivation

Explain **why** the change is needed, not just **what** changed:

```
✅ Good:
Add validation for circular domain references


Circular domain hierarchies cause infinite loops during scope
computation and lead to stack overflow errors. This validation
detects cycles early and provides a clear error message.

Users were experiencing cryptic crashes when accidentally
creating cycles. This validation prevents the issue at authoring
time rather than runtime.

Fixes #123

❌ Bad:
Add validation


Added a validator.
```

### Describe Breaking Changes

If the change breaks existing behavior:

```
Rename 'partof' to 'in' for domain hierarchy


BREAKING CHANGE: The 'partof' keyword has been renamed to 'in'
for better readability. Existing .dlang files must be updated.

Before:
    Domain Child partof Parent {}

After:
    Domain Child in Parent {}

Migration: Run `domain-lang-cli migrate` to auto-update files.
```

### Reference Issues

Link to relevant issues and PRs:

```
Fixes #123
Closes #456
Resolves #789
Related to #101
```

GitHub will automatically close referenced issues when the commit is merged.

## Commit Scope

### Keep Commits Focused

Each commit should represent **one logical change**:

```
✅ Good: Separate commits
    1. Add domain validation rule
    2. Add tests for domain validation
    3. Update documentation

❌ Bad: Single commit
    Add domain validation, tests, and docs
```

### When to Combine

Combine related changes if they're not useful separately:

```
✅ OK: Single commit
    Add ImportResolver service with tests

    The service and tests are tightly coupled and not useful
    separately. Including both in one commit.
```

## Branch Strategy

### Main Branch

- `main` - Stable, production-ready code
- All tests must pass before merging
- Use pull requests for all changes

### Feature Branches

```
feature/import-system
feature/domain-validation
fix/circular-reference-bug
docs/update-claude-rules
refactor/scope-computation
```

Naming: `type/description-with-hyphens`

### Development Workflow

1. Create feature branch from `main`
2. Make focused commits
3. Push branch
4. Create pull request
5. Address review comments
6. Squash or merge (project preference)

## Commit Frequency

### Commit Often

Make small, frequent commits while developing:

```
WIP: Start implementing import resolver
WIP: Add URL parsing logic
WIP: Add Git resolution
Add ImportResolver with Git URL support
```

### Clean Up Before Pushing

Squash or rebase WIP commits before pushing:

```
git rebase -i main
# Squash WIP commits into final commit
git push origin feature/import-system
```

## Commit Message Examples

### Feature Addition

```
feat: Add Git-native import system


Implements a Git-based import system inspired by Go modules and
Deno. Users can now import .dlang files from GitHub repositories,
GitLab, or local paths.

Supported formats:
- Local: import "./types.dlang"
- GitHub: import "owner/repo@v1.0.0"
- GitLab: import "https://gitlab.com/owner/repo@v1.0.0"

The system uses a lock file (domain.lock) for reproducible builds
and integrity checking.

Closes #45
```

### Bug Fix

```
fix: Prevent infinite loop in circular domain detection


The previous implementation didn't track visited nodes correctly,
leading to infinite loops for domains with mutual references.

Changed to use a Set for visited tracking and added early exit
when a cycle is detected.

Fixes #123
```

### Refactoring

```
refactor: Extract scope caching to WorkspaceCache


Scope computation was reimplementing caching logic in multiple
places. Extracted to WorkspaceCache service for consistency and
better invalidation logic.

No behavior change - pure refactoring.
```

### Documentation

```
docs: Add import system examples to CLAUDE.md


Added comprehensive examples for:
- Local file imports
- GitHub package imports
- Import aliases
- Named imports

This improves onboarding for new contributors working on the
import system.
```

### Breaking Change

```
feat!: Rename BoundedContext keyword to Context


BREAKING CHANGE: The 'BoundedContext' keyword has been shortened
to 'Context' for improved ergonomics. The old keyword is still
supported with a deprecation warning but will be removed in v2.0.

Before:
    BoundedContext Orders for Sales {}

After:
    Context Orders for Sales {}

Migration: Run `domain-lang-cli migrate` to auto-update.

Closes #67
```

### Performance Improvement

```
perf: Cache qualified name computation


Qualified names were being recomputed on every scope lookup,
causing significant performance degradation on large models.

Implemented WorkspaceCache-based caching with proper invalidation
on document changes. Performance improved by 10x on 1000+ element
models.

Benchmark results:
- Before: 2.5s for 1000 elements
- After: 0.25s for 1000 elements
```

## Tags and Versioning

### SemVer Tagging

Tag releases with SemVer format:

```
git tag -a v0.1.0 -m "Release v0.1.0: Initial public release"
git push origin v0.1.0
```

### Version Bumping

Follow SemVer (Semantic Versioning):

- **Major** (1.0.0 → 2.0.0): Breaking changes (grammar, API)
- **Minor** (0.1.0 → 0.2.0): New features (backward compatible)
- **Patch** (0.1.0 → 0.1.1): Bug fixes (backward compatible)

### Pre-release Versions

```
v0.1.0-alpha.1
v0.1.0-beta.1
v0.1.0-rc.1
```

## Pre-Commit Checklist

Before committing:

- [ ] Code compiles: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] Linter passes: `npm run lint`
- [ ] Grammar regenerated if `.langium` changed: `npm run langium:generate`
- [ ] Commit message follows conventions
- [ ] No sensitive data (API keys, tokens)
- [ ] No debug code (`console.log`, `debugger`)
- [ ] Documentation updated if needed

## Commit Anti-Patterns

### ❌ Vague Messages

```
❌ Update stuff
❌ Fix bug
❌ WIP
❌ asdf
❌ .
```

### ❌ Too Much in One Commit

```
❌ Add import system, refactor scoping, update docs, fix 3 bugs
```

### ❌ Incomplete Commits

```
❌ Add import resolver (but no tests)
❌ Update grammar (but didn't regenerate)
```

### ❌ Mixed Concerns

```
❌ Fix validation bug + refactor unrelated service + update deps
```

### ❌ Missing Context

```
❌ Title: Fix parser

    Body: Fixed it.
```

## Collaborative Workflow

### Pull Request Guidelines

1. **Create focused PRs** - One feature/fix per PR
2. **Write descriptive PR description** - What, why, how
3. **Link related issues** - Fixes #123
4. **Request reviews** from relevant maintainers
5. **Address feedback** promptly
6. **Keep PR updated** with main branch
7. **Squash commits** if requested before merging

### PR Description Template

```markdown
## Description
Brief description of the changes

## Motivation
Why is this change needed?

## Changes
- Added X
- Modified Y
- Removed Z

## Testing
How was this tested?

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Grammar regenerated if needed
- [ ] All tests pass
- [ ] No breaking changes (or documented)

Closes #123
```

## Rebase vs Merge

**Project preference:** Rebase for clean history

```bash
# Update feature branch with latest main
git checkout feature/import-system
git fetch origin
git rebase origin/main

# Resolve conflicts if any
git rebase --continue

# Force push (rewrites history)
git push origin feature/import-system --force-with-lease
```

Use `--force-with-lease` instead of `--force` for safety.

## Quick Reference

```bash
# Amend last commit
git commit --amend

# Interactive rebase (squash/reword)
git rebase -i HEAD~3

# Soft reset (undo commit, keep changes)
git reset --soft HEAD~1

# Hard reset (undo commit, discard changes)
git reset --hard HEAD~1

# Stash changes
git stash
git stash pop

# Cherry-pick commit
git cherry-pick <commit-hash>
```
