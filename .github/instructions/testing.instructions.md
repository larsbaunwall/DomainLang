---
description: 'Testing guidelines for DomainLang using Vitest and Langium test utilities'
applyTo: "**/*.test.ts"
---

# Testing Guidelines

> Guidelines for writing tests in DomainLang using Vitest and Langium test utilities.

## Core Intent

- Every new feature or bug fix requires tests
- Tests document expected behavior; write readable tests
- Use provided test helpers; they handle cleanup and validation
- Test one thing per test; keep tests focused

## Essential Rules

- **Always add tests** for new behavior (happy path + edge cases + errors)
- **Use `setupTestSuite()`** from `test-helpers.ts` for automatic cleanup
- **Use validation helpers** instead of manual error checks
- **One assertion focus** per test
- **Never change original code** just to make it easier to test

## Test Setup

Tests should follow the Arrange-Act-Assert pattern. Here's a basic example:

```typescript
import { describe, test, beforeAll, expect } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, s } from '../test-helpers.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();  // Handles cleanup automatically
});

test('parse domain', async () => {
    // Arrange
    const document = await testServices.parse(s`
        Domain Sales {
            vision: "Handle sales operations"
        }
    `);

    // Act & Assert
    expectValidDocument(document);
});
```

## Key Utilities from `test-helpers.ts`

| Utility | Purpose |
|---------|---------|
| `setupTestSuite()` | Test setup with automatic cleanup |
| `expectValidDocument(doc)` | Assert no parse/validation errors |
| `expectValidationErrors(doc, [...])` | Assert specific errors present |
| `expectValidationWarnings(doc, [...])` | Assert specific warnings present |
| `getFirstDomain(doc)` | Extract first Domain from AST |
| `getFirstBoundedContext(doc)` | Extract first BC from AST |
| `s\`...\`` | Template helper for readable multi-line input |

## Testing Patterns

### Parsing Tests

```typescript
test('parse domain with vision', async () => {
    // Arrange
    const document = await testServices.parse(s`
        Domain Sales { vision: "Handle sales" }
    `);

    expectValidDocument(document);
    
    // Act
    const domain = getFirstDomain(document);
    
    // Assert
    expect(domain.name).toBe('Sales');
});
```

### Validation Tests

```typescript
test('warns when domain lacks vision', async () => {
    // Arrange
    const document = await testServices.parse(s`
        Domain Sales { description: "Sales operations" }
    `);

    // Act & Assert
    expectValidationWarnings(document, [
        "Domain 'Sales' has no domain vision"
    ]);
});

test('detects duplicate names', async () => {
    // Arrange
    const document = await testServices.parse(s`
        Classification Core
        Classification Core
    `);

    // Act & Assert
    expectValidationErrors(document, [
        "This element is already defined elsewhere"
    ]);
});
```

### Linking Tests

```typescript
test('resolve domain reference', async () => {
    // Arrange
    const document = await testServices.parse(s`
        Domain Sales {}
        BoundedContext Orders for Sales {}
    `);

    expectValidDocument(document);
    
    // Act
    const bc = getFirstBoundedContext(document);
    
    // Assert
    expect(bc.domain?.ref).toBeDefined();
    expect(bc.domain?.ref?.name).toBe('Sales');
});
```

### Forward Reference Tests

```typescript
test('handles forward references', async () => {
    // Arrange
    const document = await testServices.parse(s`
        BoundedContext Orders for Sales {}  // Sales not defined yet
        Domain Sales {}                      // Defined after reference
    `);

    expectValidDocument(document);
    
    // Act
    const bc = getFirstBoundedContext(document);
    
    // Assert
    expect(bc.domain?.ref?.name).toBe('Sales');
});
```

### MultiReference Tests

```typescript
test('ContextMap references multiple same-named BCs', async () => {
    // Arrange
    const document = await testServices.parse(s`
        Domain Sales {}
        Domain Billing {}
        BC Orders for Sales {}
        BC Orders for Billing {}
        
        ContextMap AllOrders { contains Orders }
    `);

    expectValidDocument(document);
    
    // Act
    const contextMap = document.parseResult.value.children
        .find(c => isContextMap(c)) as ContextMap;
    
    // Assert
    expect(contextMap.boundedContexts[0].items.length).toBe(2);
});
```

## Test Organization

```
test/
├── test-helpers.ts        # Always use this!
├── parsing/               # Grammar parsing tests
├── linking/               # Cross-reference tests
├── validating/            # Validation rule tests
├── scoping/               # Scope computation tests
├── services/              # Service layer tests
└── multireference/        # Multi-reference tests
```

## Service Tests (with File System)

For testing services that interact with the file system:

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

describe('DependencyAnalyzer', () => {
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dlang-test-'));
    });

    afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    test('builds tree from lock file', async () => {
        const lockFile = { version: '1', dependencies: {} };
        const tree = await analyzer.buildDependencyTree(lockFile, tempDir);
        expect(tree).toEqual([]);
    });
});
```

## Using Test Fixtures

```typescript
import { TestFixtures } from '../test-helpers.js';

