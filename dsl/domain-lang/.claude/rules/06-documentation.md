# Documentation Standards

## Documentation Philosophy

All documentation should follow **Google's Technical Writing Style Guide**:
- Use **active voice** and **present tense**
- Define terminology clearly
- Write concisely and logically
- Present information in logical order
- Use lists and tables for readability

## Documentation Locations

### Code Documentation

**JSDoc comments** for all public APIs (shown in IDE hover tooltips):

```typescript
/**
 * Resolves an import URL to a file URI using the workspace's GitUrlResolver.
 *
 * Supports multiple import formats:
 * - Local files: `./shared/types.dlang`
 * - Workspace-relative: `~/contexts/sales.dlang`
 * - GitHub packages: `owner/repo@v1.0.0`
 * - Git URLs: `https://gitlab.com/owner/repo@v1.0.0`
 *
 * @param importUrl - The import URL string from the import statement
 * @returns A resolved file URI pointing to the imported file
 * @throws {ImportError} When the URL format is invalid or file cannot be found
 *
 * @example
 * ```typescript
 * const uri = await resolver.resolveImport('owner/repo@v1.0.0');
 * ```
 */
async resolveImport(importUrl: string): Promise<URI> {
    // implementation
}
```

### Project Documentation

**Location:** `docs/` directory

- Language specification
- Grammar documentation
- User guides
- Architecture decisions (ADRs)
- Migration guides

### User-Facing Documentation

**Location:** `README.md` in repository root

- Quick start guide
- Installation instructions
- Basic usage examples
- Links to full documentation

### Examples

**Location:** `static/` directory

- Example `.dlang` files
- Common patterns
- Best practices
- Use cases

## JSDoc Standards

### Required Tags

For public APIs:
- `@param` - Describe each parameter with type and purpose
- `@returns` - Describe return value
- `@throws` - Document exceptions that can be thrown
- `@example` - Show usage example (especially for complex APIs)

### Optional Tags

- `@deprecated` - Mark deprecated APIs with migration path
- `@see` - Link to related functions/classes
- `@since` - Version when added
- `@internal` - Mark internal APIs (not for public use)

### JSDoc Examples

#### Function Documentation

```typescript
/**
 * Validates a domain for circular references in its parent hierarchy.
 *
 * Traverses the parent domain chain using the `parentDomain` reference
 * and detects cycles. Reports an error diagnostic if a cycle is found.
 *
 * @param domain - The domain to validate
 * @param accept - Validation acceptor for reporting diagnostics
 *
 * @example
 * ```typescript
 * checkDomainCircularReference(domain, accept);
 * ```
 */
checkDomainCircularReference(
    domain: Domain,
    accept: ValidationAcceptor
): void {
    // implementation
}
```

#### Class Documentation

```typescript
/**
 * Resolves import statements using workspace-aware Git URL resolution.
 *
 * The ImportResolver handles multiple import formats including local files,
 * workspace-relative paths, and Git-based packages (GitHub, GitLab).
 *
 * It maintains a lock file for reproducible builds and verifies integrity
 * hashes for remote packages.
 *
 * @see {@link WorkspaceManager} for lock file management
 * @see {@link GitUrlResolver} for URL parsing and resolution
 */
export class ImportResolver {
    // implementation
}
```

#### Deprecated API

```typescript
/**
 * Gets the domain name (deprecated).
 *
 * @deprecated Use `domain.name` directly instead. This helper will be
 * removed in v2.0.0.
 *
 * @param domain - The domain node
 * @returns The domain name
 */
function getDomainName(domain: Domain): string {
    return domain.name;
}
```

## Grammar Documentation

### Inline Grammar Comments

Document grammar rules with **JSDoc-style comments** that appear in hover tooltips:

```langium
/**
 * A Domain represents a sphere of knowledge, influence, or activity.
 *
 * In DDD, it is the subject area to which the user applies a program.
 * Domains can be nested using the `in` keyword to show subdomain hierarchy.
 *
 * @example
 * ```dlang
 * Domain Sales {
 *     vision: "Handle all sales operations"
 * }
 *
 * Domain OrderManagement in Sales {
 *     description: "Manage order lifecycle"
 * }
 * ```
 */
Domain:
    'Domain' name=ID ('in' parentDomain=[Domain:QualifiedName])?
    '{'
        documentation+=DomainDocumentationBlock*
    '}';
```

### Grammar Documentation File

**Location:** `docs/grammar.md`

Document:
- All grammar rules and their purpose
- Syntax examples for each construct
- Semantic meaning and constraints
- Evolution history for breaking changes

## README Structure

### Repository Root README

```markdown
# DomainLang

Brief description (1-2 sentences)

[![Tests](badge-url)](link) [![Version](badge-url)](link)

## Quick Start

Minimal getting-started example

## Installation

How to install

## Usage

Basic usage examples

## Features

Key features list

## Documentation

Links to full docs

## Contributing

How to contribute

## License

License information
```

### Package README

```markdown
# Package Name

Description

## Installation

## API

## Examples

## License
```

## Writing Style

### Active Voice

```
✅ The validator detects circular references
❌ Circular references are detected by the validator

✅ Use the import statement to include external files
❌ External files can be included using the import statement
```

### Present Tense

```
✅ The parser generates an AST from the input
❌ The parser will generate an AST from the input

✅ This function returns the domain name
❌ This function returned the domain name
```

### Concise and Clear

```
✅ Use the `in` keyword to nest domains
❌ When you want to express that a domain is a subdomain of another
   domain, you can use the `in` keyword to establish that relationship

