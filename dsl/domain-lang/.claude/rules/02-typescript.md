# TypeScript Guidelines for DomainLang

## Core Principles

- **TypeScript strict mode** - No exceptions
- **Prefer functional programming** over classes (except for Langium services)
- **Strong typing** - Avoid `any` and `unknown` without justification
- **Inspect the AST** to find proper types instead of using type assertions
- **Import types separately** - Use `import type` for type-only imports
- **Descriptive names** with auxiliary verbs (e.g., `isLoaded`, `hasError`)

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes | PascalCase | `DomainLangValidator` |
| Interfaces | PascalCase | `ValidationContext` |
| Types | PascalCase | `DomainElement` |
| Variables | camelCase | `documentUri` |
| Functions | camelCase | `parseDocument` |
| Methods | camelCase | `resolveImport` |
| Files/Directories | kebab-case | `domain-lang-validator.ts` |
| Constants | UPPERCASE | `MAX_DEPTH` |
| Environment Variables | UPPERCASE | `NODE_ENV` |

## Type System

### Prefer Interfaces Over Types

```typescript
// Good: Interface for objects
interface ValidationResult {
    readonly isValid: boolean;
    readonly errors: string[];
}

// Types for unions, intersections, and primitives
type Status = 'pending' | 'success' | 'error';
type WithMetadata<T> = T & { metadata: Record<string, unknown> };
```

### Use `readonly` for Immutability

```typescript
interface Domain {
    readonly name: string;
    readonly description?: string;
    readonly contexts: readonly BoundedContext[];
}
```

### Avoid Enums - Use Const Objects

```typescript
// Good: Const object with type
const RelationshipType = {
    Partnership: 'Partnership',
    SharedKernel: 'SharedKernel',
    CustomerSupplier: 'CustomerSupplier',
    UpstreamDownstream: 'UpstreamDownstream',
} as const;

type RelationshipType = typeof RelationshipType[keyof typeof RelationshipType];

// Bad: Enum
enum RelationshipType {
    Partnership,
    SharedKernel
}
```

### Avoid Type Assertions - Use Type Guards

```typescript
// Good: Type guard
function isDomain(node: AstNode): node is Domain {
    return node.$type === 'Domain';
}

if (isDomain(element)) {
    // element is typed as Domain here
}

// Bad: Type assertion
const domain = element as Domain;
```

### Import Types Separately

```typescript
// Good: Separate type imports
import type { AstNode, LangiumDocument } from 'langium';
import { AstUtils } from 'langium';

// Acceptable: Combined when both needed
import { AstUtils, type AstNode } from 'langium';
```

## Functions and Documentation

### Use Arrow Functions for Simple Operations

```typescript
// Good: Arrow function for callbacks
const names = domains.map(d => d.name);

// Good: Named function for complex logic
function validateCircularReferences(domain: Domain, visited: Set<Domain>): boolean {
    if (visited.has(domain)) return false;
    visited.add(domain);
    // ... complex validation logic
    return true;
}
```

### Default Parameters and Destructuring

```typescript
// Good: Default parameters
function parseDocument(content: string, options: ParseOptions = {}): Model {
    const { validate = true, resolveImports = true } = options;
    // ...
}

// Good: Destructuring in parameters
function formatNode({ name, description }: { name: string; description?: string }): string {
    return description ? `${name}: ${description}` : name;
}
```

### Document Public APIs with JSDoc

**IMPORTANT:** JSDoc comments appear in hover tooltips in the IDE.

Use TypeDoc-compatible tags:
- `@param` - Parameter description
- `@returns` - Return value description
- `@throws` - Exceptions thrown
- `@example` - Usage example
- `@deprecated` - Mark deprecated APIs

```typescript
/**
 * Parses a DomainLang document and returns the AST.
 *
 * @param content - The raw DomainLang source code
 * @param options - Optional parsing configuration
 * @returns The parsed abstract syntax tree
 * @throws {ParseError} When the content contains syntax errors
 *
 * @example
 * ```typescript
 * const ast = parseDocument('Domain Sales {}');
 * ```
 */
export function parseDocument(
    content: string,
    options?: ParseOptions
): Model {
    // implementation
}
```

## Performance Optimization

### Parallel Async Operations

```typescript
// Good: Parallel processing with Promise.all()
const results = await Promise.all(
    documents.map(doc => processDocument(doc))
);

// Bad: Sequential processing
const results = [];
for (const doc of documents) {
    results.push(await processDocument(doc)); // Waits for each!
}
```

### Leverage Lodash for Complex Operations

```typescript
import _ from 'lodash';

// Good: Lodash for grouping
const contextsByDomain = _.groupBy(contexts, 'domain.name');

// Good: Lodash for deep operations
const merged = _.merge({}, defaultConfig, userConfig);
```

