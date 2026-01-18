# PRS-010: Import System Redesign

Status: Draft
Priority: High
Target Version: 2.0.0

## Overview

This PRS defines a complete redesign of DomainLang's import and package system. The current implementation has grown organically with mixed concerns: git URLs in imports, incomplete workspace management, and ambiguous namespace/package semantics.

The redesigned system follows a **manifest-centric** model (similar to npm/Cargo) where import statements use short dependency names, and all resolution details (source, version, integrity) live in `model.yaml`. This creates cleaner model files readable by domain experts while maintaining reproducible builds via `model.lock`.

**Key changes:**
- Simplified import syntax (specifier + optional alias only)
- Manifest-based dependency resolution
- Custom Langium `WorkspaceManager` for import-driven file loading
- Official standard library (`domainlang/core`)
- Simple monorepo/workspace support

> **Note:** This PRS supersedes PRS-006 (Standard Library). PRS-006 assumed different syntax (`dlang.toml`, named imports, `domainlang/stdlib` naming) that is incompatible with the manifest-centric design here. The standard library will be named `domainlang/core` and follow this PRS's conventions. PRS-006 will not be implemented as written.

## User Stories

### Primary User Story
As a **domain modeler**,
I want to import shared domain definitions from other packages,
So that I can reuse established patterns and compose enterprise-wide models.

### Secondary User Stories

As a **team lead**,
I want a manifest file that declares all dependencies in one place,
So that I can audit and control what external models we depend on.

As a **CI/CD engineer**,
I want reproducible builds via lock files,
So that the same model always resolves to the same dependencies.

As a **tooling developer**,
I want the LSP to only load files reachable from the entry point,
So that workspace indexing is fast and predictable.

## Success Criteria

- [ ] Import statements use short specifiers: `import "core" as Core`
- [ ] External dependencies declared in `model.yaml` with source/version
- [ ] Lock file (`model.lock`) pins exact commits for reproducibility
- [ ] LSP loads only files reachable from entry point (not all `.dlang` files)
- [ ] Transitive dependency version conflicts fail loudly with clear error
- [ ] Standard library installable as `domainlang/core`
- [ ] CLI commands: `dlang add`, `dlang remove`, `dlang install`, `dlang update`
- [ ] Monorepo support via local path dependencies
- [ ] All existing tests pass or are updated

## Functional Requirements

### Must Have (P0)

#### 1. Simplified Import Syntax

**New grammar:**
```langium
ImportStatement:
    ('Import' | 'import') uri=STRING ('as' alias=ID)?
;
```

**Import resolution rules:**
1. Starts with `./` or `../` → relative file path (no manifest entry needed)
2. Starts with `~/` → manifest-root-relative path (directory containing `model.yaml`; if no manifest, falls back to the directory of the importing file)
3. Otherwise → look up in `model.yaml` dependencies by key name

**Examples:**
```dlang
// External dependency (from manifest)
import "core" as Core
import "patterns"                    // Implicit alias: patterns

// Local files (no manifest entry needed)
import "./types.dlang"
import "../shared/common.dlang"
import "~/lib/utils.dlang"
```

**Removed features:**
- Named imports (`import { X, Y } from "..."`) - removed
- Inline versions (`import "owner/repo@v1.0.0"`) - moved to manifest
- Inline integrity (`integrity "sha256:..."`) - moved to manifest

#### 2. Manifest File (`model.yaml`)

Required when project has external dependencies. Optional for single-file or local-only projects.

**Schema:**
```yaml
model:
  name: string              # Package name (required for publishable packages)
  version: string           # SemVer (required for publishable packages)
  namespace: string         # Root namespace this package exports (optional)
  entry: string             # Entry point file (default: index.dlang)

dependencies:
  <alias>:                  # Import specifier used in code
    source: string          # Git coordinates: owner/repo
    version: string         # Pinned version: v1.0.0, main, or commit SHA
    integrity: string       # Optional SHA-256 hash
    description: string     # Optional human-readable description
```

**Example:**
```yaml
model:
  name: acme-sales
  version: 1.0.0
  namespace: acme.sales
  entry: index.dlang

dependencies:
  core:
    source: domainlang/core
    version: v1.0.0
    description: DomainLang standard library
  
  patterns:
    source: ddd-community/patterns
    version: v2.3.1
    integrity: sha256:abc123def456...
```

#### 3. Lock File (`model.lock`)

Auto-generated, pins exact commits for all dependencies (direct and transitive).

**Schema:**
```json
{
  "version": "1",
  "dependencies": {
    "domainlang/core": {
      "version": "v1.0.0",
      "resolved": "https://github.com/domainlang/core",
      "commit": "abc123def456789...",
      "integrity": "sha256:..."
    }
  }
}
```

#### 4. Custom Langium WorkspaceManager

**Problem:** Current LSP loads ALL `.dlang` files VS Code knows about. This is slow and semantically wrong—only files reachable from imports should be loaded.

