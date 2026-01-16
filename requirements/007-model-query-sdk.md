# PRS-007: Model Query SDK

**Status**: Planned  
**Priority**: High  
**Target Version**: 2.2.0  
**Effort Estimate**: 2-3 weeks  
**Dependencies**: None (internal module)

---

## Executive Summary

Add an **SDK module** to `@domain-lang/language` that makes querying DomainLang models intuitive and type-safe. The SDK becomes the **single source of truth** for all domain logic, replacing scattered traversal code across validation, inference, tests, and CLI modules.

**Architecture Decision**: The SDK lives _inside_ the language package (`packages/language/src/sdk/`) rather than as a separate `@domain-lang/sdk` package. This avoids circular dependencies—validation, LSP, and services can import from `../sdk` without creating a dependency cycle.

**Before** (raw AST walking):

```typescript
// Scattered across validation/, services/, CLI
for (const block of bc.documentation ?? []) {
  if (isRoleBlock(block) && block.role?.ref?.name) {
    // Found role... maybe
  }
}
```

**After** (SDK):

```typescript
const { query } = await loadModel('./domains.dlang');

// Fluent, type-safe, lazy
const coreContexts = query()
  .boundedContexts()
  .where(bc => bc.role === 'Core')
  .withMetadata('Language', 'TypeScript');

for (const bc of coreContexts) {
  console.log(`${bc.fqn}: ${bc.description}`);
}
```

---

## Problem

Current consumers of DomainLang models must:

1. **Work with raw Langium services** — verbose boilerplate for loading, linking, walking
2. **Duplicate traversal logic** — validation, inference, and CLI each implement their own block iteration
3. **Handle AST quirks** — documentation blocks are arrays with no guaranteed order; must use type guards
4. **Manage FQN computation** — inconsistent approaches across modules

This leads to bugs, inconsistency, and maintenance burden.

## Goals

| Goal | Measure |
| --- | --- |
| **Ergonomic API** | Developers can query models in <5 lines |
| **Type-safe** | Full TypeScript inference; no `any` escapes |
| **Single source of truth** | All domain logic lives in SDK; validation/CLI delegate |
| **Performant** | O(1) FQN lookups; lazy iteration; <300ms for 1K nodes |
| **Composable** | Queries chain without intermediate allocations |

## Non-Goals

- AST mutation or code generation (read-only)
- New grammar features
- GraphQL/JSONPath-style query DSL (future consideration)

---

## Design Principles

### 1. Augmented AST Over Helper Functions

**Decision**: Extend AST types via TypeScript declaration merging, not orphan helper functions.

```typescript
// ❌ Orphan helpers feel foreign
const role = bcRole(bc);
const team = bcTeam(bc);

// ✅ Native properties feel idiomatic
const role = bc.role;
const team = bc.team;
```

**Rationale**: Properties are discoverable in IDE autocomplete. The SDK enriches the AST during load, so `bc.role` just works—no imports needed.

### 2. Fluent Chains Over Imperative Loops

**Decision**: Return chainable `QueryBuilder<T>` from collection methods.

```typescript
// Compose filters naturally
query()
  .boundedContexts()
  .where(bc => bc.domain === 'Sales')
  .where(bc => bc.role === 'Core')
  .withTeam('PaymentTeam');
```

**Rationale**: Matches Prisma, Drizzle, and LINQ patterns that TypeScript developers expect. Predicates compose without coupling.

### 3. Lazy Iterables Over Eager Arrays

**Decision**: All collection methods return `Iterable<T>`, not `Array<T>`.

```typescript
// Only materializes what you need
for (const bc of query().boundedContexts()) {
  if (bc.name === 'Target') break;  // Short-circuit
}

// Explicit materialization when needed
const all = Array.from(query().boundedContexts());
```

**Rationale**: Avoids copying large arrays. Chains like `.where().where()` add predicates without iteration until consumed.

### 4. Indexes for O(1) Lookups

**Decision**: Build indexes during `loadModel()` for common access patterns.

```typescript
// O(1) by FQN
const bc = query().byFqn('Sales.OrderContext');

// O(1) by team (pre-indexed)
const teamBCs = query().boundedContexts().withTeam('PaymentTeam');
```

**Rationale**: Most queries filter by FQN, team, role, or metadata key. Pre-indexing makes these instant.

### 5. Canonical Resolution Rules

**Decision**: The SDK defines **one** resolution strategy for 0..1 properties. No conflict tracking.

