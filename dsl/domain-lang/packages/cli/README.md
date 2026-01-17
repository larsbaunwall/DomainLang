# domain-lang-cli

Command line interface for working with DomainLang models.

## Install

This repository builds the CLI as part of the workspace. The binary is `domain-lang-cli`.

## Commands

### Model dependencies

DomainLang supports a git-native model dependency workflow via model.yaml and a lock file.

```bash
# List dependencies (from lock file)
domain-lang-cli model list

# Add/remove dependencies in model.yaml
domain-lang-cli model add <name> <owner/repo> [version]
domain-lang-cli model remove <name>

# Install and lock dependencies
domain-lang-cli install

# See dependency tree and impact analysis
domain-lang-cli model tree [--commits]
domain-lang-cli model deps <owner/repo>

# Validate/audit
domain-lang-cli model validate
domain-lang-cli model audit
domain-lang-cli model compliance

# Clear cache
domain-lang-cli cache-clear
```

### Code generation (experimental)

`domain-lang-cli generate <file>` exists but currently produces an empty JavaScript stub. Treat it as experimental.