**Solution:** Override Langium's `WorkspaceManager` with import-driven loading that works in two modes:

**Mode A: With `model.yaml` (package projects)**

1. Find `model.yaml` to determine workspace root
2. Read `entry` field (or default to `index.dlang`)
3. Build document graph starting from entry point
4. Resolve external dependencies via manifest

**Mode B: Without `model.yaml` (simple projects)**

1. Don't pre-load any files during workspace initialization
2. When a file is opened in the editor, load it
3. Recursively load local imports (`./`, `../`, `~/`) on-demand
4. External dependencies (`import "foo"`) produce an error suggesting to create `model.yaml`

**Opened-file behavior (both modes):** When a user opens a `.dlang` file that is not reachable from the entry point (or in Mode B, any file), the LSP treats it as a temporary root and loads its import graph. Diagnostics, completions, and hover information appear for that file and its transitive dependencies. This ensures users always get IDE features for the file they're editing, even if it's an "orphan" not imported from the main entry point.

**Key behavior:** Local imports (relative paths) always work without a manifest. Only external package imports require `model.yaml`.

**Implementation approach:**

```typescript
// Extend DefaultWorkspaceManager
export class DomainLangWorkspaceManager extends DefaultWorkspaceManager {
    
    // Override to prevent auto-loading all .dlang files
    protected override shouldIncludeEntry(entry: FileSystemNode): boolean {
        // Don't auto-include .dlang files during workspace scan
        // They'll be loaded on-demand via imports or when opened
        if (entry.name.endsWith('.dlang')) {
            return false;
        }
        return super.shouldIncludeEntry(entry);
    }
    
    // Custom initialization
    override async initializeWorkspace(
        folders: WorkspaceFolder[],
        cancelToken?: CancellationToken
    ): Promise<void> {
        // Find model.yaml in workspace folders
        const manifest = await this.findManifest(folders);
        if (manifest) {
            // Package project: load from entry point
            await this.loadFromEntryPoint(manifest);
        }
        // Simple project (no manifest): files load when opened/imported
        // No pre-loading needed - LSP handles on-demand
    }
    
    // Recursively load imports when a document is processed
    async loadImportGraph(document: LangiumDocument): Promise<void> {
        const visited = new Set<string>();
        await this.loadDocumentGraph(document.uri, visited);
    }
    
    private async loadDocumentGraph(uri: URI, visited: Set<string>): Promise<void> {
        if (visited.has(uri.toString())) return;
        visited.add(uri.toString());
        
        const doc = await this.documents.getOrCreateDocument(uri);
        
        // Parse imports and recursively load
        for (const imp of this.getImports(doc)) {
            // Local imports always resolve without manifest
            if (this.isLocalImport(imp.uri)) {
                const resolvedUri = this.resolveLocalImport(imp.uri, doc);
                await this.loadDocumentGraph(resolvedUri, visited);
            } else {
                // External import - requires manifest
                const manifest = await this.getManifest();
                if (!manifest) {
                    // Will be reported as validation error
                    continue;
                }
                const resolvedUri = await this.resolveExternalImport(imp, manifest);
                await this.loadDocumentGraph(resolvedUri, visited);
            }
        }
    }
    
    private isLocalImport(uri: string): boolean {
        return uri.startsWith('./') || uri.startsWith('../') || uri.startsWith('~/');
    }
}
```

**Register in module:**

```typescript
export const DomainLangSharedModule: Module<LangiumSharedServices, ...> = {
    workspace: {
        WorkspaceManager: (services) => new DomainLangWorkspaceManager(services)
    }
};
```

**Validation for external imports without manifest:**

```dlang
// No model.yaml in project
import "./types.dlang"     // ✓ Works - local import
import "core" as Core      // ✗ Error: External dependency 'core' requires model.yaml
```

#### 5. Dependency Resolution

**Pinned versions only:** No ranges (`^1.0.0`, `~1.2.3`). Versions must be exact:

- Git tags: `v1.0.0`, `v2.1.3`
- Branch names: `main`, `develop`
- Commit SHAs: `abc123def456`

**Version semantics:** Tags and commit SHAs are immutable. Branch names are "floating" references that resolve to different commits over time. The `model.lock` file pins the exact commit SHA for all dependencies (including branches). Behavior:
- `dlang install`: If `model.lock` exists, use pinned commits. If not, resolve current commits and generate lock.
- `dlang update [name]`: Re-resolve specified (or all) dependencies to latest commits and update lock.
- LSP/validation: Always read from lock file; never resolve versions at edit time.

**Transitive conflict handling:** Fail loudly.

```text
Error: Dependency version conflict
  └─ acme/sales@v1.0.0 requires domainlang/core@v1.0.0
  └─ acme/billing@v2.0.0 requires domainlang/core@v2.0.0
  
Resolution: Update dependencies to use compatible versions.
```

