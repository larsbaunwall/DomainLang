---
description: 'TypeScript coding standards for DomainLang DSL development with Langium 4.x'
applyTo: "**/*.ts,**/*.tsx,**/*.mts,**/*.cts"
---

# TypeScript Development

> These instructions target TypeScript 5.x with strict mode enabled for Langium 4.x DSL development. Sources live in `dsl/domain-lang/packages/{language,cli,extension,demo}/src/`.

## Core Intent

- Respect existing architecture and Langium conventions
- Prefer readable, explicit solutions over clever shortcuts
- Extend current abstractions before inventing new ones
- Prioritize maintainability and clarity in all code

## General Guardrails

- Target TypeScript 5.x with strict mode; no exceptions
- Use pure ES modules; always use `.js` extensions in imports
- Rely on the project's build, lint, and test scripts
- Note design trade-offs when intent is not obvious

## Scope and Exemptions

**Full rules apply to:**
- Language services (validation, scoping, LSP features)
- CLI implementation
- Core utilities and helpers

**Relaxed rules for:**
- Test files — can use `any` for mocks, simpler patterns allowed
- Generated code — never edit, always regenerate
- Configuration files — pragmatic approach acceptable

## Coding Standards

- Use functional programming patterns except for Langium services
- Avoid `any`; prefer `unknown` with type narrowing
- Use type guards over type assertions
- Separate type imports using `import type`

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes/Interfaces/Types | PascalCase | `DomainLangValidator` |
| Variables/Functions/Methods | camelCase | `parseDocument` |
| Files/Directories | kebab-case | `domain-lang-validator.ts` |
| Constants | UPPERCASE | `MAX_DEPTH` |

## Type System

### Use Type Guards Over Assertions

```typescript
// ✅ Correct: Use generated Langium guards
import { isDomain, isBoundedContext } from '../generated/ast.js';

if (isDomain(element)) {
    console.log(element.name);  // Properly typed
}

// ❌ Avoid: Type assertions
const domain = element as Domain;
```

### Prefer Interfaces for Objects

```typescript
// ✅ Interface for object shapes
interface ValidationResult {
    readonly isValid: boolean;
    readonly errors: string[];
}

// ✅ Type for unions/intersections
type Status = 'pending' | 'success' | 'error';
```

### Avoid Enums - Use Const Objects

```typescript
// ✅ Const object with type
const RelationshipType = {
    Partnership: 'Partnership',
    SharedKernel: 'SharedKernel',
} as const;

type RelationshipType = typeof RelationshipType[keyof typeof RelationshipType];

// ❌ Avoid enums
enum RelationshipType { Partnership, SharedKernel }
```

### Use `readonly` for Immutability

```typescript
interface Domain {
    readonly name: string;
    readonly contexts: readonly BoundedContext[];
}
```

## Import Patterns

```typescript
// ✅ Separate type imports
import type { AstNode, LangiumDocument } from 'langium';
import { AstUtils } from 'langium';

// ✅ Always use .js extensions (ESM compatibility)
import { parse } from './parser.js';
```

## Functions

### Arrow Functions for Simple Operations

```typescript
const names = domains.map(d => d.name);
```

### Named Functions for Complex Logic

```typescript
function validateCircularReferences(domain: Domain, visited: Set<Domain>): boolean {
    if (visited.has(domain)) return false;
    visited.add(domain);
    // ... complex logic
    return true;
}
```

### Document Public APIs with JSDoc

```typescript
/**
 * Parses a DomainLang document.
 *
 * @param content - Raw source code
 * @returns Parsed AST
 * @throws {ParseError} On syntax errors
 */
export function parseDocument(content: string): Model { }
```

## Error Handling

### Use Typed Results

```typescript
type Result<T, E = Error> =
    | { success: true; value: T }
    | { success: false; error: E };

function parseModel(content: string): Result<Model, ParseError> {
    try {
        return { success: true, value: parse(content) };
    } catch (error) {
        return { success: false, error: new ParseError(error) };
    }
}
```

### Never Suppress Errors