| Property | Resolution |
| --- | --- |
| `bc.role` | Header inline (`as`) → block `role:` → `classifications.role` |
| `bc.team` | Header inline (`by`) → block `team:` |
| `bc.businessModel` | `classifications.businessModel` → standalone block |
| `bc.lifecycle` | `classifications.lifecycle` → standalone block |
| `bc.metadataMap` | Merge all `metadata`/`meta` blocks; later overrides |
| `domain.vision` | First `VisionBlock` |
| `domain.description` | First `DescriptionBlock` |

**Rationale**: Deterministic behavior everywhere. Validation, CLI, LSP, and MCP all use the same rules automatically.

---

## API Surface

### Entry Points

The SDK supports **three entry patterns** to cover all use cases:

```typescript
// 1. CLI/Scripts: Load from file (async, follows imports)
import { loadModel } from '@domain-lang/language/sdk';

const { query } = await loadModel('./domains.dlang', {
  workspaceDir: process.cwd(),
});

// 2. Testing/REPL: Load from string
import { loadModelFromText } from '@domain-lang/language/sdk';

const { query } = await loadModelFromText(`
  Domain Sales { vision: "..." }
  bc OrderContext for Sales
`);

// 3. LSP/Validation: Wrap existing linked AST (sync, no I/O)
import { fromModel, fromDocument, fromServices } from '@domain-lang/language/sdk';

const query = fromModel(model);                    // From Model node
const query = fromDocument(document);              // From LangiumDocument
const query = fromServices(services, documentUri); // From DomainLangServices
```

**Critical**: The LSP and validation hooks already have linked AST via Langium services. They cannot (and should not) reload from disk. `fromModel()`, `fromDocument()`, and `fromServices()` provide **zero-copy** access to the existing AST.

### LSP/Validation Integration Pattern

```typescript
// In hover provider, completion provider, validators, etc.
import { fromDocument } from '../sdk/index.js';

export class DomainLangHoverProvider implements HoverProvider {
  getHoverContent(document: LangiumDocument, params: HoverParams): Hover | undefined {
    const query = fromDocument(document);
    
    const bc = query.boundedContext('OrderContext');
    if (bc) {
      return {
        contents: {
          kind: 'markdown',
          value: `**${bc.fqn}**\n\n${bc.description ?? 'No description'}\n\nTeam: ${bc.team?.name ?? 'unassigned'}`
        }
      };
    }
  }
}

// In validation
import { fromModel } from '../sdk/index.js';

function validateBoundedContext(bc: BoundedContext, accept: ValidationAcceptor): void {
  const query = fromModel(bc.$document?.parseResult.value as Model);
  
  // Use SDK-resolved properties instead of manual block iteration
  if (!query.boundedContext(bc.name)?.description) {
    accept('warning', 'Missing description', { node: bc });
  }
}
```

### Entry Point Signatures

```typescript
// Async: For CLI, scripts, standalone tools
export async function loadModel(
  entryFile: string,
  options?: LoadOptions
): Promise<QueryContext>;

export async function loadModelFromText(
  text: string,
  options?: LoadOptions
): Promise<QueryContext>;

// Sync: For LSP, validation, services (already have linked AST)
export function fromModel(model: Model): Query;
export function fromDocument(document: LangiumDocument<Model>): Query;
export function fromServices(
  services: DomainLangServices,
  documentUri: URI
): Query;

export interface LoadOptions {
  workspaceDir?: string;
  services?: DomainLangServices;  // Reuse existing services
}

export interface QueryContext {
  model: Model;
  documents: URI[];
  query: Query;
}
```

### Query Interface

```typescript
interface Query {
  // Collections (return QueryBuilder for chaining)
  domains(): QueryBuilder<Domain>;
  boundedContexts(): QueryBuilder<BoundedContext>;
  teams(): QueryBuilder<Team>;
  classifications(): QueryBuilder<Classification>;
  relationships(): QueryBuilder<RelationshipView>;
  contextMaps(): QueryBuilder<ContextMap>;
  namespaces(): QueryBuilder<NamespaceDeclaration>;

  // Direct lookups (O(1))
  byFqn<T extends AstNode>(fqn: string): T | undefined;
  domain(name: string): Domain | undefined;
  boundedContext(name: string): BoundedContext | undefined;

  // Utilities
  fqn(node: AstNode): string;
}
```

### QueryBuilder (Fluent Chaining)