**Cyclic dependency handling:**

| Level | Behavior | Rationale |
| ----- | -------- | --------- |
| **File-level** | ✅ Allowed | Domain models naturally have mutual references (Order↔Customer) |
| **Package-level** | ❌ Forbidden | Creates unresolvable version ordering and complicates tooling |

**File-level cycles:** The import graph loader uses a `visited` set to prevent infinite loops. Both files load successfully and can reference each other's types.

```dlang
// orders.dlang
import "./customers.dlang"
Domain Orders { ... }

// customers.dlang  
import "./orders.dlang"     // ✓ Allowed - file cycle
Domain Customers { ... }
```

**Package-level cycles:** Detected during `dlang install` and rejected with clear error:

```text
Error: Cyclic package dependency detected
  └─ acme/sales depends on acme/billing
  └─ acme/billing depends on acme/sales
  
Resolution: Extract shared types into a third package that both can depend on.
```

#### 6. Standard Library (`domainlang/core`)

Official package at `github.com/domainlang/core`.

**Contents (minimal initial set):**
```dlang
// domainlang/core/index.dlang

Namespace domainlang.core {
    
    // Metadata keys for implementation details
    Namespace metadata {
        Metadata Language
        Metadata Framework
        Metadata Database
        Metadata Repository
        Metadata API
        Metadata MessageBroker
    }
    
    // Domain classifications (strategic importance)
    Namespace classification {
        Classification CoreDomain
        Classification SupportingDomain
        Classification GenericDomain
    }
    
    // Lifecycle stages
    Namespace lifecycle {
        Lifecycle Discovery
        Lifecycle Development
        Lifecycle Production
        Lifecycle Legacy
        Lifecycle Retired
    }
    
    // Business model types
    Namespace business {
        BusinessModel Revenue
        BusinessModel Engagement
        BusinessModel Compliance
        BusinessModel CostReduction
    }
}
```

**Default usage (scaffolded in new projects):**
```dlang
import "core" as Core

bc OrderContext for Sales {
    metadata {
        Core.metadata.Language: "TypeScript"
        Core.metadata.Framework: "NestJS"
    }
}
```

#### 7. CLI Commands

| Command | Description |
|---------|-------------|
| `dlang init` | Create new project with `model.yaml` |
| `dlang add <name> <source>@<version>` | Add dependency to manifest |
| `dlang remove <name>` | Remove dependency from manifest |
| `dlang install` | Generate/update lock file, fetch dependencies |
| `dlang update [name]` | Update lock file (specific dep or all) |
| `dlang outdated` | Show available updates for dependencies |

### Should Have (P1)

#### 8. Local Path Dependencies (Monorepo Support)

Allow dependencies to reference local directory paths instead of git sources:

```yaml
# packages/sales/model.yaml
dependencies:
  shared:
    path: ../shared          # Local path (no source/version needed)
  
  core:
    source: domainlang/core  # External dependency (normal)
    version: v1.0.0
```

**Behavior:**

- Local paths are resolved relative to the manifest file location
- No version/commit pinning for local dependencies
- Changes to local deps immediately visible (no `dlang install` needed)
- `path` and `source` are mutually exclusive
- **Path sandboxing:** Local path dependencies must resolve to a directory that is a descendant of the workspace root (the nearest ancestor directory containing a `model.yaml`, or the VS Code workspace folder if no manifest). Paths that escape the workspace (e.g., `../../../etc/passwd` or absolute paths outside the workspace) produce a validation error: `"Local path dependency escapes workspace boundary."`

**Use case:** Organizations with multiple packages in a single repository can reference sibling packages without publishing them.

#### 9. Implicit Alias When None Specified

When `as` clause is omitted, use dependency key as alias:

```dlang
import "core"              // Equivalent to: import "core" as core
import "core" as Core      // Explicit alias
```

**Casing convention:** Alias as written in manifest key (lowercase by default).

#### 11. Integrity Verification

Optional SHA-256 hash in manifest to verify package contents:

```yaml
dependencies:
  core:
    source: domainlang/core
    version: v1.0.0
    integrity: sha256:abc123def456...
```

**Status:** Deferred to P1. Exact hashing algorithm and input specification (tarball, tree hash, etc.) TBD before implementation. Without a precise definition, integrity checks would be unreliable across platforms.

#### 11. Auto-Import LSP Suggestions

Completion provider suggests imports for unresolved references, scoped to dependencies in `model.yaml`:

```dlang
bc OrderContext {
    metadata {
        Language: "TypeScript"   // Error: Language not defined
        │
        └─ Quick fix: Add 'import "core" as Core' and use 'Core.metadata.Language'
    }
}
```

### Could Have (Future/P2)

#### 11. Named/Selective Imports
Bring specific symbols into scope without prefix:
```dlang
import { Language, Framework } from "core"
```

#### 12. Export Control
Mark entities as `private` or `internal`:
```dlang
private Domain InternalDomain {}
```

