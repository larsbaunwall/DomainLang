# Performance Optimization Guidelines

## Performance Philosophy

Language servers must be **fast and responsive** because they run on every keystroke. Performance is a critical feature, not an optimization to add later.

## Performance Targets

### LSP Operations

- **Parsing**: < 100ms for typical files (< 1000 lines)
- **Validation**: < 200ms for typical files
- **Completion**: < 50ms to show suggestions
- **Hover**: < 20ms to show tooltip
- **Go-to-definition**: < 30ms to navigate

### Workspace Operations

- **Initial build**: < 5s for typical projects (< 100 files)
- **Incremental build**: < 500ms for single file change
- **Cross-file validation**: < 1s for typical projects

## Common Performance Pitfalls

### 1. Expensive Scope Computation

**Problem:** `ScopeComputation` runs frequently (on every document build)

❌ **Bad:**
```typescript
export class SlowScopeComputation extends DefaultScopeComputation {
    protected override computeExports(document: LangiumDocument): AstNodeDescription[] {
        // Traverses entire AST on every call
        const exports: AstNodeDescription[] = [];
        streamAllContents(document.parseResult.value).forEach(node => {
            if (isDomain(node)) {
                // Expensive operation
                const qualifiedName = this.computeQualifiedName(node);
                exports.push(this.descriptions.createDescription(node, qualifiedName));
            }
        });
        return exports;
    }
}
```

✅ **Good:**
```typescript
export class FastScopeComputation extends DefaultScopeComputation {
    protected override computeExports(document: LangiumDocument): AstNodeDescription[] {
        // Only traverse exportable nodes
        const exports: AstNodeDescription[] = [];
        for (const child of document.parseResult.value.children) {
            if (this.isExportable(child)) {
                exports.push(this.descriptions.createDescription(child, child.name));
            }
        }
        return exports;
    }
}
```

### 2. Repeated Computations Without Caching

**Problem:** Computing the same value multiple times

❌ **Bad:**
```typescript
export class SlowQualifiedNameProvider {
    getQualifiedName(node: AstNode): string | undefined {
        // Recomputes on every call
        let name = node.name;
        let container = node.$container;
        while (container) {
            name = `${container.name}.${name}`;
            container = container.$container;
        }
        return name;
    }
}
```

✅ **Good:**
```typescript
export class CachedQualifiedNameProvider {
    private cache = new WorkspaceCache<AstNode, string>(this.services.shared);

    getQualifiedName(node: AstNode): string | undefined {
        return this.cache.get(getDocument(node).uri, () => {
            let name = node.name;
            let container = node.$container;
            while (container) {
                name = `${container.name}.${name}`;
                container = container.$container;
            }
            return name;
        });
    }
}
```

### 3. Sequential Async Operations

**Problem:** Waiting for each async operation to complete

❌ **Bad:**
```typescript
async function processDocuments(documents: LangiumDocument[]): Promise<void> {
    for (const doc of documents) {
        await processDocument(doc); // Waits for each!
    }
}
```

✅ **Good:**
```typescript
async function processDocuments(documents: LangiumDocument[]): Promise<void> {
    // Process all in parallel
    await Promise.all(documents.map(doc => processDocument(doc)));
}
```

### 4. Inefficient AST Traversal

**Problem:** Traversing the entire AST when only specific nodes are needed

❌ **Bad:**
```typescript
function findDomains(model: Model): Domain[] {
    const domains: Domain[] = [];
    streamAllContents(model).forEach(node => {
        if (isDomain(node)) {
            domains.push(node);
        }
    });
    return domains;
}
```

✅ **Good:**
```typescript
function findDomains(model: Model): Domain[] {
    // Only check direct children
    return model.children.filter(isDomain);
}
```

### 5. Creating New Objects in Hot Paths

**Problem:** Allocating objects in frequently-called code

❌ **Bad:**
```typescript
function getScope(context: ReferenceInfo): Scope {
    // Creates new array on every call
    const elements = [...this.localScope, ...this.globalScope];
    return new MapScope(elements);
}
```

