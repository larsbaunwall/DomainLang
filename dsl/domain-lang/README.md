
# DomainLang Workspace

DomainLang is a multi-package workspace for modeling Domain-Driven Design (DDD) architectures using a modern, namespace-centric DSL. Each package targets a different delivery channel, but all share the same grammar and test suite.

## Quick Start

1. **Explore the Language**
	- Start with the [Getting Started Guide](./docs/getting-started.md) for a hands-on introduction.
	- Dive into the [Quick Reference](./docs/quick-reference.md) for syntax at a glance.
	- Consult the [Language Reference](./docs/language.md) for a formal grammar overview.
	- Browse [Syntax Examples](./docs/syntax-examples.md) for real-world modeling patterns.

2. **Packages**
	- [`packages/language`](./packages/language/README.md): Core Langium grammar, language server, and tests.
	- [`packages/cli`](./packages/cli/README.md): CLI for validation and code generation.
	- [`packages/extension`](./packages/extension/langium-quickstart.md): VS Code extension for rich IDE support.
	- [`packages/demo`](./packages/demo/README.md): Browser demo powered by Vite.

3. **Scripts**
	- `npm run langium:generate`: Regenerate grammar after editing `.langium` files.
	- `npm run build --workspace packages/language`: Build the language server.
	- `npm test --workspace packages/language`: Run the test suite.

## Layout

- [package.json](./package.json): Workspace manifest and shared scripts.
- [docs/](./docs): All documentation—start here for language details.
- [examples/](./examples): Sample `.dlang` models for reference and testing.
- [tsconfig.json](./tsconfig.json): Shared TypeScript config.
- [tsconfig.build.json](./tsconfig.build.json): Build-specific TypeScript settings.
- [.gitignore](.gitignore): Files ignored by Git.

## Learn More

- [Getting Started](./docs/getting-started.md): Beginner-friendly walkthrough.
- [Quick Reference](./docs/quick-reference.md): Syntax cheat sheet.
- [Language Reference](./docs/language.md): Formal grammar and semantics.
- [Syntax Examples](./docs/syntax-examples.md): Comprehensive modeling patterns.
- [Design Docs](./docs/design-docs/GRAMMAR_REVIEW_2025.md): Deep dives into grammar and architecture.

After editing the grammar, always regenerate and rebuild the language package. For advanced usage, see the CLI and extension docs in their respective package folders.