#### 13. Version Ranges
Support npm-style version constraints:
```yaml
dependencies:
  core:
    source: domainlang/core
    version: "^1.0.0"
```

#### 14. Central Registry
Optional registry for package discovery (not required for resolution).

## Non-Functional Requirements

- **Performance:** Workspace initialization < 500ms for projects with < 50 files
- **Performance:** Import resolution < 100ms per dependency (cached)
- **Reliability:** Graceful degradation when git fetch fails (use cache)
- **Usability:** Clear error messages for missing/conflicting dependencies
- **Compatibility:** VS Code 1.80+, Node.js 20+
- **Security (network boundary):** The LSP must never perform network operations (git clone/fetch). All network access is performed exclusively by CLI commands (`dlang install`, `dlang update`). The LSP reads only from the local `.dlang/` cache. If a dependency is missing from cache, the LSP reports a diagnostic: `"Dependency 'X' not installed. Run 'dlang install' to fetch dependencies."`
- **Security (shell injection):** Git CLI invocation must pass arguments as an array (e.g., `execFile('git', ['clone', url, dest])`), never via shell string interpolation. Manifest contents (source URLs, versions) must not be interpolated into shell command strings.

## Out of Scope

Explicitly excluded from this PRS:

- **Central package registry** - Git-native only for now
- **Version ranges** - Pinned versions only
- **Private/export visibility** - Everything public
- **Named imports** - Alias-only
- **Non-GitHub hosts** - GitHub only in first iteration
- **Browser-based git fetching** - Node.js CLI only

## Design Considerations

### Git Client Strategy

**Use the system's native `git` CLI** for all repository operations:

```typescript
// Use child_process to invoke git
import { exec } from 'node:child_process';

async function cloneRepo(url: string, dest: string, version: string): Promise<void> {
    await exec(`git clone --depth 1 --branch ${version} ${url} ${dest}`);
}

async function resolveCommit(repoPath: string): Promise<string> {
    const { stdout } = await exec('git rev-parse HEAD', { cwd: repoPath });
    return stdout.trim();
}
```

**Rationale:**

- Leverages existing authentication (SSH keys, credential helpers)
- Supports all git features without reimplementation
- Users already have git installed (required for development)
- Simpler than bundling a git library (isomorphic-git, etc.)

**Requirements:**

- `git` must be installed and in PATH
- Clear error message if git not found: `"Git is required but not found. Install git and ensure it's in your PATH."`

### Langium Integration Points

1. **WorkspaceManager** - Custom implementation for entry-point-driven loading
2. **DocumentBuilder** - Hook `onBuildPhase` for async import resolution
3. **ScopeProvider** - Resolve qualified names through aliases
4. **ValidationRegistry** - Async validation for import path checking

### Dependency Cache Strategy

**Project-local cache** (like `node_modules`):

```text
my-project/
├── model.yaml
├── model.lock
├── index.dlang                      # ← Entry point (can be anywhere)
├── domains/
│   ├── sales.dlang                  # ← Arbitrary folder structure
│   └── billing.dlang
├── .dlang/                          # ← Dependency cache (gitignored)
│   └── packages/
│       ├── domainlang/
│       │   └── core/
│       │       └── v1.0.0/
│       │           ├── model.yaml
│       │           └── index.dlang
│       └── ddd-community/
│           └── patterns/
│               └── v2.3.1/
│                   └── ...
```

**File organization:** DomainLang does not prescribe a folder structure. Files can be:

- Alongside `model.yaml` in the project root
- In any nested folder structure (`domains/`, `contexts/`, etc.)
- Mixed as appropriate for your project

The only convention is the **entry point** (default: `index.dlang`, configurable via `model.entry`).

**Rationale:**

- **Isolation:** Each project has its own dependency versions (no global conflicts)
- **Reproducibility:** `.dlang/` can be deleted and regenerated from `model.lock`
- **Familiar pattern:** Same as `node_modules/`, `vendor/`, `.venv/`
- **Gitignore:** Add `.dlang/` to `.gitignore` (like `node_modules/`)
- **CI-friendly:** Fresh clone + `dlang install` = ready to build

**Cache structure:**

```text
.dlang/
└── packages/
    └── {owner}/
        └── {repo}/
            └── {version}/           # Contains full repo checkout
                ├── model.yaml       # Package manifest
                └── *.dlang          # Package files
```

### Import Resolution Pipeline

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Import         │     │  Manifest        │     │  Git Resolver   │
│  Statement      │────▶│  Lookup          │────▶│  (native git)   │
│  "core"         │     │  model.yaml      │     │  Fetch & Cache  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                               ┌──────────────────────────────────────┐
                               │  Entry Point Resolution              │
                               │  .dlang/packages/domainlang/core/    │
                               │  v1.0.0/index.dlang                  │
                               └──────────────────────────────────────┘