```typescript
interface QueryBuilder<T> extends Iterable<T> {
  // Filtering
  where(predicate: (item: T) => boolean): QueryBuilder<T>;

  // Typed filters for common patterns
  withName(name: string | RegExp): QueryBuilder<T>;
  withFqn(pattern: string | RegExp): QueryBuilder<T>;

  // Terminal operations
  first(): T | undefined;
  toArray(): T[];
  count(): number;

  // Iteration
  [Symbol.iterator](): Iterator<T>;
}

// BoundedContext-specific filters
interface BcQueryBuilder extends QueryBuilder<BoundedContext> {
  inDomain(domain: string | Domain): BcQueryBuilder;
  withTeam(team: string | Team): BcQueryBuilder;
  withRole(role: string | Classification): BcQueryBuilder;
  withMetadata(key: string, value?: string): BcQueryBuilder;
}
```

### Augmented AST Types

The SDK enriches AST nodes during load:

```typescript
// After loadModel(), these properties are available directly
interface BoundedContext {
  // Resolved 0..1 properties (SDK-computed)
  readonly description?: string;
  readonly role?: Classification;
  readonly team?: Team;
  readonly businessModel?: Classification;
  readonly lifecycle?: Classification;
  readonly metadataMap: ReadonlyMap<string, string>;
  readonly fqn: string;

  // Original AST still available
  readonly documentation: BoundedContextDocumentationBlock[];
}

interface Domain {
  readonly description?: string;
  readonly vision?: string;
  readonly classification?: Classification;
  readonly fqn: string;
}
```

### RelationshipView

Unified view of relationships from both `BoundedContext` blocks and `ContextMap`:

```typescript
interface RelationshipView {
  readonly left: BoundedContext;
  readonly right: BoundedContext;
  readonly arrow: '->' | '<-' | '<->' | '><';
  readonly leftPatterns: readonly string[];   // ['OHS', 'PL']
  readonly rightPatterns: readonly string[];  // ['CF', 'ACL']
  readonly type?: string;                     // Explicit type
  readonly inferredType?: string;             // SDK-inferred
  readonly source: 'BoundedContext' | 'ContextMap';
}
```

---

## Usage Examples

### Find All Core Contexts with C# Tech Stack

```typescript
const { query } = await loadModel('./banking.dlang');

const results = query()
  .boundedContexts()
  .withRole('Core')
  .withMetadata('Language', 'CSharp')
  .toArray();

results.forEach(bc => {
  console.log(`${bc.fqn}: ${bc.description}`);
  console.log(`  Team: ${bc.team?.name ?? 'unassigned'}`);
});
```

### List All Relationships for a Domain

```typescript
const sales = query().domain('Sales');

const relationships = query()
  .relationships()
  .where(rel =>
    rel.left.domain?.name === 'Sales' ||
    rel.right.domain?.name === 'Sales'
  );

for (const rel of relationships) {
  const type = rel.type ?? rel.inferredType ?? 'unknown';
  console.log(`${rel.left.name} ${rel.arrow} ${rel.right.name} [${type}]`);
}
```

### Extract Documentation for All Bounded Contexts

```typescript
const docs = query()
  .boundedContexts()
  .where(bc => bc.description !== undefined)
  .toArray()
  .map(bc => ({
    fqn: bc.fqn,
    description: bc.description,
    team: bc.team?.name,
    metadata: Object.fromEntries(bc.metadataMap),
  }));

console.log(JSON.stringify(docs, null, 2));
```

### CLI Integration

```bash
# List all bounded contexts
npx dl query contexts --format table

# Filter by team and role
npx dl query contexts --team PaymentTeam --role Core --format json

# Show relationships
npx dl query relationships --format json
```

### LSP Integration (Hover Provider)

```typescript
// packages/language/src/lsp/domain-lang-hover-provider.ts
import { fromDocument } from '@domain-lang/sdk';

export class DomainLangHoverProvider implements HoverProvider {
  getHoverContent(document: LangiumDocument<Model>, params: HoverParams): Hover | undefined {
    const node = this.findNodeAtPosition(document, params.position);
    if (!isBoundedContext(node)) return undefined;

    // SDK provides resolved properties - no manual block iteration
    const query = fromDocument(document);
    const bc = query.boundedContext(node.name);
    if (!bc) return undefined;

    const lines = [
      `## ${bc.fqn}`,
      bc.description ?? '_No description_',
      '',
      `**Role:** ${bc.role?.name ?? 'unclassified'}`,
      `**Team:** ${bc.team?.name ?? 'unassigned'}`,
    ];

    // Metadata table
    if (bc.metadataMap.size > 0) {
      lines.push('', '| Key | Value |', '|-----|-------|');
      for (const [k, v] of bc.metadataMap) {
        lines.push(`| ${k} | ${v} |`);
      }
    }

    return { contents: { kind: 'markdown', value: lines.join('\n') } };
  }
}
```

### Validation Using SDK

```typescript
// packages/language/src/validation/bounded-context-validator.ts
import { fromModel } from '../sdk/index.js';

