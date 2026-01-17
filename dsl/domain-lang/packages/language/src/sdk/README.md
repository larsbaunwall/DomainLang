# Model Query SDK

Fluent, type-safe query API for DomainLang models.

## SDK Architecture

The SDK is **read-only and query-focused**. It provides:

- Augmented AST properties (`effectiveRole`, `effectiveTeam`, etc.)
- Fluent query chains with lazy iteration
- O(1) indexed lookups by FQN/name

The SDK does **NOT** manage:

- Workspace lifecycle (LSP/WorkspaceManager handles this)
- File watching or change detection (LSP handles this)
- Cross-file import resolution (DocumentBuilder handles this)

## Entry Points by Deployment Target

| Target | Entry Point | Browser-Safe | Notes |
| --- | --- | --- | --- |
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
  .where(d => d.classification?.ref?.name === 'Core')  // Direct reference access
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

## SDK-Augmented Properties

The SDK augments AST nodes **only for properties that add value beyond direct access**:

### BoundedContext

**Augmented (precedence resolution, transformation, computed):**

```typescript
bc.effectiveRole         // Inline header (`as`) → body (`role:`) precedence
bc.effectiveTeam         // Inline header (`by`) → body (`team:`) precedence  
bc.metadataMap           // Metadata entries as ReadonlyMap<string, string>
bc.fqn                   // Computed fully qualified name
bc.hasRole('Core')       // Check if role matches
bc.hasTeam('SalesTeam')  // Check if team matches
bc.hasMetadata('Lang')   // Check if metadata key exists
```

**Direct AST access (no augmentation needed):**

```typescript
bc.description           // Direct string property
bc.businessModel?.ref    // Direct reference to Classification
bc.lifecycle?.ref        // Direct reference to Classification
bc.relationships         // Direct array of Relationship
bc.terminology           // Direct array of DomainTerm
bc.decisions             // Direct array of AbstractDecision
```

### Domain

**Augmented (computed):**

```typescript
domain.fqn                    // Computed fully qualified name
domain.hasClassification('Core')  // Check classification matches
```

**Direct AST access (no augmentation needed):**

```typescript
domain.description       // Direct string property
domain.vision            // Direct string property
domain.classification?.ref  // Direct reference to Classification
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
  console.log(`${bc.fqn}: ${bc.description ?? 'n/a'}`);
  console.log(`  Team: ${bc.effectiveTeam?.name ?? 'unassigned'}`);
  console.log(`  Lifecycle: ${bc.lifecycle?.ref?.name ?? 'n/a'}`);
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
  .where(bc => bc.description !== undefined)
  .toArray()
  .map(bc => ({
    fqn: bc.fqn,
    description: bc.description,
    team: bc.effectiveTeam?.name,
    metadata: Object.fromEntries(bc.metadataMap),
  }));

console.log(JSON.stringify(docs, null, 2));
```

## Resolution Rules

The SDK provides precedence resolution **only for properties with multiple assignment locations**:

| Augmented Property | Precedence | Why Augmented |
| --- | --- | --- |
| `bc.effectiveRole` | Header inline (`as`) → body (`role:`) | Array-based precedence |
| `bc.effectiveTeam` | Header inline (`by`) → body (`team:`) | Array-based precedence |
| `bc.metadataMap` | Later entries override earlier | Array to Map conversion |

**Direct access (no precedence needed):**

| Property | Access Pattern | Why Direct |
| --- | --- | --- |
| `bc.description` | Direct | Single location |
| `bc.businessModel?.ref` | Direct reference | Single location |
| `bc.lifecycle?.ref` | Direct reference | Single location |
| `domain.description` | Direct | Single location |
| `domain.vision` | Direct | Single location |
| `domain.classification?.ref` | Direct reference | Single location |

## Performance

- **O(1) lookups**: `byFqn()`, indexed team/role/metadata filters
- **Lazy iteration**: QueryBuilder chains don't materialize until consumed
- **Zero-copy**: `fromModel()` / `fromDocument()` reuse existing AST

## Architecture

The SDK is an **internal module** within the language package:

```text
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

- `effectiveRole`, `effectiveTeam`, `metadataAsMap`, etc.
- `buildIndexes`, `buildFqnIndex`, etc.
- Implementation classes

Use SDK-augmented properties (`bc.effectiveRole`) instead of calling resolution functions directly.