```

### Backward Compatibility

**Breaking changes (acceptable - greenfield assumption):**
- Remove inline version syntax from imports
- Remove named import syntax (`{ X, Y }`)
- Remove inline integrity checking
- Change workspace loading behavior

**Migration:** Not required per user confirmation.

### Related ADRs

- ADR-002: Architecture decisions that may influence implementation

## Dependencies

- **Requires:** None (standalone redesign)
- **Supersedes:** PRS-006 (Standard Library) - this PRS defines the stdlib approach; PRS-006 will not be implemented
- **Related:** PRS-004 (Implementation Bridge) - metadata key usage

## Acceptance Testing

### Test Scenarios

#### Scenario 1: Basic External Import
```dlang
// model.yaml
dependencies:
  core:
    source: domainlang/core
    version: v1.0.0

// index.dlang
import "core" as Core

Domain Sales {
    vision: "Revenue"
}
```
**Expected:** Parses successfully, `Core` alias resolves to stdlib.

#### Scenario 2: Local File Import
```dlang
// No model.yaml needed
import "./types.dlang"

Domain Sales {}
```
**Expected:** Resolves relative path, loads `types.dlang`.

#### Scenario 3: Missing Dependency
```dlang
import "nonexistent" as X
```
**Expected:** Error: `Dependency 'nonexistent' not found in model.yaml`

#### Scenario 4: Transitive Conflict
```yaml
dependencies:
  sales:
    source: acme/sales
    version: v1.0.0   # depends on core@v1.0.0
  billing:
    source: acme/billing
    version: v2.0.0   # depends on core@v2.0.0
```
**Expected:** Error with clear conflict message listing both paths.

#### Scenario 5: Entry-Point Loading

```text
project/
├── model.yaml (entry: main.dlang)
├── main.dlang (imports ./domains/sales.dlang)
├── domains/
│   ├── sales.dlang
│   └── billing.dlang
└── unused/
    └── orphan.dlang
```

**Expected:** Only `main.dlang` and files it imports are loaded; `orphan.dlang` ignored.

#### Scenario 6: Workspace/Monorepo

```yaml
# packages/sales/model.yaml
dependencies:
  shared:
    path: ../shared
```

**Expected:** Local path resolves, no git fetch, immediate changes visible.

#### Scenario 7: Multi-Root Workspace

```text
VS Code workspace with two folders:
├── folder-a/
│   ├── model.yaml (entry: index.dlang, deps: {core: domainlang/core@v1.0.0})
│   └── index.dlang
└── folder-b/
    ├── model.yaml (entry: main.dlang, deps: {patterns: ddd/patterns@v2.0.0})
    └── main.dlang
```

**Expected:**
- Each folder resolves imports independently using its own `model.yaml`
- No cross-contamination: `folder-a` cannot see `patterns`, `folder-b` cannot see `core`
- Manifest discovery uses "nearest ancestor" rule: each file's manifest is the closest `model.yaml` walking up from that file's directory

#### Scenario 8: Offline / Cache Miss

```yaml
# model.yaml
dependencies:
  analytics:
    source: acme/analytics
    version: v1.0.0
```

```text
# .dlang/ cache does NOT contain acme/analytics
```

**Expected (LSP):** Diagnostic on import statement: `"Dependency 'analytics' not installed. Run 'dlang install' to fetch dependencies."` No crash, no hang, no network attempt.

**Expected (CLI - dlang install):** If network unavailable, error: `"Failed to fetch 'acme/analytics': network unreachable. Check your connection and try again."`

#### Scenario 9: Opened Orphan File

```text
project/
├── model.yaml (entry: index.dlang)
├── index.dlang
└── experiments/
    └── scratch.dlang (NOT imported from index.dlang)
```

**User action:** Opens `scratch.dlang` in VS Code.

**Expected:** LSP loads `scratch.dlang` and its imports. Diagnostics, hover, and completions work. The file is treated as a temporary root even though it's not reachable from the entry point.

#### Scenario 10: Path Escape Attempt

```yaml
# packages/sales/model.yaml
dependencies:
  secrets:
    path: ../../../etc/secrets
