---
description: 'Documentation standards for DomainLang including JSDoc, Markdown, and technical writing guidelines'
applyTo: "**/*.md"
---

# Documentation Standards

> Guidelines for creating effective documentation in DomainLang. Based on Google's Technical Writing Style Guide principles.

## Core Intent

- Write documentation that helps users accomplish tasks
- Explain WHY, not just WHAT
- Keep examples minimal, focused, and tested
- Update documentation when code changes

## Writing Style

- Use **active voice** and **present tense**
- Write in imperative mood ("Use", "Implement", "Avoid")
- Be concise; eliminate unnecessary words
- Define terminology on first use
- Use lists and tables for scannable content

```markdown
✅ The validator detects circular references
❌ Circular references are detected by the validator

✅ This function returns the domain name
❌ This function will return the domain name
```

## JSDoc for Public APIs

Document all public functions with JSDoc (appears in IDE hover):

```typescript
/**
 * Resolves an import URL to a file URI.
 *
 * Supports: `./file.dlang`, `~/file.dlang`, `owner/repo@v1.0.0`
 *
 * @param importUrl - The import URL string
 * @returns Resolved file URI
 * @throws {ImportError} When URL format is invalid
 *
 * @example
 * ```typescript
 * const uri = await resolver.resolveImport('owner/repo@v1.0.0');
 * ```
 */
async resolveImport(importUrl: string): Promise<URI> { }
```

### Required JSDoc Tags

- `@param` - Each parameter with purpose
- `@returns` - Return value description
- `@throws` - Exceptions that can be thrown
- `@example` - Usage example for complex APIs

### Optional JSDoc Tags

- `@deprecated` - Mark deprecated APIs with migration path
- `@see` - Link to related functions
- `@internal` - Mark internal APIs

## Grammar Documentation

Document grammar rules with JSDoc-style comments for hover tooltips:

```langium
/**
 * A Domain represents a sphere of knowledge or activity in DDD.
 *
 * @example
 * ```dlang
 * Domain Sales { vision: "Handle sales operations" }
 * Domain OrderManagement in Sales { }
 * ```
 */
Domain:
    'Domain' name=ID ('in' parentDomain=[Domain:QualifiedName])?
    '{' documentation+=DomainDocumentationBlock* '}';
```

## Documentation Locations

| Type | Location | Purpose |
|------|----------|---------|
| API docs | JSDoc in source | IDE hover tooltips |
| User guides | `dsl/domain-lang/docs/` | Language documentation |
| Examples | `dsl/domain-lang/examples/` | `.dlang` patterns |
| ADRs | `adr/` | Architecture decisions |
| Changelog | `dsl/domain-lang/CHANGELOG.md` (create if missing) | Version history |

## Formatting Guidelines

- **Headings**: Use `##` for H2, `###` for H3 in hierarchical order
- **Lists**: Use `-` for bullets, `1.` for numbered steps
- **Code blocks**: Use triple backticks with language identifier
- **Tables**: Align columns, include headers
- **Whitespace**: Single blank line between sections

## Code Examples

- Keep examples **minimal and focused**
- Show **common use cases** first
- Include **error handling** when relevant
- Use **triple backticks** with language identifier
- **Test all examples** before committing

````markdown
```typescript
const domain: Domain = { name: 'Sales' };
```

```dlang
Domain Sales { vision: "Handle sales" }
```
````

## README Structure

```markdown
# Package Name

Brief description (1-2 sentences)

## Installation

## Usage

## API

## License
```

## Changelog Format

Follow [Keep a Changelog](https://keepachangelog.com/):

```markdown
## [Unreleased]

### Added
- New feature description

### Changed
- Modified behavior

### Fixed
- Bug fix description
```

## Architecture Decision Records (ADRs)

Location: `adr/` directory

```markdown
# ADR-001: Git-Native Import System

## Status
Accepted

## Context
Users need to share .dlang files across projects.

## Decision
Implement Git-native imports (like Go modules/Deno).

## Consequences
### Positive
- No npm publication overhead
- Direct versioning with Git tags

### Negative
- Requires Git installation
- Network calls for remote imports
```

## Migration Guides

When introducing breaking changes, provide migration guides in `dsl/domain-lang/docs/migrations/` (create if missing):

```markdown
# Migration: v0.x to v1.0

## Breaking Changes

### Keyword Rename: `partof` → `in`

**Before:** `Domain Child partof Parent {}`
**After:** `Domain Child in Parent {}`

**Migration:** Replace `partof` with `in` in all `.dlang` files.
```

## When to Update Documentation

### Trigger Conditions

Automatically update documentation when:

- **New features** — Add feature description to user guides
- **API changes** — Update JSDoc and API reference
- **Breaking changes** — Create migration guide, update changelog
- **Configuration changes** — Document new options, environment variables
- **Grammar changes** — Update language.md, quick-reference.md, grammar comments
- **Error messages change** — Update troubleshooting guides

### Documentation Review Checklist

Before committing:
- [ ] JSDoc updated for all changed functions
- [ ] Code examples tested and working
- [ ] Grammar comments updated if `.langium` changed
- [ ] Changelog entry added
- [ ] Links validated (no broken references)
- [ ] Terminology consistent with existing docs
- [ ] README reflects current project state

## Anti-Patterns

| ❌ Avoid | ✅ Instead |
|----------|----------|
| Outdated examples | Test examples during docs review |
| Passive voice ("is validated by") | Active voice ("The validator checks") |
| Future tense ("will parse") | Present tense ("parses") |
| Assumed knowledge | Define terms on first use |
| Missing context for WHY | Explain purpose before details |
| Verbose explanations | Concise, scannable content |
| Comments that repeat code | Comments that explain intent |

## Validation

Before committing documentation changes:

```bash
# Ensure code examples compile
npm run build

# Run tests to verify examples work
npm test
```

## Decision Framework

| Documentation Type | Location | Format |
|-------------------|----------|--------|
| API reference | JSDoc in source files | `@param`, `@returns`, `@example` |
| User guides | `dsl/domain-lang/docs/` | Markdown with examples |
| Architecture decisions | `adr/` | ADR template |
| Quick reference | README or docs folder | Tables and code snippets |