✅ **Good:**
```typescript
private cachedScope: Scope | undefined;

function getScope(context: ReferenceInfo): Scope {
    if (!this.cachedScope) {
        const elements = [...this.localScope, ...this.globalScope];
        this.cachedScope = new MapScope(elements);
    }
    return this.cachedScope;
}
```

## Optimization Techniques

### 1. Use WorkspaceCache

Langium provides `WorkspaceCache` for automatic invalidation:

```typescript
import { WorkspaceCache } from 'langium';

export class CachedValidator {
    private cache = new WorkspaceCache<string, ValidationResult>(this.services.shared);

    validate(document: LangiumDocument): ValidationResult {
        return this.cache.get(document.uri.toString(), () => {
            // Expensive validation
            return this.performValidation(document);
        });
    }
}
```

**Benefits:**
- Automatic invalidation on document changes
- Per-document caching
- Memory-efficient (WeakMap-based)

### 2. Parallel Async Operations

Use `Promise.all()` for parallel execution:

```typescript
// Process multiple documents in parallel
const results = await Promise.all([
    processDocument(doc1),
    processDocument(doc2),
    processDocument(doc3)
]);

// Process array in parallel
const processed = await Promise.all(
    documents.map(doc => processDocument(doc))
);
```

### 3. Lazy Evaluation

Defer expensive computations until needed:

```typescript
class LazyQualifiedName {
    private _qualifiedName: string | undefined;

    get qualifiedName(): string {
        if (this._qualifiedName === undefined) {
            this._qualifiedName = this.computeQualifiedName();
        }
        return this._qualifiedName;
    }
}
```

### 4. Batch Processing

Process items in batches to avoid memory issues:

```typescript
async function processManyDocuments(documents: LangiumDocument[]): Promise<void> {
    const BATCH_SIZE = 10;
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(processDocument));
        // Optional: yield to event loop
        await new Promise(resolve => setImmediate(resolve));
    }
}
```

### 5. Early Returns

Exit early when possible:

```typescript
function validateDomain(domain: Domain): Diagnostic[] {
    // Quick checks first
    if (!domain.name) {
        return [createError('Domain must have a name')];
    }

    // Early return if no parent
    if (!domain.parentDomain) {
        return [];
    }

    // Expensive check only if needed
    return checkCircularReference(domain);
}
```

### 6. Efficient Data Structures

Choose the right data structure:

```typescript
// ✅ Use Set for membership testing
const visited = new Set<Domain>();
if (visited.has(domain)) { /* O(1) */ }

// ❌ Don't use Array for membership testing
const visited: Domain[] = [];
if (visited.includes(domain)) { /* O(n) */ }

// ✅ Use Map for lookups
const domainsByName = new Map<string, Domain>();
const domain = domainsByName.get('Sales'); // O(1)

// ❌ Don't use Array for lookups
const domains: Domain[] = [];
const domain = domains.find(d => d.name === 'Sales'); // O(n)
```

### 7. Stream Operations

Use Langium's streaming utilities for large collections:

```typescript
import { streamAllContents, AstUtils } from 'langium';

// ✅ Stream (lazy evaluation)
streamAllContents(root)
    .filter(isDomain)
    .map(d => d.name)
    .take(10); // Only processes first 10

// ❌ Array (eager evaluation)
const all = [];
for (const node of streamAllContents(root)) {
    all.push(node);
}
const domains = all.filter(isDomain).map(d => d.name).slice(0, 10);
```

## Profiling Performance

### CLI Profiling

Use the `--profile` flag:

```bash
domain-lang-cli generate example.dlang --profile
```

Output:
```
🔍 Performance profiling enabled
Parsing: 45ms
Linking: 23ms
Validation: 12ms
Generation: 8ms
Total: 88ms
```

### Manual Profiling

```typescript
import { performance } from 'node:perf_hooks';

function measurePerformance<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    console.log(`${name}: ${duration.toFixed(2)}ms`);
    return result;
}

// Usage
const ast = measurePerformance('Parsing', () => parse(content));
```

### Node.js Profiler

Use Node.js built-in profiler:

```bash
node --prof domain-lang-cli generate example.dlang
node --prof-process isolate-*.log > profile.txt
```