✅ Returns the resolved URI
❌ This function is responsible for returning the resolved URI that
   corresponds to the import statement
```

### Define Terminology

```
✅ A **Bounded Context** is a boundary within which a domain model is
   defined and applicable. It's a central pattern in DDD for managing
   complexity by isolating models.

❌ Use bounded contexts to manage your models.
```

### Use Lists and Tables

```
✅ Supported import formats:
   - Local files: `./types.dlang`
   - GitHub packages: `owner/repo@v1.0.0`
   - Git URLs: `https://gitlab.com/owner/repo@v1.0.0`

❌ You can import local files like ./types.dlang or GitHub packages
   like owner/repo@v1.0.0 or Git URLs like https://...
```

## Code Examples in Documentation

### Format

Use **triple backticks** with language identifier:

````markdown
```typescript
const domain: Domain = {
    name: 'Sales',
    description: 'Sales operations'
};
```

```dlang
Domain Sales {
    vision: "Handle all sales operations"
}
```
````

### Guidelines

- Keep examples **minimal and focused**
- Include **context** when needed
- Show **common use cases** first
- Include **error handling** in complex examples
- Provide **complete, runnable** examples when possible

## Architecture Decision Records (ADRs)

### Location

`docs/adr/` directory

### Format

```markdown
# ADR-001: Git-Native Import System

## Status
Accepted

## Context
Users need to share .dlang files across projects. npm packages are
too heavyweight and require separate publication workflow.

## Decision
Implement Git-native imports inspired by Go modules and Deno, allowing
direct imports from GitHub/GitLab repositories using version tags.

## Consequences
### Positive
- No need for npm publication workflow
- Direct versioning with Git tags
- Simpler dependency management

### Negative
- Requires Git installation
- More complex URL resolution
- Network calls for remote imports

## Alternatives Considered
1. npm packages - rejected due to publication overhead
2. Local-only imports - rejected due to lack of sharing
```

## Migration Guides

When introducing breaking changes, provide migration guides:

### Location

`docs/migrations/` directory

### Format

```markdown
# Migration Guide: v0.x to v1.0

## Breaking Changes

### Keyword Rename: `partof` → `in`

**Before:**
```dlang
Domain Child partof Parent {}
```

**After:**
```dlang
Domain Child in Parent {}
```

**Migration:**
Run the migration tool:
```bash
domain-lang-cli migrate --from 0.x --to 1.0
```

Or manually replace `partof` with `in` in all `.dlang` files.

## Deprecated Features

### `BoundedContext` Keyword

**Status:** Deprecated in v1.0, will be removed in v2.0

**Before:**
```dlang
BoundedContext Orders for Sales {}
```

**After:**
```dlang
Context Orders for Sales {}
```

**Action:** Update to `Context` keyword. The old keyword will continue
to work with a deprecation warning until v2.0.
```

## Changelog

### Location

`CHANGELOG.md` in repository root

### Format

Follow [Keep a Changelog](https://keepachangelog.com/):

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Git-native import system for remote packages
- Lock file (domain.lock) for reproducible builds

### Changed
- Renamed `partof` keyword to `in` for domain hierarchy

### Deprecated
- `BoundedContext` keyword (use `Context` instead)

### Removed
- None

### Fixed
- Circular domain reference detection now handles mutual references

### Security
- Added integrity verification for remote imports

## [0.1.0] - 2024-01-15

### Added
- Initial release
- Basic grammar for domains and contexts
- VS Code extension with LSP support
```

## Documentation Maintenance

### When to Update

Update documentation when:
- Adding new features
- Changing public APIs
- Introducing breaking changes
- Fixing bugs that affect documented behavior
- Improving existing features

### Review Checklist

Before committing:
- [ ] JSDoc updated for changed functions
- [ ] Examples still work
- [ ] README reflects current state
- [ ] Migration guide provided for breaking changes
- [ ] Changelog updated
- [ ] Grammar comments updated if .langium changed

## External Documentation

### Online Documentation

For user-facing docs, consider:
- GitHub Pages
- Read the Docs
- Documentation site (VitePress, Docusaurus)

### API Documentation

Generate from JSDoc:
```bash
npm run docs:generate
```

Use TypeDoc or similar for TypeScript API docs.

## Documentation Anti-Patterns

### ❌ Outdated Examples

```
❌ (Example uses deprecated API)
```

Keep examples up-to-date or remove them.

### ❌ Assumed Knowledge

```
❌ "Use the scope provider to resolve the reference"
```

Explain what a scope provider is or link to explanation.

### ❌ Missing Context

```
❌ "Call this function after parsing"
```

Explain why and what happens if you don't.

### ❌ Passive Voice

```
❌ "The domain is validated by the validator"
✅ "The validator checks the domain for errors"
```

### ❌ Future Tense

```
❌ "This will parse the document"
✅ "This parses the document"
```

## Quick Reference

### JSDoc Template

```typescript
/**
 * [One-line summary]
 *
 * [Detailed description explaining purpose, behavior, and any important
 * considerations]
 *
 * @param [name] - [Description]
 * @param [name] - [Description]
 * @returns [Description of return value]
 * @throws {[ErrorType]} [When this error occurs]
 *
 * @example
 * ```typescript
 * [Usage example]
 * ```
 */
```

### Grammar Comment Template

```langium
/**
 * [One-line description of what this rule represents]
 *
 * [Detailed explanation of semantics and usage]
 *
 * @example
 * ```dlang
 * [Syntax example]
 * ```
 */
RuleName:
    // rule definition
;
```