```

**Expected:** Validation error: `"Local path dependency 'secrets' escapes workspace boundary."`

## Resolved Questions

1. **Alias casing:** `import "core"` creates alias `core` (lowercase), matching the manifest key exactly. Users can override with explicit `as Core` if desired.

2. **Entry point fallback:** If no `model.yaml`, load all `.dlang` files in the workspace (current behavior). This preserves simple single-file usage without requiring project scaffolding.

3. **Stdlib bundling:** Always fetch `domainlang/core` from GitHub. No bundling with the CLI. Cache aggressively after first fetch.

---

## Implementation Plan

This section provides a detailed, sequenced implementation plan organized into phases. Each phase contains batched tasks of similar work to minimize context switching.

### Phase 1: Grammar Simplification

**Goal:** Simplify import syntax, remove unused features

**Duration:** 2-3 days

#### Tasks

| # | Task | Files | Tests |
| - | ---- | ----- | ----- |
| 1.1 | Remove named imports from grammar (`{ X, Y } from`) | `domain-lang.langium` | Update `import-statements.test.ts` |
| 1.2 | Remove inline `integrity` from grammar | `domain-lang.langium` | Update `import-statements.test.ts` |
| 1.3 | Keep only `import STRING ('as' ID)?` | `domain-lang.langium` | Add new simplified tests |
| 1.4 | Run `npm run langium:generate` | Generated files | Verify build passes |
| 1.5 | Update AST type guards if needed | `ast-augmentation.ts` | - |

#### Acceptance Criteria

- [ ] Grammar accepts: `import "foo"`, `import "foo" as Bar`
- [ ] Grammar rejects: `import { X } from "foo"`, `import "foo" integrity "sha"`
- [ ] All parsing tests pass

---

### Phase 2: Manifest System

**Goal:** Implement `model.yaml` parsing and dependency lookup

**Duration:** 3-4 days

#### Tasks

| # | Task | Files | Tests |
| - | ---- | ----- | ----- |
| 2.1 | Define `ModelManifest` TypeScript interface | `services/manifest.ts` (new) | - |
| 2.2 | Implement manifest file discovery (walk up to find `model.yaml`) | `services/manifest.ts` | `manifest.test.ts` (new) |
| 2.3 | Implement manifest YAML parsing with validation | `services/manifest.ts` | `manifest.test.ts` |
| 2.4 | Implement dependency lookup by alias key | `services/manifest.ts` | `manifest.test.ts` |
| 2.5 | Support `path` field for local dependencies | `services/manifest.ts` | `manifest.test.ts` |
| 2.6 | Add manifest caching (by mtime) | `services/manifest.ts` | - |

#### Manifest Schema

```typescript
interface ModelManifest {
  model?: {
    name?: string;
    version?: string;
    namespace?: string;
    entry?: string;  // default: 'index.dlang'
  };
  dependencies?: Record<string, {
    source?: string;      // Git coordinates (owner/repo)
    version?: string;     // Pinned version
    path?: string;        // Local path (mutually exclusive with source)
    integrity?: string;   // Optional SHA-256
    description?: string; // Optional docs
  }>;
}
```

#### Acceptance Criteria

- [ ] Discovers `model.yaml` by walking up directory tree
- [ ] Parses valid YAML into typed structure
- [ ] Returns dependency config by alias key
- [ ] Handles missing manifest gracefully (returns undefined)
- [ ] Validates `path` and `source` are mutually exclusive

---

### Phase 3: Import Resolution Refactor

**Goal:** Refactor import resolution to use manifest for external deps

**Duration:** 3-4 days

#### Tasks

| # | Task | Files | Tests |
| - | ---- | ----- | ----- |
| 3.1 | Create `ImportResolver` service interface | `services/import-resolver.ts` | - |
| 3.2 | Implement local import resolution (`./`, `../`, `~/`) | `services/import-resolver.ts` | `import-resolver.test.ts` |
| 3.3 | Implement manifest-based external resolution | `services/import-resolver.ts` | `import-resolver.test.ts` |
| 3.4 | Implement local path dependency resolution | `services/import-resolver.ts` | `import-resolver.test.ts` |
| 3.5 | Add validation: external import without manifest → error | `validation/import.ts` | `import-validation.test.ts` |
| 3.6 | Remove old inline URL parsing from import resolution | `utils/import-utils.ts` | Update tests |

#### Resolution Logic

```typescript
function resolveImport(specifier: string, manifest?: ModelManifest): Resolution {
  // Local paths - always work without manifest
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return { type: 'local', path: resolveRelative(specifier) };
  }
  if (specifier.startsWith('~/')) {
    return { type: 'workspace', path: resolveWorkspace(specifier) };
  }
  
  // External - requires manifest
  if (!manifest) {
    return { type: 'error', message: `External dependency '${specifier}' requires model.yaml` };
  }
  
  const dep = manifest.dependencies?.[specifier];
  if (!dep) {
    return { type: 'error', message: `Dependency '${specifier}' not found in model.yaml` };
  }
  
  if (dep.path) {
    return { type: 'local-dep', path: resolvePath(dep.path) };
  }
  
  return { type: 'git', source: dep.source!, version: dep.version! };
}
```

#### Acceptance Criteria

- [ ] `./foo.dlang` resolves without manifest
- [ ] `"core"` resolves via manifest lookup
- [ ] `"core"` without manifest produces clear error
- [ ] Local path deps (`path: ../shared`) resolve correctly

---

### Phase 4: Custom WorkspaceManager

**Goal:** Override Langium's WorkspaceManager for import-driven loading

**Duration:** 4-5 days

#### Tasks

| # | Task | Files | Tests |
| - | ---- | ----- | ----- |
| 4.1 | Create `DomainLangWorkspaceManager` extending `DefaultWorkspaceManager` | `services/workspace-manager.ts` | - |
| 4.2 | Override `shouldIncludeEntry` to skip `.dlang` auto-loading | `services/workspace-manager.ts` | `workspace-manager.test.ts` |
| 4.3 | Implement manifest-aware `initializeWorkspace` | `services/workspace-manager.ts` | `workspace-manager.test.ts` |
| 4.4 | Implement `loadImportGraph` for recursive import loading | `services/workspace-manager.ts` | `workspace-manager.test.ts` |
| 4.5 | Add cycle detection in import graph (file-level allowed) | `services/workspace-manager.ts` | `workspace-manager.test.ts` |
| 4.6 | Register in `DomainLangSharedModule` | `domain-lang-module.ts` | - |
| 4.7 | Wire up to `DocumentBuilder.onBuildPhase` for async loading | `domain-lang-module.ts` | Integration tests |

#### Acceptance Criteria

- [ ] Opening single file loads only that file + its imports
- [ ] Opening project with `model.yaml` loads from entry point
- [ ] Orphan files not in import graph are not loaded
- [ ] File-level cycles don't cause infinite loops
- [ ] LSP features (hover, completion) work with new loading

---

### Phase 5: Lock File & Dependency Resolution

**Goal:** Implement lock file generation and transitive dependency resolution

**Duration:** 4-5 days

#### Tasks

| # | Task | Files | Tests |
| - | ---- | ----- | ----- |
| 5.1 | Define `LockFile` interface | `services/lock-file.ts` (new) | - |
| 5.2 | Implement lock file reading (`model.lock`) | `services/lock-file.ts` | `lock-file.test.ts` |
| 5.3 | Implement lock file writing (JSON format) | `services/lock-file.ts` | `lock-file.test.ts` |
| 5.4 | Implement transitive dependency resolution | `services/dependency-resolver.ts` | `dependency-resolver.test.ts` |
| 5.5 | Implement version conflict detection (fail loudly) | `services/dependency-resolver.ts` | `dependency-resolver.test.ts` |
| 5.6 | Implement package-level cycle detection | `services/dependency-resolver.ts` | `dependency-resolver.test.ts` |
| 5.7 | Implement integrity verification (when set) | `services/dependency-resolver.ts` | `dependency-resolver.test.ts` |

#### Acceptance Criteria

- [ ] `model.lock` generated with pinned commits
- [ ] Transitive deps included in lock file
- [ ] Version conflict produces clear error with both paths
- [ ] Package cycle produces clear error
- [ ] Integrity hash verified when present

---

### Phase 6: CLI Commands

**Goal:** Implement dependency management CLI commands

**Duration:** 3-4 days

#### Tasks

| # | Task | Files | Tests |
| - | ---- | ----- | ----- |
| 6.1 | Implement `dlang add <name> <source>@<version>` | `cli/commands/add.ts` | `cli-add.test.ts` |
| 6.2 | Implement `dlang remove <name>` | `cli/commands/remove.ts` | `cli-remove.test.ts` |
| 6.3 | Implement `dlang install` (generate/verify lock file) | `cli/commands/install.ts` | `cli-install.test.ts` |
| 6.4 | Implement `dlang update [name]` (refresh lock file) | `cli/commands/update.ts` | `cli-update.test.ts` |
| 6.5 | Implement `dlang init` (scaffold new project) | `cli/commands/init.ts` | `cli-init.test.ts` |
| 6.6 | Update CLI entry point with new commands | `cli/main.ts` | - |

#### CLI Behavior

```bash
# Add external dependency
dlang add core domainlang/core@v1.0.0
# → Updates model.yaml, runs install

