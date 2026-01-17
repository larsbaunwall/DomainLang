# Model Query SDK

Fluent, type-safe query API for DomainLang models.

## Architecture

The SDK is **read-only and query-focused**. It provides:
- Augmented AST properties (`resolvedRole`, `resolvedTeam`, etc.)
- Fluent query chains with lazy iteration
- O(1) indexed lookups by FQN/name

The SDK does **NOT** manage:
- Workspace lifecycle (LSP/WorkspaceManager handles this)
- File watching or change detection (LSP handles this)
- Cross-file import resolution (DocumentBuilder handles this)

## Entry Points by Deployment Target

| Target | Entry Point | Browser-Safe | Notes |
|--------|-------------|--------------|-------|
| VS Code Extension | `fromDocument()` | ✅ | Zero-copy LSP integration |
| Web Editor | `fromDocument()`, `loadModelFromText()` | ✅ | Browser-compatible |
| CLI (Node.js) | `loadModel()` | ❌ | Requires `sdk/loader-node` |
| Hosted LSP | `fromDocument()`, `fromServices()` | ✅ | Server-side |
| Testing | `loadModelFromText()` | ✅ | In-memory parsing |

## Installation

The SDK is bundled with the `domain-lang-language` package:

```typescript
// Browser-safe imports (VS Code, web editor, testing)
import { loadModelFromText, fromDocument, fromModel } from 'domain-lang-language/sdk';

// Node.js CLI only (NOT browser-safe)
import { loadModel } from 'domain-lang-language/sdk/loader-node';
```

## Entry Points

### For Node.js CLI, Scripts

```typescript
// Note: This import requires Node.js filesystem
import { loadModel } from 'domain-lang-language/sdk/loader-node';

// Load from file (async)
const { query, model } = await loadModel('./domains.dlang', {
  workspaceDir: process.cwd()
});
```

### For Testing, REPL, Web Editor

```typescript
import { loadModelFromText } from 'domain-lang-language/sdk';

// Load from string (async, browser-safe)
const { query } = await loadModelFromText(`
  Domain Sales { vision: "Handle sales operations" }
  bc OrderContext for Sales as Core
`);
```

### For LSP, Validation (Zero-Copy)

```typescript
import { fromModel, fromDocument, fromServices } from 'domain-lang-language/sdk';

// From Model node (sync)
const query = fromModel(model);

// From LangiumDocument (sync)
const query = fromDocument(document);

// From services + URI (sync)
const query = fromServices(services, documentUri);
```

## Query API

### Collections

```typescript
// All bounded contexts
query.boundedContexts()

// All domains
query.domains()

// All teams
query.teams()

// All classifications
query.classifications()

// All relationships
query.relationships()

// All context maps
query.contextMaps()
```

### Fluent Chaining

```typescript
// Filter by role
query.boundedContexts()
  .withRole('Core')
  .withTeam('PaymentTeam')
  .toArray()

// Filter by domain
query.boundedContexts()
  .inDomain('Sales')
  .withMetadata('Language', 'TypeScript')

// Custom predicates
query.domains()
  .where(d => d.parent !== undefined)
  .where(d => d.sdkClassification?.name === 'Core')
```

### Direct Lookups (O(1))

```typescript
// By FQN
const bc = query.byFqn<BoundedContext>('Sales.OrderContext');

// By simple name
const domain = query.domain('Sales');
const context = query.boundedContext('OrderContext');

// Get FQN
const fqn = query.fqn(bc);
```

## SDK-Resolved Properties

The SDK augments AST nodes with resolved properties using `resolved*` prefixes
to avoid conflicts with existing AST properties while maintaining discoverability:

### BoundedContext

