# DomainLang workspace

This folder contains the DomainLang implementation (language, CLI, VS Code extension, demo) and the end-user documentation.

## Start here

- docs/README.md (documentation hub)
- examples/ (example models)

## Packages

- packages/language/ (grammar, language server, validation, SDK)
- packages/cli/ (CLI tool)
- packages/extension/ (VS Code extension)
- packages/demo/ (browser playground)

## Development prerequisites

- Node.js 20 (recommended via Volta)
- npm 10+

## Common commands

```bash
# After editing packages/language/src/domain-lang.langium
npm run langium:generate

# Build everything
npm run build

# Faster iteration: build only the language package
npm run build --workspace packages/language

# Run tests
npm test

# Lint (must be clean)
npm run lint
```