export function validateBoundedContexts(model: Model, accept: ValidationAcceptor): void {
  const query = fromModel(model);

  for (const bc of query.boundedContexts()) {
    // SDK-resolved properties replace manual block iteration
    if (!bc.description) {
      accept('warning', 'Missing description', { node: bc });
    }

    if (!bc.team && bc.role?.name === 'Core') {
      accept('warning', 'Core contexts should have a team', { node: bc });
    }

    // Relationship validation
    const relationships = query.relationships()
      .where(r => r.left === bc || r.right === bc);
      
    if ([...relationships].length === 0) {
      accept('hint', 'Isolated context - consider adding relationships', { node: bc });
    }
  }
}
```

---

## When to Use Each Entry Point

| Entry Point | Use Case | I/O | Example |
| ----------- | -------- | --- | ------- |
| `loadModel(file)` | CLI, scripts, standalone tools | Async, reads disk | `dl query contexts` |
| `loadModelFromText(text)` | Unit tests, REPL, playgrounds | Async, in-memory | `expect(query.domains().count()).toBe(1)` |
| `fromModel(model)` | Validation, after obtaining Model | Sync, zero-copy | Validators |
| `fromDocument(doc)` | LSP providers (hover, completion) | Sync, zero-copy | Hover provider |
| `fromServices(svc, uri)` | When only services available | Sync, lookup | CLI with shared services |

---

## Implementation Strategy

### Phase 1: SDK Bootstrap (Week 1)

- Create `packages/language/src/sdk/` directory structure
- Implement `loadModel()` and `loadModelFromText()` in `loader.ts`
- Build index infrastructure in `indexes.ts` (byFqn, byName, byTeam, byRole, byMetadata)
- Implement property resolution in `resolution.ts`
- Define public types in `types.ts`
- Configure subpath export in `package.json`

### Phase 2: Query API (Week 1-2)

- Implement `QueryBuilder<T>` with lazy iteration
- Add typed filters (`withTeam`, `withRole`, `withMetadata`)
- Implement `RelationshipView` collection (BC + ContextMap sources)
- Add FQN utilities

### Phase 3: Consolidation (Week 2-3)

- Refactor `validation/bounded-context.ts` to use SDK
- Move relationship inference logic into SDK
- Update CLI commands to use SDK queries
- Remove duplicate traversal code

### Phase 4: Polish (Week 3)

- CLI presets (`dl query contexts`, `dl query relationships`)
- Documentation and examples
- Performance benchmarks
- MCP server readiness checklist

---

## AST Block Resolution (Implementation Detail)

The grammar defines documentation as **arrays** with no guaranteed order:

```langium
BoundedContext: ... '{'
    documentation+=BoundedContextDocumentationBlock*
