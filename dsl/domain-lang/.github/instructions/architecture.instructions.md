# Architecture and Documentation Guidelines

## Project Goals

DomainLang is a Domain-Driven Design (DDD) modeling language inspired by [ContextMapper DSL](https://github.com/ContextMapper/context-mapper-dsl). It aims to be a more complete DDD specification language that serves as:

- **Diagrams-as-code** for DDD visualization
- **Semantic model** for domain-driven architectures
- **Compilable specification** with rich IDE support

## Repository Structure

The repository is an npm workspace with multiple packages:

- `package.json` – root workspace definition with shared scripts and tooling config
- `packages/language` – Langium grammar (`src/domain-lang.langium`), language services, tests, and generated artifacts (in `src/generated`)
- `packages/cli` – Node-based CLI that consumes the language services
- `packages/extension` – VS Code extension implementing the DomainLang LSP client
- `packages/demo` – Vite-powered browser demo bundling the language
- `docs/`, `examples/`, `images/` – Documentation set, sample models, and shared assets consumed by the packages

### Key Objectives

- Provide excellent IDE experience with code completion and LSP features
- Work seamlessly with VS Code
- Support diagramming through GraphViz or similar tools
- Offer browser-based UI for model exploration

## Quality Standards

### Required Practices

- **TypeScript strict mode** - No exceptions
- **Regenerate grammar** - Run `npm run langium:generate` after grammar changes
- **Build verification** - Run `npm run build` to verify changes
- **Test coverage** - Use LangiumTest suites for language features
- **Version control** - Use SemVer for language versioning
- **CLI compatibility** - Warn on incompatible grammar revisions

### Documentation Requirements

- Maintain all project documentation in `docs/`
- Include DSL documentation and examples
- Update README when public APIs change
- Maintain changelog for grammar evolution
- Follow Google's Technical Writing Style Guide for all docs

## Language Specifications

### File Extension

- Official extension: `.dlang`
- Register in Langium's LanguageMetaData

### Core Grammar Elements

Define block-based readable syntax for:
- `Domain` - Domain definitions
- `BoundedContext` - Context boundaries
- `Classification` - Strategic tags and reusable labels
- `Team` - Ownership declarations
- `ContextMap` - Context relationships
- `DomainMap` - Domain portfolios
- `ContextGroup` - Strategic clustering
- `NamespaceDeclaration` - Hierarchical organization

### Namespace and Import System

Support nested `namespace` declarations and the import formats implemented in `ImportStatement`:
```dlang
namespace Strategic {
	Classification CoreDomain
}

import "./shared/types.dlang"
import "~/contexts/sales.dlang"
import "owner/repo@v1.0.0" as Patterns
```

Use fully qualified names (FQN) based on namespaces, e.g. `Strategic.CoreDomain` or `Company.Engineering.BackendTeam`.

### Scope Resolution Requirements

Implement `ScopeComputation` and `ScopeProvider` to resolve:
- References within and across namespaces
- Symbols from imported files
- npm-based `.dlang` modules

Ensure FQN disambiguation and avoid naming collisions.

### Validation Rules

Enforce validation for:
- Circular `Domain in` hierarchies that form cycles
- Invalid classifier assignments
- Duplicate identifiers within the same namespace scope
- Unresolved or ambiguous references

### LSP Feature Requirements

**Hover:** Display `description` fields and import origin for named entities

**Completion:** Context-aware suggestions for:
- Domain types in `implements`
- Classifications in `classifiers {}` blocks
- Known terms in `terminology {}`

**Other features:** Go-to-definition, diagnostics, semantic tokens, auto-import resolution

## CLI Requirements

Provide command-line interface with:

```bash
domainlang validate path/to/file.dlang
domainlang emit --format ts|json path/to/file.dlang
```

### Output Formats

Support emission as:
- TypeScript object tree
- JSON model
- Optional UML/Mermaid/GraphViz diagrams

## VS Code Extension Requirements

Scaffold using Langium CLI. Include:
- Diagnostics
- Semantic tokens
- Hover information
- Go-to-definition
- Auto-import resolution

## Testing Requirements

Use `LangiumTest` for unit tests covering:
- Parsing (happy path and edge cases)
- Scope resolution
- Validator behavior
- Error scenarios

## Publishing and Reuse

- Enable reuse by publishing `.dlang` modules as npm packages
- Support node-style module resolution
- Use FQN to avoid naming collisions in imported types

## Documentation Standards

Follow Google's Technical Writing Style Guide:
- Use active voice and present tense
- Define terminology clearly
- Write in a clear and concise manner
- Present information in logical order
- Use lists and tables for readability
