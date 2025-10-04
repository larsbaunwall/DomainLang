# DomainLang

DomainLang is a Domain-Driven Design (DDD) modeling language that provides a compilable specification for domain architectures. It combines the power of a custom DSL with rich IDE tooling to enable diagrams-as-code and semantic domain modeling.

## Features

- **Domain-Specific Language**: Express DDD concepts directly in code
- **IDE Support**: Full VS Code extension with LSP features
- **Import System**: Git-native package management with transitive dependencies
- **Code Generation**: Export to TypeScript, JSON, and diagrams
- **CLI Tools**: Validation and dependency management

## Import System

DomainLang features a modern, git-native import system inspired by Deno, Go modules, and Cargo:

```dlang
// Local imports
import "./shared/types.dlang"
import "~/contexts/sales.dlang"

// Package imports (repository-level)
import "acme/ddd-patterns@^2.0.0"
import "acme/strategic-design@1.5.0"
```

**Key Features**:
- ✅ Zero configuration (no npm, no registries)
- ✅ Repository-level packages with automatic transitive dependencies
- ✅ Reproducible builds with lock files
- ✅ Content-addressable caching
- ✅ Explicit imports (like TypeScript/Rust/Go)

**See**: [IMPORT_SYSTEM_IMPLEMENTATION_PLAN.md](./IMPORT_SYSTEM_IMPLEMENTATION_PLAN.md) for complete design and implementation details.

## Work in Progress 🚧

This represents active development. The import system is ready for implementation - see the implementation plan above.

[Join the effort](https://github.com/larsbaunwall/domainlang) or check out the VS Code extension!

---

**Developer Note**: If you use GitHub Copilot in this repository, see `.github/copilot-instructions.md` for project-specific guidance.