'}'
```

The SDK must:

1. **Use type guards** — `isRoleBlock()`, `isTeamBlock()`, `isMetadataBlock()`, etc.
2. **Never assume order** — `bc.documentation[0]` could be any block type
3. **Handle multiple blocks** — Merge all `MetadataBlock` entries; apply precedence for role/team
4. **Check header inline first** — `bc.role` (inline `as`) takes precedence over blocks

Example resolution for `bc.role`:

```typescript
function resolveRole(bc: BoundedContext): Classification | undefined {
  // 1. Header inline (highest precedence)
  if (bc.role?.ref) return bc.role.ref;

  // 2. Standalone role block
  const roleBlock = bc.documentation?.find(isRoleBlock);
  if (roleBlock?.role?.ref) return roleBlock.role.ref;

  // 3. Classifications block
  const classBlock = bc.documentation?.find(isBoundedContextClassificationBlock);
  if (classBlock?.role?.ref) return classBlock.role.ref;

  return undefined;
}
```

---

## Consolidation Targets

The SDK replaces scattered logic in these modules:

| Module | Current Logic | SDK Replacement |
| --- | --- | --- |
| `validation/bounded-context.ts` | Manual block iteration, conflict detection | `bc.role`, `bc.team`, `bc.description` |
| `services/relationship-inference.ts` | Walk model, infer types | `query.relationships()` with `.inferredType` |
| `services/governance-validator.ts` | Custom validation | SDK queries |
| `lsp/domain-lang-scope.ts` | FQN computation | `query.fqn(node)` |
| `lsp/domain-lang-hover-provider.ts` | Manual property lookup | `fromDocument(doc)` + `bc.description`, `bc.team` |
| `lsp/domain-lang-completion-provider.ts` | Custom filtering | `query.boundedContexts().withRole()` |

**After consolidation**: One set of tests for resolution rules; validators/CLI/LSP test integration only.

---

## Acceptance Criteria

- [ ] `loadModel()` returns enriched AST with augmented properties
- [ ] `fromModel()` / `fromDocument()` provide sync access for LSP/validation
- [ ] `query.boundedContexts()` returns lazy `QueryBuilder` with typed filters
- [ ] `query.byFqn()` returns in O(1)
- [ ] All 0..1 properties resolve with documented precedence rules
- [ ] Validation modules use SDK instead of manual traversal
- [ ] LSP hover/completion providers use SDK
- [ ] CLI `dl query` presets work with `--format json|table`
- [ ] <300ms load time for 1K-node model
- [ ] <5ms for `fromModel()` on already-linked AST
- [ ] Full JSDoc coverage on public API
- [ ] README with quickstart and examples

---

## Open Questions

1. ~~**Sync vs Async** — Should `loadModel()` have a sync variant for validation use?~~
   **Resolved**: `fromModel()` / `fromDocument()` provide sync, zero-copy access for LSP/validation.
2. **Caching** — Should indexes persist across multiple `fromModel()` calls on same model?
3. **Streaming** — Do we need `AsyncIterable` for very large models with imports?

---

## Module Structure

The SDK is an **internal module** within the language package, not a separate package.

### Directory Layout

```text
packages/language/
├── src/
│   ├── sdk/                      # SDK module (new)
│   │   ├── index.ts              # Public API (re-exported)
│   │   ├── query.ts              # Query and QueryBuilder implementation
│   │   ├── resolution.ts         # Property resolution (internal)
│   │   ├── indexes.ts            # FQN, team, role indexes (internal)
│   │   ├── loader.ts             # loadModel, loadModelFromText (internal)
│   │   └── types.ts              # Public types (Query, QueryBuilder, etc.)
│   ├── validation/               # Can import ../sdk
│   ├── lsp/                      # Can import ../sdk
│   ├── services/                 # Can import ../sdk
│   └── index.ts                  # Package entry point
├── package.json
└── tsconfig.json
```

### Encapsulation Rules

**Public API** (exported from `sdk/index.ts` and re-exported from package):

```typescript
// sdk/index.ts - Only these are visible outside
export { loadModel, loadModelFromText } from './loader.js';
export { fromModel, fromDocument, fromServices } from './query.js';
export type { Query, QueryBuilder, QueryContext, LoadOptions } from './types.js';
export type { RelationshipView, BcQueryBuilder } from './types.js';
```

**Internal** (not exported, only used within SDK):

```typescript
// resolution.ts - Internal
export function resolveRole(bc: BoundedContext): Classification | undefined;
export function resolveTeam(bc: BoundedContext): Team | undefined;
export function resolveDescription(bc: BoundedContext): string | undefined;
// ... other resolution functions

