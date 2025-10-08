# DomainLang Project Context

## What This Project Does

DomainLang is a Domain-Driven Design (DDD) modeling language that provides a compilable specification for domain architectures. It combines the power of a custom DSL with rich IDE tooling to enable diagrams-as-code and semantic domain modeling.

### Key Features

- **Langium-based DSL** for defining domains, bounded contexts, and relationships
- **VS Code extension** with full LSP support (completion, hover, validation, go-to-definition)
- **CLI** for validation, dependency management, and code generation (TypeScript, JSON, diagrams)
- **Browser-based demo** for exploring the language using Monaco Editor
- **Git-native import system** inspired by Go modules and Deno

Inspired by ContextMapper DSL, DomainLang aims to be a more complete DDD specification language with first-class IDE support.

## Tech Stack

### Core Language
- **Langium 4.x** - Parser generator and LSP framework for the DSL
- **TypeScript** - All implementation code (strict mode)
- **Node.js 18+** - Runtime for CLI and language server

### Development Tools
- **Vite** - Browser demo bundler
- **Vitest** - Testing framework
- **LangiumTest** - Utilities for testing language features
- **VS Code Extension API** - IDE integration
- **ESLint** - Code linting

## Working Directory

**IMPORTANT:** All npm commands must be run from `dsl/domain-lang/` directory.

## Key Commands

### Development
```bash
npm run langium:generate    # Regenerate parser from grammar (REQUIRED after .langium changes)
npm run build              # Full build: generate + compile TypeScript
npm run watch              # Watch mode for development
npm test                   # Run test suite with Vitest
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
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
domain-lang-cli deps check-compliance           # Check governance compliance
```

## Project Structure

```
dsl/domain-lang/
├── src/
│   ├── language/              # Core language implementation
│   │   ├── domain-lang.langium       # Grammar definition (source of truth)
│   │   ├── domain-lang-module.ts     # Service configuration (DI)
│   │   ├── generated/               # Auto-generated (NEVER EDIT MANUALLY)
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
├── .github/
│   ├── copilot-instructions.md      # GitHub Copilot context
│   ├── instructions/                # File-pattern-based instructions
│   └── chatmodes/                   # Specialized chat modes
├── .claude/                   # Claude Code rules (this directory)
└── bin/cli.js                 # CLI executable
```

## Problem-Solving Approach

When working on a task:

1. **Understand deeply** - Read instructions carefully, identify what's required
2. **Investigate** - Explore relevant files, search for patterns, gather context
3. **Plan step-by-step** - Break down into incremental steps (use pseudocode when helpful)
4. **Consult rules** - Check applicable `.claude/rules/*.md` files before coding
5. **Iterate** - Test and refine until confident the solution is complete

When changing code:
- Don't add meta comments about what changed
- Respect user corrections (don't revert their edits)
- Clarify only when a detail blocks progress
- Keep diffs minimal and focused

## File-Specific Rules

The `.claude/rules/` directory contains specialized guidelines:
- `01-critical-rules.md` - Non-negotiable project rules
- `02-typescript.md` - TypeScript coding standards
- `03-langium.md` - Langium framework guidelines
- `04-testing.md` - Testing patterns and best practices
- `05-git-commits.md` - Git workflow and commit conventions
- `06-documentation.md` - Documentation standards
- `07-performance.md` - Performance optimization guidelines

Always consult relevant rules before making changes.