# Add local path dependency
dlang add shared --path ../shared
# → Updates model.yaml with path entry

# Remove dependency
dlang remove core
# → Updates model.yaml, regenerates lock

# Install from manifest
dlang install
# → Reads model.yaml, generates model.lock, fetches packages

# Update specific or all
dlang update core    # Update one
dlang update         # Update all
```

#### Acceptance Criteria

- [ ] `dlang add` updates `model.yaml` correctly
- [ ] `dlang install` generates valid `model.lock`
- [ ] `dlang remove` cleans up manifest and lock
- [ ] `dlang init` creates project scaffold with core import

---

### Phase 7: Standard Library

**Goal:** Create and publish `domainlang/core` package

**Duration:** 2-3 days

#### Tasks

| # | Task | Files | Tests |
| - | ---- | ----- | ----- |
| 7.1 | Create `domainlang/core` GitHub repository | External repo | - |
| 7.2 | Define metadata namespace (`Core.metadata.*`) | `core/index.dlang` | - |
| 7.3 | Define classification namespace (`Core.classification.*`) | `core/index.dlang` | - |
| 7.4 | Define lifecycle namespace (`Core.lifecycle.*`) | `core/index.dlang` | - |
| 7.5 | Define business model namespace (`Core.business.*`) | `core/index.dlang` | - |
| 7.6 | Create `model.yaml` for core package | `core/model.yaml` | - |
| 7.7 | Update `dlang init` to include core dependency | `cli/commands/init.ts` | - |
| 7.8 | Tag v1.0.0 release | External repo | - |

#### Standard Library Structure

```
domainlang/core/
├── model.yaml
│   model:
│     name: core
│     version: 1.0.0
│     namespace: domainlang.core
│     entry: index.dlang
│
└── index.dlang
    Namespace domainlang.core {
        Namespace metadata { ... }
        Namespace classification { ... }
        Namespace lifecycle { ... }
        Namespace business { ... }
    }
