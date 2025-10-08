# CLAUDE.md

This file provides essential guidance for working with DomainLang.

## Quick Reference

- **Specialized Agents:** `.claude/agents/` - Expert roles for architecture, language design, implementation, testing, documentation
- **Detailed Rules:** `dsl/domain-lang/.claude/rules/` - Technical guidelines for TypeScript, Langium, testing, etc.
- **Working Directory:** Always run commands from `dsl/domain-lang/`

## Project Overview

DomainLang is a Langium-based Domain-Driven Design (DDD) specification language that provides a compilable, semantic model for domain-driven architectures. The project combines a custom DSL with rich IDE tooling to enable diagrams-as-code and semantic domain modeling.

**Key Features:**
- Langium-based DSL with full Language Server Protocol (LSP) support
- VS Code extension with completion, hover, validation, and go-to-definition
- Git-native import system (similar to Go modules and Deno)
- CLI for validation, dependency management, and code generation
- Browser-based demo using Monaco Editor

**Tech Stack:** TypeScript, Langium 4.x, Node.js 18+, Vite, Vitest

**Working Directory:** All commands run from `dsl/domain-lang/`

## Essential Commands

### Development
```bash
npm run langium:generate    # Regenerate parser from grammar (required after .langium changes)
npm run build              # Full build: generate + compile TypeScript
npm run watch              # Watch mode for development
npm test                   # Run test suite with Vitest
npm run test:watch         # Run tests in watch mode
npm run lint               # Run ESLint
```

### Browser Demo
```bash
npm run dev                # Start Vite dev server (Monaco editor demo)
npm run bundle             # Build production bundle
npm run bundle:serve       # Serve production bundle
```

### CLI Usage
```bash
domain-lang-cli generate <file.dlang>           # Generate code from model
domain-lang-cli validate <file.dlang>           # Validate model
domain-lang-cli deps install                    # Install dependencies from lock file
domain-lang-cli deps add <url> [--alias <name>] # Add dependency
domain-lang-cli deps tree                       # Show dependency tree
domain-lang-cli deps audit                      # Audit dependencies
```

### Testing Patterns
- Use `parseHelper` from `langium/test` to test parsing
- Use `createDomainLangServices(EmptyFileSystem)` for isolated tests
- Test files follow pattern: `test/{parsing|linking|validating|services}/*.test.ts`

## Architecture Overview

**Core Components:**
- `src/language/domain-lang.langium` - Grammar definition (DSL syntax)
- `src/language/domain-lang-module.ts` - Service configuration (DI)
- `src/language/generated/**` - Auto-generated AST types (**NEVER EDIT**)
- `src/language/lsp/` - LSP features (hover, completion, formatting)
- `src/language/services/` - Import resolution, workspace management
- `src/language/validation/` - Validation rules using `@Check` decorators

**Key Systems:**
- **Git-native imports** - Like Go modules: `./file.dlang`, `~/file.dlang`, `owner/repo@v1.0.0`
- **Lock files** - `domain.lock` for reproducible builds
- **Qualified names** - Cross-package references with namespace support
- **LSP integration** - Full IDE support via Language Server Protocol

See `.claude/rules/00-project-context.md` for detailed architecture.

## Critical Rules

### Grammar Changes
1. **NEVER** manually edit `src/language/generated/**` files
2. After editing `.langium` files, **ALWAYS** run `npm run langium:generate`
3. Run `npm run build` to compile TypeScript after generation
4. Test parsing changes with new test cases

### File-Specific Instructions
The project uses file-pattern-based instructions in `.github/instructions/`:
- `langium.instructions.md` - Grammar and language implementation (applies to `**/*.langium`, `src/language/**`)
- `typescript.instructions.md` - TypeScript coding standards (applies to `**/*.ts`)
- `architecture.instructions.md` - Documentation standards (applies to `**/*.md`)

**Always consult relevant `.github/instructions/*.md` files before making changes.**

### Code Standards
- Use TypeScript strict mode
- Prefer functional patterns over classes (except for Langium services)
- Naming: `camelCase` for functions/variables, `PascalCase` for types/interfaces
- Document public APIs with JSDoc (shown in hover tooltips)
- Add tests for new validation rules and language features

### Git Workflow
- Commit messages: Imperative title (no trailing punctuation) + detailed body
- Include motivation in commit body (two blank lines between title and body)
- Reference line numbers when discussing code: `file.ts:123`

## Problem-Solving Workflow

When modifying the language:
1. **Read grammar** - Understand current syntax in `domain-lang.langium`
2. **Check generated files** - See what AST types exist in `generated/ast.ts`
3. **Consult instructions** - Read `.github/instructions/langium.instructions.md`
4. **Make changes** - Edit grammar, regenerate, implement services
5. **Test thoroughly** - Add parsing, linking, and validation tests
6. **Iterate** - Test in VS Code extension and browser demo

When debugging:
1. Check document lifecycle state (Parsed → Indexed → Scoped → Linked → Validated)
2. Use `LangiumTest` utilities to isolate issues
3. Enable profiling with `--profile` flag in CLI
4. Check validation diagnostics with `document.diagnostics`

## Project Structure Reference

```
dsl/domain-lang/
├── src/
│   ├── language/              # Core language implementation
│   │   ├── domain-lang.langium       # Grammar definition
│   │   ├── domain-lang-module.ts     # Service configuration
│   │   ├── generated/               # Auto-generated (DO NOT EDIT)
│   │   ├── lsp/                     # LSP features (hover, completion, formatting)
│   │   ├── services/                # Import resolver, workspace manager, analyzers
│   │   ├── validation/              # Validation rules
│   │   └── utils/                   # Utility functions
│   ├── cli/                   # Command-line interface
│   │   ├── main.ts                  # CLI entry point
│   │   ├── dependency-commands.ts   # Dependency management commands
│   │   └── generator.ts             # Code generation
│   ├── extension/             # VS Code extension entry point
│   ├── syntaxes/              # TextMate and Monarch syntax highlighting
│   └── setup*.ts              # Monaco editor setup for browser demo
├── test/                      # Test suites
│   ├── parsing/               # Grammar parsing tests
│   ├── linking/               # Cross-reference resolution tests
│   ├── validating/            # Validation rule tests
│   ├── services/              # Service layer tests
│   └── integration/           # End-to-end tests
├── static/                    # Example .dlang files and demos
├── docs/                      # Documentation
└── bin/cli.js                 # CLI executable
```

## Key Langium Concepts

**Document Lifecycle:** Parsed → IndexedContent → ComputedScopes → Linked → IndexedReferences → Validated

**Critical Rule:** Cannot access cross-references during `ScopeComputation` (phase 3) - linking hasn't happened yet!

**Grammar Patterns:** `=` assignment, `+=` array, `?=` boolean, `[Type]` cross-reference

See `.claude/rules/03-langium.md` for comprehensive Langium guidance.

## When You Need Help

**Complex tasks?** Use specialized agents in `.claude/agents/`:
- **software-architect** - Strategic decisions, ADRs, PRSs, feature planning
- **language-designer** - Syntax design, semantics, grammar design
- **lead-engineer** - Hands-on implementation, code quality
- **tester** - Test strategy, unit/integration tests, coverage
- **technical-writer** - Documentation, JSDoc, user guides

**Example:** "@software-architect: Should we support nested domains? Create ADR and PRS."