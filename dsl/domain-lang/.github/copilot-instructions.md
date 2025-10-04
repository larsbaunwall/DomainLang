# DomainLang

DomainLang is a Domain-Driven Design (DDD) modeling language that provides a compilable specification for domain architectures. It combines the power of a custom DSL with rich IDE tooling to enable diagrams-as-code and semantic domain modeling.

## What this project does

DomainLang helps developers and architects model domain-driven systems through:
- A Langium-based DSL for defining domains, bounded contexts, and relationships
- VS Code extension with full LSP support (completion, hover, validation, go-to-definition)
- CLI for validation and code generation (TypeScript, JSON, diagrams)
- Browser-based demo for exploring the language

Inspired by ContextMapper DSL, DomainLang aims to be a more complete DDD specification language with first-class IDE support.

## Tech stack

### Core language
- **Langium** - Parser generator and LSP framework for the DSL
- **TypeScript** - All implementation code
- **Node.js** - Runtime for CLI and language server

### Development tools
- **Vite** - Browser demo bundler
- **Vitest** - Testing framework
- **LangiumTest** - Utilities for testing language features
- **VS Code Extension API** - IDE integration

### Key commands
- `npm run langium:generate` - Regenerate parser from grammar
- `npm run build` - Build all packages
- `npm test` - Run test suite

## Project guidelines

### Critical rules
- **Never edit** `src/language/generated/**` - regenerate with `npm run langium:generate` instead
- **Always consult** `.github/instructions/*.md` files before changing code
- **Reference files** explicitly in prompts (e.g., `@domain-lang.langium`)
- **Keep changes focused** - smallest useful diff per edit

### Code standards
- Use TypeScript strict mode
- Prefer functional patterns over classes
- Use descriptive names (camelCase for functions, PascalCase for types)
- Document public APIs with JSDoc
- Add tests for new behavior using LangiumTest utilities

### Git workflow
- Commit messages: imperative title + detailed body (two blank lines between)
- No trailing punctuation in commit titles
- Include motivation in commit body

### Shortcuts
- **CURSOR:PAIR** - Act as pair programmer with alternatives
- **RFC** - Refactor per provided instructions
- **RFP** - Improve prompt clarity per Google's Technical Writing Style Guide

## Project structure

- `src/` - Application code
  - `language/` - DSL implementation
    - `domain-lang.langium` - Grammar definition
    - `generated/` - Auto-generated (never edit manually)
    - `lsp/` - Language Server Protocol features (hover, formatting, validation)
    - `services/` - Language services (relationship inference, etc.)
    - `validation/` - Validation rules for domains, contexts, relationships
  - `cli/` - Command-line interface
  - `extension/` - VS Code extension entry point
  - `syntaxes/` - Syntax highlighting (Monarch, TextMate)
- `test/` - Test suites (parsing, linking, validation)
- `docs/` - All project documentation
- `static/` - Example `.dlang` files and Monaco demos

## Available tools and resources

### Scripts in package.json
- `npm run langium:generate` - Regenerate parser from grammar
- `npm run build` - Full build (generate + compile)
- `npm run watch` - Watch mode for development
- `npm test` - Run all tests
- `npm run test:coverage` - Run tests with coverage

### VS Code tasks
- **Build domain-lang** (default build task) - Generate grammar + build

### File-specific instructions
Instructions automatically apply based on file patterns:
- `.github/instructions/typescript.instructions.md` - TypeScript files (`**/*.ts`)
- `.github/instructions/langium.instructions.md` - Grammar and language files (`**/*.langium`, `src/language/**`)
- `.github/instructions/architecture.instructions.md` - Documentation (`README.md`, `docs/**`, `**/*.md`)

## Problem-solving approach

When working on a task:

1. **Understand deeply** - Read instructions carefully, identify what's required
2. **Investigate** - Explore relevant files, search for patterns, gather context
3. **Plan step-by-step** - Break down into incremental steps (use pseudocode when helpful)
4. **Consult rules** - Check applicable `.github/instructions/*.md` files before coding
5. **Iterate** - Test and refine until confident the solution is complete

When changing code:
- Don't add meta comments about what changed
- Respect user corrections (don't revert their edits)
- Clarify only when a detail blocks progress
- Keep diffs minimal and focused