### Batch Processing for Large Datasets

```typescript
// Good: Process in batches to avoid memory issues
async function processLargeDataset(items: Item[]): Promise<void> {
    const BATCH_SIZE = 100;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(processBatch));
    }
}
```

## Error Handling

### Handle Expected Failures Explicitly

```typescript
// Good: Typed result pattern
type Result<T, E = Error> =
    | { success: true; value: T }
    | { success: false; error: E };

function parseModel(content: string): Result<Model, ParseError> {
    try {
        const model = parse(content);
        return { success: true, value: model };
    } catch (error) {
        return { success: false, error: new ParseError(error) };
    }
}
```

### Never Suppress Errors Silently

```typescript
// Good: Log or rethrow
try {
    await processFile(path);
} catch (error) {
    console.error('Failed to process file:', path, error);
    throw new ProcessingError(`Cannot process ${path}`, { cause: error });
}

// Bad: Silent catch
try {
    await processFile(path);
} catch (error) {
    // Nothing - error is lost!
}
```

## Common Patterns

### Immutability

```typescript
// Good: Returns new object, doesn't mutate
function updateDomain(domain: Domain, description: string): Domain {
    return { ...domain, description };
}

// Bad: Mutates parameter
function updateDomain(domain: Domain, description: string): void {
    domain.description = description;
}
```

### Optional Chaining and Nullish Coalescing

```typescript
// Good: Safe navigation with ?.
const contextName = document?.model?.contexts?.[0]?.name;

// Good: Default values with ??
const displayName = userName ?? 'Anonymous';

// Don't confuse with ||
const count = userCount ?? 0; // 0 is valid
const bad = userCount || 0;   // 0 becomes 0 (unexpected)
```

### Composition Over Inheritance

```typescript
// Good: Composition with interfaces
interface Movable {
    move(): void;
}

interface Barkable {
    bark(): void;
}

const dog: Movable & Barkable = {
    move: () => console.log('Running'),
    bark: () => console.log('Woof!')
};

// Avoid: Deep class hierarchies
class Animal {}
class Mammal extends Animal {}
class Canine extends Mammal {}
class Dog extends Canine {}
```

### Discriminated Unions

```typescript
// Good: Discriminated union for AST nodes
type Expression =
    | { kind: 'literal'; value: string | number }
    | { kind: 'binary'; left: Expression; op: string; right: Expression }
    | { kind: 'reference'; name: string };

function evaluate(expr: Expression): number {
    switch (expr.kind) {
        case 'literal':
            return typeof expr.value === 'number' ? expr.value : 0;
        case 'binary':
            return evaluateBinary(expr.left, expr.op, expr.right);
        case 'reference':
            return lookupVariable(expr.name);
    }
}
```

## Anti-Patterns to Avoid

❌ **Using `any` or `unknown` without justification**
```typescript
// Bad
function process(data: any) { }

// Good
function process(data: unknown) {
    if (typeof data === 'string') {
        // Type narrowed to string
    }
}
```

❌ **Type assertions instead of proper type guards**
```typescript
// Bad
const domain = node as Domain;

// Good
if (isDomain(node)) {
    // node is Domain here
}
```

❌ **Classes when functions suffice**
```typescript
// Bad: Unnecessary class
class StringUtils {
    static capitalize(s: string): string { }
}

// Good: Simple function
export function capitalize(s: string): string { }
```

❌ **Inline side effects**
```typescript
// Bad
const result = calculate() && saveToDatabase();

// Good
const result = calculate();
if (result) {
    saveToDatabase();
}
```

❌ **Mutating function parameters**
```typescript
// Bad
function addContext(domain: Domain, context: BoundedContext): void {
    domain.contexts.push(context);
}

// Good
function addContext(domain: Domain, context: BoundedContext): Domain {
    return {
        ...domain,
        contexts: [...domain.contexts, context]
    };
}
```

❌ **Magic numbers and strings**
```typescript
// Bad
if (status === 3) { }

// Good
const Status = { Completed: 3 } as const;
if (status === Status.Completed) { }
```

## Module Organization

### File Structure

```typescript
// 1. Type imports
import type { AstNode, LangiumDocument } from 'langium';

// 2. Value imports
import { AstUtils } from 'langium';
import { someUtility } from './utils.js';

// 3. Type definitions
interface LocalType { }

// 4. Constants
const CONSTANT = 42;

// 5. Functions
export function mainFunction() { }

// 6. Helper functions (not exported)
function helperFunction() { }
```

### Use `.js` Extensions in Imports

**Important for ESM compatibility:**

```typescript
// Good: Include .js extension
import { parse } from './parser.js';

// Bad: Omit extension
import { parse } from './parser';
```

TypeScript will resolve `.ts` files, but the emitted JS needs `.js` extensions.