```typescript
// ✅ Log or rethrow
try {
    await processFile(path);
} catch (error) {
    console.error('Failed:', path, error);
    throw new ProcessingError(`Cannot process ${path}`, { cause: error });
}

// ❌ Never silent catch
try { await processFile(path); } catch { }
```

## Common Patterns

### Immutability

```typescript
// ✅ Return new object
function updateDomain(domain: Domain, description: string): Domain {
    return { ...domain, description };
}

// ❌ Don't mutate parameters
function updateDomain(domain: Domain, description: string): void {
    domain.description = description;  // Mutation!
}
```

### Early Returns and Guard Clauses

```typescript
// ✅ Guard clauses reduce nesting
function validateDomain(domain: Domain | undefined): ValidationResult {
    if (!domain) return { isValid: false, errors: ['No domain'] };
    if (!domain.name) return { isValid: false, errors: ['Missing name'] };
    
    // Main logic at base indentation
    return { isValid: true, errors: [] };
}

// ❌ Avoid deep nesting
function validateDomain(domain: Domain | undefined): ValidationResult {
    if (domain) {
        if (domain.name) {
            return { isValid: true, errors: [] };
        }
    }
    return { isValid: false, errors: ['Invalid'] };
}
```

### Optional Chaining and Nullish Coalescing

```typescript
const name = document?.model?.contexts?.[0]?.name;
const displayName = userName ?? 'Anonymous';  // ?? not ||
```

### Parallel Async

```typescript
// ✅ Parallel with Promise.all
const results = await Promise.all(docs.map(d => process(d)));

// ❌ Sequential (slow)
for (const doc of docs) { await process(doc); }
```

### Discriminated Unions

```typescript
type Expression =
    | { kind: 'literal'; value: string | number }
    | { kind: 'binary'; left: Expression; op: string; right: Expression }
    | { kind: 'reference'; name: string };

function evaluate(expr: Expression): number {
    switch (expr.kind) {
        case 'literal': return typeof expr.value === 'number' ? expr.value : 0;
        case 'binary': return evaluateBinary(expr.left, expr.op, expr.right);
        case 'reference': return lookupVariable(expr.name);
    }
}
```

### Composition Over Inheritance

```typescript
// ✅ Composition with interfaces
interface Movable { move(): void; }
interface Nameable { name: string; }

const entity: Movable & Nameable = {
    name: 'Player',
    move: () => console.log('Moving')
};

// ❌ Avoid deep class hierarchies
class Animal {}
class Mammal extends Animal {}
class Dog extends Mammal {}  // Too deep
```

### Batch Processing

```typescript
async function processLargeDataset(items: Item[]): Promise<void> {
    const BATCH_SIZE = 100;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(processBatch));
    }
}
```

## Anti-Patterns

| ❌ Avoid | ✅ Prefer | Why |
|----------|----------|-----|
| `any` type | `unknown` with type narrowing | Preserves type safety |
| Type assertions (`as`) | Type guards (`isDomain()`) | Runtime validation |
| Enums | Const objects | Better tree-shaking, type inference |
| Classes for utilities | Simple functions | Easier to test, compose |
| Mutating parameters | Return new objects | Predictable state |
| Magic numbers | Named constants | Self-documenting code |
| Silent error catches | Log or rethrow | Never hide failures |
| Deep nesting | Early returns, guard clauses | Readability |
| Implicit dependencies | Dependency injection | Testability |

## Validation

Before committing TypeScript changes, verify:

```bash
# Build and type-check
npm run build

# Run tests
npm test

# Check for lint errors (if available)
npm run lint
```

## Decision Framework

Use this to decide between patterns:

| Scenario | Use |
|----------|-----|
| Data structure with behavior | Class (Langium service pattern) |
| Pure data transformation | Function |
| Configuration/constants | Const object with `as const` |
| State machine / variant types | Discriminated union |
| Optional properties | `undefined`, not `null` |
| Complex async operations | `async/await` with try/catch |
| Multiple async operations | `Promise.all` for parallelism |