```

#### Acceptance Criteria

- [ ] `domainlang/core` repo exists on GitHub
- [ ] `dlang init` creates project importing core
- [ ] `import "core" as Core` resolves correctly
- [ ] `Core.metadata.Language` is valid reference

---

### Phase 8: Validation & Error Messages

**Goal:** Comprehensive validation and user-friendly errors

**Duration:** 2-3 days

#### Tasks

| # | Task | Files | Tests |
| - | ---- | ----- | ----- |
| 8.1 | Validate import specifier exists in manifest | `validation/import.ts` | `import-validation.test.ts` |
| 8.2 | Validate import file exists (local imports) | `validation/import.ts` | `import-validation.test.ts` |
| 8.3 | Validate alias doesn't conflict with local names | `validation/import.ts` | `import-validation.test.ts` |
| 8.4 | Add quick-fix: "Add to model.yaml" for unknown imports | `lsp/code-actions.ts` | - |
| 8.5 | Improve error messages with suggestions | All validation files | - |
| 8.6 | Add LSP diagnostics for manifest issues | `validation/manifest.ts` (new) | - |

#### Error Message Examples

```text
// Good error messages
Error: Import 'analytics' not found in model.yaml
  Hint: Run 'dlang add analytics <source>@<version>' to add it

Error: Cannot resolve import './types.dlang'
  File not found: /path/to/project/types.dlang

Error: Cyclic package dependency detected
  acme/sales → acme/billing → acme/sales
  Hint: Extract shared types into a common package
```

#### Acceptance Criteria

- [ ] All error messages include actionable hints
- [ ] Quick-fixes available in VS Code
- [ ] Manifest validation in LSP

---

### Phase 9: Testing & Documentation

**Goal:** Comprehensive test coverage and updated documentation

**Duration:** 3-4 days

#### Tasks

| # | Task | Files | Tests |
| - | ---- | ----- | ----- |
| 9.1 | Add integration tests for full import flow | `test/integration/` | New test files |
| 9.2 | Add edge case tests (cycles, conflicts, missing) | Various test files | - |
| 9.3 | Update user documentation | `docs/` | - |
| 9.4 | Add import system guide | `docs/imports.md` (new) | - |
| 9.5 | Update examples with manifest files | `examples/` | - |
| 9.6 | Add migration guide (if any breaking changes) | `docs/migration.md` | - |
| 9.7 | Update README with new CLI commands | `README.md` | - |

#### Acceptance Criteria

- [ ] >80% test coverage on new code
- [ ] All examples work with new system
- [ ] Documentation covers all new features

---

## Implementation Summary

| Phase | Duration | Key Deliverable |
| ----- | -------- | --------------- |
| 1. Grammar | 2-3 days | Simplified `ImportStatement` |
| 2. Manifest | 3-4 days | `model.yaml` parsing |
| 3. Import Resolution | 3-4 days | Manifest-based resolution |
| 4. WorkspaceManager | 4-5 days | Import-driven file loading |
| 5. Lock File | 4-5 days | `model.lock` + conflict detection |
| 6. CLI | 3-4 days | `add/remove/install/update` |
| 7. Stdlib | 2-3 days | `domainlang/core` package |
| 8. Validation | 2-3 days | Error messages + quick-fixes |
| 9. Testing | 3-4 days | Coverage + documentation |

**Total estimated duration:** 5-6 weeks

---

## Notes

### Inspiration Sources

- **Go modules:** Git-native, minimal manifest, sum files for integrity
- **Cargo (Rust):** Manifest + lock file, workspaces, clear error messages
- **Deno:** URL imports with import maps, lock files
- **npm:** Dependency aliasing, nested resolution (what to avoid)

### Key Design Decisions

1. **Manifest-centric** - Import syntax is clean; complexity lives in config
2. **Git-native** - No registry, direct git coordinates
3. **Fail loudly** - Version conflicts are errors, not silent merges
4. **Entry-point driven** - Only load what's reachable

---

**Author:** Software Architect (with user input)  
**Created:** 2026-01-18  
**Last Updated:** 2026-01-18