test('domain hierarchy', async () => {
    const document = await testServices.parse(TestFixtures.domainHierarchy());
    expectValidDocument(document);
});
```

Available: `basicDomain()`, `domainHierarchy()`, `fullBoundedContext()`, `contextMapWithRelationships()`, `complexExample()`

## Debugging

```typescript
import { getDocumentErrors, getDiagnosticsBySeverity } from '../test-helpers.js';

test('debug parse errors', async () => {
    const document = await testServices.parse(s`Domain { }`);
    
    const errors = getDocumentErrors(document);
    console.log('Errors:', errors);
    
    // Severity: 1=Error, 2=Warning, 3=Info
    const warnings = getDiagnosticsBySeverity(document, 2);
    console.log('Warnings:', warnings.map(w => w.message));
});
```

## Manual Setup (Special Cases)

For cases requiring manual service configuration:

```typescript
import { parseHelper, clearDocuments } from 'langium/test';
import { createDomainLangServices } from '../../src/domain-lang-module.js';
import { EmptyFileSystem } from 'langium';

let services: ReturnType<typeof createDomainLangServices>;
let parse: ReturnType<typeof parseHelper<Model>>;

beforeAll(async () => {
    services = createDomainLangServices(EmptyFileSystem);
    const doParse = parseHelper<Model>(services.DomainLang);
    parse = (input: string) => doParse(input, { validation: true });
});

afterEach(() => {
    clearDocuments(services.shared, []);  // Required for manual setup!
});
```

## Skipping Tests with TODO

Document acceptance criteria for when to unskip:

```typescript
test.skip('MultiReference with qualified names', async () => {
    // TODO: Acceptance criteria to unskip:
    //  - ScopeProvider supports qualified name resolution
    //  - Workspace fixture provides namespace-aware symbols
});
```

## Data-Driven Tests

Use `test.each` for parameterized tests with multiple inputs:

```typescript
test.each([
    ['Domain', 'Domain Sales {}'],
    ['BoundedContext', 'Domain Sales {} BC Orders for Sales {}'],
    ['Team', 'Team Backend {}'],
])('should parse %s construct', async (name, input) => {
    const document = await testServices.parse(input);
    expectValidDocument(document);
});

// With expected outcomes
test.each([
    { input: 'Domain {}', error: 'expecting ID' },
    { input: 'BC Orders for {}', error: 'expecting QualifiedName' },
])('should reject invalid: $input', async ({ input, error }) => {
    const document = await testServices.parse(input);
    expect(getDocumentErrors(document).some(e => e.includes(error))).toBe(true);
});
```

## Performance Testing

```typescript
test('handles large number of elements', async () => {
    const domains = Array.from({ length: 50 }, (_, i) => 
        `Domain Domain${i} {}`
    ).join('\n');
    
    const bcs = Array.from({ length: 100 }, (_, i) => 
        `BoundedContext BC${i} for Domain${i % 50}`
    ).join('\n');
    
    const document = await testServices.parse(s`
        ${domains}
        ${bcs}
    `);

    expectValidDocument(document);
    expect(getAllBoundedContexts(document)).toHaveLength(100);
});
```

## Best Practices

### ✅ DO

- Use `setupTestSuite()` for automatic cleanup
- Use `s\`...\`` for readable multi-line input
- Use `expectValidDocument()` for basic validation
- Use type guards before accessing AST properties
- Test one thing per test
- Follow Arrange-Act-Assert pattern
- Document skipped tests with acceptance criteria
- Name tests descriptively: `test('should X when Y', ...)`

### ❌ DON'T

- Call `clearDocuments()` when using `setupTestSuite()`
- Test implementation details
- Skip edge cases and error scenarios
- Share mutable state between tests
- Use `DocumentBuilder.build()` explicitly
- Use vague test names like `test('test1', ...)`
- Write tests that always pass

## Quality Checklist

Before finalizing tests, ensure:
- [ ] All happy path scenarios covered
- [ ] Edge cases tested (empty input, large input, special characters)
- [ ] Error scenarios validated with `expectValidationErrors()`
- [ ] Tests follow naming convention: `should X when Y`
- [ ] No shared mutable state between tests
- [ ] Tests are independent and can run in any order
- [ ] Async operations properly awaited

## Coverage Goals

- **80%+** overall code coverage
- **100%** for validation rules
- **100%** for grammar parsing

## Test Execution Strategy

1. **Write test** — Start with failing test (red)
2. **Implement** — Write minimal code to pass (green)
3. **Refactor** — Clean up while tests pass
4. **Validate** — Run full test suite before committing
5. **Coverage** — Check coverage for new code paths

## Validation

Before committing test changes:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx vitest run packages/language/test/parsing/domain.test.ts

# Run tests in watch mode during development
npx vitest --watch
```

## Decision Framework

| Scenario | Test Type | Helper |
|----------|-----------|--------|
| Grammar parsing | Parsing test | `testServices.parse()`, `expectValidDocument()` |
| Cross-references | Linking test | Check `ref` property is defined |
| Validation rules | Validation test | `expectValidationErrors()`, `expectValidationWarnings()` |
| Multiple same-named refs | MultiReference test | Check `items.length` |
| File system interactions | Service test | Use `beforeEach`/`afterEach` for temp dirs |