// indexes.ts - Internal
export function buildFqnIndex(model: Model): Map<string, AstNode>;
export function buildTeamIndex(model: Model): Map<string, BoundedContext[]>;
// ... other index builders
```

### Package Exports

The language package exposes SDK via subpath export:

```json
// packages/language/package.json
{
  "name": "@domain-lang/language",
  "exports": {
    ".": "./src/index.js",
    "./sdk": "./src/sdk/index.js"
  }
}
```

**External consumers** (CLI, MCP, external tools):

```typescript
// Import from subpath
import { loadModel, fromModel } from '@domain-lang/language/sdk';
```

**Internal consumers** (validation, LSP, services):

```typescript
// Relative import within package
import { fromModel } from '../sdk/index.js';
```

### Why Internal Module?

| Concern | Separate Package | Internal Module |
| --- | --- | --- |
| Circular dependencies | ❌ SDK → language, language → SDK = cycle | ✅ No cycle, relative imports |
| Versioning | Two packages to version | One package, one version |
| Build complexity | Separate tsconfig, separate publish | Single build |
| Encapsulation | npm scope boundary | TypeScript + exports field |

**Trade-off**: SDK is tied to language package version. This is acceptable because they're tightly coupled anyway.

---

## Documentation & AI Instruction Updates

### Project Documentation

The following documentation must be created or updated:

| File | Action | Content |
| --- | --- | --- |
| `docs/sdk.md` | **Create** | SDK user guide: entry points, Query API, examples, resolution rules |
| `docs/getting-started.md` | **Update** | Add "Querying Models Programmatically" section with SDK intro |
| `docs/quick-reference.md` | **Update** | Add SDK quick reference (entry points, common queries) |
| `docs/README.md` | **Update** | Add SDK to documentation index |
| `packages/language/README.md` | **Update** | Document `/sdk` subpath export and public API |

### SDK Documentation (`docs/sdk.md`)

Required sections:

1. **Overview** — What the SDK provides, when to use it
2. **Installation** — Import from `@domain-lang/language/sdk`
3. **Entry Points** — `loadModel()`, `loadModelFromText()`, `fromModel()`, `fromDocument()`
4. **Query API** — `Query` interface, `QueryBuilder<T>` chaining
5. **Augmented Properties** — `bc.role`, `bc.team`, `bc.description`, `bc.metadataMap`
6. **Resolution Rules** — Precedence table for 0..1 properties
7. **Examples** — Real-world query patterns
8. **Internal Use** — How validation/LSP use the SDK (for contributors)

### AI Instruction Updates

The following instruction files must be updated to guide Copilot when working with SDK code:

| File | Action | Content |
| --- | --- | --- |
| `.github/copilot-instructions.md` | **Update** | Add SDK to Architecture table, update Code Standards |
| `.github/instructions/typescript.instructions.md` | **Update** | Add SDK import patterns, resolution function guidelines |
| `.github/skills/lead-engineer/SKILL.md` | **Update** | Add SDK implementation patterns |
| `.github/skills/tester/SKILL.md` | **Update** | Add SDK testing patterns |

### Copilot Instructions Updates

Add to **Architecture** table in `.github/copilot-instructions.md`:

```markdown
| SDK | `packages/language/src/sdk/` | Query API, resolution, indexes |
```

Add to **Code Standards**:

```markdown
### SDK Usage

- Use SDK for all model queries; never iterate AST manually
- Import from `../sdk/index.js` (internal) or `@domain-lang/language/sdk` (external)
- Prefer `fromDocument()` in LSP providers, `fromModel()` in validators
- Resolution functions are internal; use augmented properties (`bc.role`, not `resolveRole(bc)`)
```

### TypeScript Instructions Updates

Add to `.github/instructions/typescript.instructions.md`:

```markdown
### SDK Patterns

// ✅ Correct: Use SDK in validation
import { fromModel } from '../sdk/index.js';
const query = fromModel(model);
if (!query.boundedContext(bc.name)?.description) { ... }

// ❌ Avoid: Manual block iteration
for (const block of bc.documentation ?? []) {
  if (isDescriptionBlock(block)) { ... }
}

// ✅ Correct: Use augmented properties
const team = bc.team;

// ❌ Avoid: Calling internal resolution functions
import { resolveTeam } from '../sdk/resolution.js';  // Internal!
```

### Testing Instructions Updates

Add to `.github/instructions/testing.instructions.md`:

```markdown
### SDK Tests

SDK tests live in `packages/language/test/sdk/`:

- `resolution.test.ts` — Property resolution precedence
- `query-builder.test.ts` — Fluent API, lazy iteration
- `indexes.test.ts` — O(1) lookup correctness
- `loader.test.ts` — File/text loading, import resolution

Use `loadModelFromText()` for unit tests:

\`\`\`typescript
import { loadModelFromText } from '../../src/sdk/index.js';

test('resolves role from header', async () => {
  const { query } = await loadModelFromText(\`
    classifications { role Core }
    bc OrderContext for Sales as Core
  \`);
  
  const bc = query.boundedContext('OrderContext');
  expect(bc?.role?.name).toBe('Core');
});
\`\`\`
```

### Acceptance Criteria (Documentation)

- [ ] `docs/sdk.md` created with all required sections
- [ ] `docs/getting-started.md` updated with SDK intro
- [ ] `docs/quick-reference.md` includes SDK examples
- [ ] `.github/copilot-instructions.md` includes SDK in architecture
- [ ] `.github/instructions/typescript.instructions.md` includes SDK patterns
- [ ] `.github/instructions/testing.instructions.md` includes SDK test patterns
- [ ] All code examples in docs are tested and work
