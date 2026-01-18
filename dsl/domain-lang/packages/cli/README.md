# @domainlang/cli

[![npm version](https://img.shields.io/npm/v/@domainlang/cli.svg)](https://www.npmjs.com/package/@domainlang/cli)
[![License](https://img.shields.io/npm/l/@domainlang/cli.svg)](https://github.com/larsbaunwall/DomainLang/blob/main/LICENSE)

Command-line interface for [DomainLang](https://github.com/larsbaunwall/DomainLang) - a Domain-Driven Design modeling language.

## Features

- 📦 **Dependency Management** - Git-native model dependencies with version locking
- 🔍 **Validation** - Validate your DomainLang models for correctness
- 🌳 **Impact Analysis** - Visualize dependency trees and analyze changes
- 🔒 **Compliance** - Audit and check model compliance

## Installation

```bash
npm install -g @domainlang/cli
```

Or use with npx:

```bash
npx @domainlang/cli --help
```

## Quick Start

```bash
# Validate a DomainLang model
domain-lang-cli model validate

# Install model dependencies
domain-lang-cli install

# View dependency tree
domain-lang-cli model tree
```

## Commands

### Dependency Management

DomainLang supports a git-native model dependency workflow via `model.yaml` and a lock file.

```bash
# List dependencies (from lock file)
domain-lang-cli model list

# Add/remove dependencies in model.yaml
domain-lang-cli model add <name> <owner/repo> [version]
domain-lang-cli model remove <name>

# Install and lock dependencies
domain-lang-cli install
```

### Analysis & Validation

```bash
# Validate model structure and references
domain-lang-cli model validate

# See dependency tree and impact analysis
domain-lang-cli model tree [--commits]
domain-lang-cli model deps <owner/repo>

# Audit and compliance checks
domain-lang-cli model audit
domain-lang-cli model compliance
```

### Utilities

```bash
# Clear dependency cache
domain-lang-cli cache-clear

# Get help
domain-lang-cli --help
```

### Code Generation (Experimental)

```bash
# Generate code from a model (currently produces stub output)
domain-lang-cli generate <file>
```

## Related Packages

- [@domainlang/language](https://www.npmjs.com/package/@domainlang/language) - Core language library and SDK
- [DomainLang VS Code Extension](https://marketplace.visualstudio.com/items?itemName=thinkability.domain-lang) - IDE support with syntax highlighting and validation

## Documentation

- [Getting Started](https://github.com/larsbaunwall/DomainLang/blob/main/dsl/domain-lang/docs/getting-started.md)
- [Language Reference](https://github.com/larsbaunwall/DomainLang/blob/main/dsl/domain-lang/docs/language.md)
- [Quick Reference](https://github.com/larsbaunwall/DomainLang/blob/main/dsl/domain-lang/docs/quick-reference.md)

## License

Apache-2.0