```typescript
bc.resolvedDescription   // Resolved from DescriptionBlock
bc.resolvedRole          // Header inline → RoleBlock → ClassificationBlock.role
bc.resolvedTeam          // Header inline → TeamBlock
bc.resolvedBusinessModel // ClassificationBlock → BusinessModelBlock
bc.resolvedLifecycle     // ClassificationBlock → LifecycleBlock
bc.resolvedMetadataMap   // Merged from all MetadataBlock
bc.fqn                   // Computed fully qualified name
```

### Domain

```typescript
domain.resolvedDescription      // First DescriptionBlock
domain.resolvedVision          // First VisionBlock
domain.resolvedClassification  // First DomainClassificationBlock
domain.fqn                     // Computed fully qualified name
```

## Examples

### Find All Core Contexts with C# Stack

```typescript
const { query } = await loadModel('./banking.dlang');

const results = query.boundedContexts()
  .withRole('Core')
  .withMetadata('Language', 'CSharp')
  .toArray();

for (const bc of results) {
  console.log(`${bc.sdkFqn}: ${bc.sdkDescription}`);
  console.log(`  Team: ${bc.sdkTeam?.name ?? 'unassigned'}`);
}
```

### List All Relationships for a Domain

```typescript
const sales = query.domain('Sales');

const relationships = query.relationships()
  .where(rel =>
    rel.left.domain?.ref?.name === 'Sales' ||
    rel.right.domain?.ref?.name === 'Sales'
  );

for (const rel of relationships) {
  const type = rel.type ?? rel.inferredType ?? 'unknown';
  console.log(`${rel.left.name} ${rel.arrow} ${rel.right.name} [${type}]`);
}
```

### Extract Documentation

```typescript
const docs = query.boundedContexts()
  .where(bc => bc.sdkDescription !== undefined)
  .toArray()
  .map(bc => ({
    fqn: bc.sdkFqn,
    description: bc.sdkDescription,
    team: bc.sdkTeam?.name,
    metadata: Object.fromEntries(bc.sdkMetadataMap),
  }));

console.log(JSON.stringify(docs, null, 2));
```

## Resolution Rules

The SDK uses deterministic precedence for resolving 0..1 properties:

| Property | Precedence |
|----------|-----------|
| `bc.sdkRole` | Header inline (`as`) → RoleBlock → ClassificationBlock.role |
| `bc.sdkTeam` | Header inline (`by`) → TeamBlock |
| `bc.sdkDescription` | First DescriptionBlock |
| `bc.sdkMetadata` | Merge all MetadataBlock; later overrides |
| `bc.sdkBusinessModel` | ClassificationBlock → BusinessModelBlock |
| `bc.sdkLifecycle` | ClassificationBlock → LifecycleBlock |
| `domain.sdkDescription` | First DescriptionBlock |
| `domain.sdkVision` | First VisionBlock |
| `domain.sdkClassification` | First DomainClassificationBlock |

## Performance

- **O(1) lookups**: `byFqn()`, indexed team/role/metadata filters
- **Lazy iteration**: QueryBuilder chains don't materialize until consumed
- **Zero-copy**: `fromModel()` / `fromDocument()` reuse existing AST

## Architecture

The SDK is an **internal module** within the language package:

```
packages/language/src/sdk/
├── index.ts          # Public API
├── types.ts          # Type definitions
├── query.ts          # Query & QueryBuilder
├── resolution.ts     # Property resolution (internal)
├── indexes.ts        # Index building (internal)
└── loader.ts         # loadModel functions (internal)
```

### Internal vs Public

**Public** (exported from `sdk/index.ts`):
- `loadModel`, `loadModelFromText`
- `fromModel`, `fromDocument`, `fromServices`
- `Query`, `QueryBuilder`, `BcQueryBuilder`
- Type definitions

**Internal** (not exported):
- `resolveRole`, `resolveTeam`, `resolveBcMetadata`, etc.
- `buildIndexes`, `buildFqnIndex`, etc.
- Implementation classes

Use SDK-resolved properties (`bc.sdkRole`) instead of calling resolution functions directly.