### Chrome DevTools

For browser-based profiling (Monaco demo):

1. Open DevTools
2. Performance tab
3. Record while interacting
4. Analyze flame graph

## Performance Testing

### Benchmark Tests

```typescript
import { performance } from 'node:perf_hooks';

describe('Performance', () => {
    test('parse 1000 domains in < 1 second', async () => {
        const input = Array.from({ length: 1000 }, (_, i) =>
            `Domain Domain${i} {}`
        ).join('\n');

        const start = performance.now();
        const document = await parse(input);
        const duration = performance.now() - start;

        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(duration).toBeLessThan(1000);
    });

    test('validate 100 contexts in < 500ms', async () => {
        const input = `
            Domain Sales {}
            ${Array.from({ length: 100 }, (_, i) =>
                `Context Context${i} for Sales {}`
            ).join('\n')}
        `;

        const start = performance.now();
        const document = await parse(input);
        await services.shared.workspace.DocumentBuilder.build([document]);
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(500);
    });
});
```

### Memory Profiling

```typescript
test('memory usage for large model', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Parse large model
    const input = generateLargeModel(10000);
    await parse(input);

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;

    console.log(`Memory increase: ${memoryIncrease.toFixed(2)} MB`);
    expect(memoryIncrease).toBeLessThan(100); // < 100 MB
});
```

## Performance Checklist

Before committing performance-sensitive code:

- [ ] Used `WorkspaceCache` for expensive computations
- [ ] Parallel async operations with `Promise.all()`
- [ ] No redundant AST traversals
- [ ] Efficient data structures (Set, Map)
- [ ] Early returns where possible
- [ ] Lazy evaluation for expensive properties
- [ ] Tested with large models (1000+ elements)
- [ ] Profiled with `--profile` flag
- [ ] No memory leaks (WeakMap/WeakSet for caches)

## Performance Budgets

Set performance budgets for critical operations:

| Operation | Budget | Critical |
|-----------|--------|----------|
| Parse typical file | 100ms | Yes |
| Validate typical file | 200ms | Yes |
| Completion | 50ms | Yes |
| Hover | 20ms | Yes |
| Full workspace build | 5s | No |
| Single file incremental | 500ms | Yes |

Treat budget violations as bugs.

## Common Performance Questions

### Q: When should I cache?

A: Cache when:
- Computation is expensive (> 10ms)
- Result is reused frequently
- Input doesn't change often
- Memory cost is acceptable

### Q: When should I use parallel execution?

A: Use `Promise.all()` when:
- Operations are independent
- Order doesn't matter
- Network I/O or file I/O involved
- Processing multiple items

### Q: How do I profile LSP operations?

A: Enable LSP tracing in VS Code:
```json
"domain-lang.trace.server": "verbose"
```

Check "Output" panel → "DomainLang Language Server"

### Q: What's the overhead of caching?

A: Minimal if using `WorkspaceCache`:
- O(1) lookup with WeakMap
- Automatic invalidation
- No manual cleanup needed

### Q: Should I optimize everything?

A: No. Focus on:
- Hot paths (called frequently)
- LSP operations (user-facing latency)
- Workspace operations (affects startup)

Don't optimize:
- One-time setup code
- Error handling paths
- CLI commands (unless clearly slow)

## Resources

- **Langium Performance Guide**: https://langium.org/docs/recipes/performance/
- **Node.js Profiling**: https://nodejs.org/en/docs/guides/simple-profiling/
- **Chrome DevTools**: https://developer.chrome.com/docs/devtools/performance/

## Anti-Patterns

### ❌ Premature Optimization

```
❌ Don't optimize without measuring
✅ Profile first, then optimize
```

### ❌ Micro-Optimizations

```
❌ Optimizing loop that runs once
✅ Focus on operations that run frequently
```

### ❌ Caching Everything

```
❌ Cache all computations "just in case"
✅ Cache only expensive operations
```

### ❌ Ignoring Memory

```
❌ Caching with Map (never releases memory)
✅ Use WeakMap or WorkspaceCache (automatic cleanup)
```
