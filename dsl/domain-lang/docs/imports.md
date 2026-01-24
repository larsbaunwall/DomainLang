# Import system

This guide covers how to split DomainLang models across files and reuse shared definitions.

> [!TIP]
> For quick syntax, see [quick-reference.md](quick-reference.md#imports).
> For the full language reference, see [language.md](language.md).

## Overview

The import system lets you:

- Split large models into manageable files
- Share common vocabularies (teams, classifications, metadata)
- Reuse packages from other repositories
- Organize code with path aliases

## Import syntax

DomainLang uses a simple import syntax:

```dlang
import "path/to/file.dlang"
import "path/to/file.dlang" as Alias
```

The import specifier (the string) can be:

| Form | Example | Description |
| --- | --- | --- |
| Relative | `"./shared.dlang"` | File relative to current file |
| Root alias | `"@/shared/core.dlang"` | File relative to workspace root |
| Path alias | `"@shared/core.dlang"` | Custom alias defined in `model.yaml` |
| Package | `"acme/core"` | External package from `model.yaml` dependencies |

### Import aliases

Use `as` to create a namespace for imported declarations:

```dlang
import "acme/core" as Core

bc Orders for Core.SalesDomain { }
```

## Project manifest (model.yaml)

The manifest file declares dependencies, path aliases, and package metadata.

Create a `model.yaml` file in your project root:

```yaml
# Package identity (optional - required only for publishing)
model:
  name: acme/sales
  version: 1.0.0
  entry: index.dlang

# Path aliases for @ imports
paths:
  "@/": "./"
  "@shared/": "./libs/shared/"

# External dependencies
dependencies:
  acme/core: "v1.0.0"                    # Short form: package: ref
  acme/compliance:                        # Extended form
    source: acme/compliance
    ref: v2.1.0
    integrity: sha256-abc123...          # Optional verification

# Override transitive dependency refs (advanced)
overrides:
  acme/utils: "v3.0.0"

# Governance policies (optional)
governance:
  allowedSources:
    - github.com/acme
  requireStableVersions: true
```

### Package identity

The `model:` section identifies your package when publishing:

| Field | Required | Description |
| --- | --- | --- |
| `name` | For publishing | Package name in `owner/repo` format |
| `version` | For publishing | SemVer version string |
| `entry` | No | Entry file (default: `index.dlang`) |

### Path aliases

The `paths:` section defines custom `@` aliases:

```yaml
paths:
  "@/": "./"                    # @/ = workspace root
  "@shared/": "./libs/shared/"  # @shared/ = ./libs/shared/
  "@domain/": "./src/domain/"   # @domain/ = ./src/domain/
```

Use in imports:

```dlang
import "@shared/core.dlang"
import "@domain/sales.dlang"
```

> [!NOTE]
> The `@/` alias is always available and maps to the workspace root, even without a manifest.

### Dependencies

Dependencies are external packages fetched from git repositories.

**Short form** - just the git ref:

```yaml
dependencies:
  acme/core: "v1.0.0"           # Tag
  acme/utils: "main"            # Branch
  acme/pinned: "abc123def..."   # Commit SHA
```

**Extended form** - with additional options:

```yaml
dependencies:
  acme/compliance:
    source: acme/compliance     # Git coordinates
    ref: v2.1.0                 # Git ref (tag, branch, commit)
    integrity: sha256-abc123    # Integrity verification
    description: "Compliance definitions"
```

**Local path** - for monorepo development:

```yaml
dependencies:
  acme/local:
    path: ../shared/core        # Local filesystem path
```

> [!IMPORTANT]
> You cannot mix `source` and `path` in the same dependency.

### Git refs

A git ref can be:

| Type | Examples | Behavior |
| --- | --- | --- |
| Tag | `v1.0.0`, `v2.3.4-beta.1` | Pinned to tag, upgradable via `dlang upgrade` |
| Branch | `main`, `develop` | Re-resolved on `dlang update` |
| Commit | `abc123def456...` | Permanently pinned (40-char SHA) |

## Lock file (model.lock)

The lock file pins exact commits for reproducible builds.

After running `dlang install`, a `model.lock` file is generated:

```yaml
version: "1"
dependencies:
  acme/core:
    ref: v1.0.0
    refType: tag
    resolved: https://github.com/acme/core.git
    commit: abc123def456789...
  acme/utils:
    ref: main
    refType: branch
    resolved: https://github.com/acme/utils.git
    commit: def456abc789012...
```

The `refType` field enables smart CLI behavior:

- **Tags**: Stable pins, only updated via `dlang upgrade`
- **Branches**: Re-resolved on `dlang update` to latest commit
- **Commits**: Never updated (explicit pins)

> [!TIP]
> Commit both `model.yaml` and `model.lock` to source control for reproducible builds.

## Dependency resolution

### Latest Wins strategy

When multiple packages require the same transitive dependency with different SemVer tags, the resolver picks the **latest compatible version**.

Example scenario:

- Your package requires `acme/utils: v1.2.0`
- A dependency requires `acme/utils: v1.5.0`
- **Result**: `v1.5.0` is used (latest compatible)

This works because SemVer guarantees backward compatibility within the same major version.

### Conflict errors

Some conflicts cannot be auto-resolved:

| Conflict type | Example | Resolution |
| --- | --- | --- |
| Major version mismatch | `v1.x` vs `v2.x` | Use `overrides:` or update requirements |
| Commit SHA conflict | Different pinned commits | Use `overrides:` |
| Tag vs branch | `v1.0.0` vs `main` | Use `overrides:` |

Error message example:

```text
Error: Version conflict for acme/utils
  Required: v1.0.0 (by your-package)
  Required: v2.0.0 (by acme/other)
  Hint: Add an override in model.yaml or update dependencies
```

### Overrides

Use the `overrides:` section to explicitly resolve conflicts:

```yaml
overrides:
  acme/utils: "v2.0.0"     # Force this ref for all uses
```

Overrides take precedence over all other constraints.

## Import resolution

### Local imports

For imports without a package prefix, the resolver searches:

1. **Directory first**: `./types` → `./types/index.dlang`
2. **File fallback**: `./types` → `./types.dlang`

```dlang
import "./shared"           // → ./shared/index.dlang or ./shared.dlang
import "./shared.dlang"     // → ./shared.dlang (explicit)
```

### Path alias imports

Aliases defined in `model.yaml` paths section:

```dlang
import "@shared/core"       // → {paths.@shared/}core/index.dlang
import "@/types.dlang"      // → {workspace root}/types.dlang
```

### Package imports

Packages declared in `model.yaml` dependencies:

```dlang
import "acme/core"          // → entry point of acme/core package
import "acme/core" as Core  // → with namespace alias
```

Package resolution flow:

1. Look up package in `model.yaml` dependencies
2. Read lock file for exact commit
3. Load from cache (`.dlang/packages/{owner}/{repo}/{ref}/`)

## CLI commands

The DomainLang CLI manages dependencies:

| Command | Description |
| --- | --- |
| `dlang install` | Install all dependencies from manifest |
| `dlang add <pkg>@<ref>` | Add a dependency to manifest |
| `dlang remove <pkg>` | Remove a dependency |
| `dlang update` | Re-resolve branch refs to latest commits |
| `dlang upgrade` | List available tag upgrades |
| `dlang outdated` | Show dependencies with newer versions |

### Example workflow

```bash
# Initialize a new project
dlang init

# Add dependencies
dlang add acme/core@v1.0.0
dlang add acme/utils@main

# Install all dependencies
dlang install

# Later: update branch refs
dlang update

# Check for newer tag versions
dlang outdated
```

## Validation and errors

The language server validates imports and provides actionable feedback:

### Common errors

| Error | Cause | Fix |
| --- | --- | --- |
| Import not found in manifest | Package not in dependencies | Run `dlang add <pkg>@<ref>` |
| File not found | Local import path doesn't exist | Check relative path |
| Missing manifest | No `model.yaml` found | Create manifest or use `dlang init` |
| Missing lock file | Dependencies not installed | Run `dlang install` |

### Quick fixes

VS Code provides quick fixes for common issues:

- **"Add to model.yaml"** - Adds unknown package to dependencies
- **"Create model.yaml"** - Creates a basic manifest
- **"Run dlang install"** - Prompts to install dependencies

## Best practices

1. **Commit lock files** - Ensures reproducible builds
2. **Use tags for stability** - Branches can change unexpectedly
3. **Organize with namespaces** - Use path aliases for large projects
4. **Pin critical deps** - Use commit SHAs for mission-critical packages
