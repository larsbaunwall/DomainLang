# Testing Guidelines for DomainLang

## Testing Philosophy

- **Always add tests for new behavior** - No exceptions
- **Test happy path + edge cases + error scenarios**
- **Use LangiumTest utilities** for language features
- **Keep tests isolated** - Clear state between tests
- **Test at the right level** - Unit tests for services, integration tests for full workflows

## Testing Framework

DomainLang uses **Vitest** for all tests. Tests are organized by concern:

```
test/
├── parsing/               # Grammar parsing tests
├── linking/               # Cross-reference resolution tests
├── validating/            # Validation rule tests
├── services/              # Service layer tests
└── integration/           # End-to-end tests
```

## Key Commands

```bash
npm test                   # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

## LangiumTest Utilities

### parseHelper

Tests grammar parsing:

```typescript
import { parseHelper } from 'langium/test';
import { createDomainLangServices } from '../../src/language/domain-lang-module.js';
import { EmptyFileSystem } from 'langium';
import type { Model } from '../../src/language/generated/ast.js';

let services: ReturnType<typeof createDomainLangServices>;
let parse: ReturnType<typeof parseHelper<Model>>;

beforeAll(async () => {
    services = createDomainLangServices(EmptyFileSystem);
    const doParse = parseHelper<Model>(services.DomainLang);
    parse = (input: string) => doParse(input, { validation: true });
});

test('parse domain', async () => {
    const document = await parse(`
        Domain Sales {
            vision: "Handle all sales operations"
        }
    `);

    expect(document.parseResult.parserErrors).toHaveLength(0);
    expect(document.parseResult.value.children).toHaveLength(1);
});
```

**Options:**
- `{ validation: true }` - Run validators during parsing
- `{ validation: false }` - Skip validation (test parsing only)

### validationHelper

Tests validation rules:

```typescript
import { validationHelper } from 'langium/test';

let validate: ReturnType<typeof validationHelper<Model>>;

beforeAll(async () => {
    services = createDomainLangServices(EmptyFileSystem);
    validate = validationHelper<Model>(services.DomainLang);
});

test('detect circular domain reference', async () => {
    const diagnostics = await validate(`
        Domain A in B {}
        Domain B in A {}
    `);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('circular');
});
```

### expectError

Assert specific validation errors:

```typescript
import { expectError } from 'langium/test';

test('invalid classifier', async () => {
    const document = await parse(`
        Domain Sales {
            classifier: NonExistent
        }
    `);

    expectError(document.diagnostics, 'Could not resolve reference', {
        node: document.parseResult.value.children[0],
        property: 'classifier'
    });
});
```

### clearDocuments

Clear workspace state between tests:

```typescript
afterEach(() => {
    // Clear documents to avoid leakage between tests
    services.shared.workspace.LangiumDocuments.clear();
});
```

**When to use:**
- When testing cross-file references
- When testing import resolution
- When tests might interfere with each other

## Testing Patterns

### 1. Parsing Tests

Test that grammar correctly parses valid input:

```typescript
describe('Domain parsing', () => {
    test('parse domain with vision', async () => {
        const document = await parse(`
            Domain Sales {
                vision: "Handle sales operations"
            }
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);

        const domain = document.parseResult.value.children[0];
        expect(isDomain(domain)).toBe(true);
        if (isDomain(domain)) {
            expect(domain.name).toBe('Sales');
        }
    });

    test('parse domain with nested subdomains', async () => {
        const document = await parse(`
            Domain Root {}
            Domain Child in Root {}
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(document.parseResult.value.children).toHaveLength(2);
    });

    test('reject invalid syntax', async () => {
        const document = await parse(`
            Domain { }  // Missing name
        `);

        expect(document.parseResult.parserErrors.length).toBeGreaterThan(0);
    });
});
```

### 2. Linking Tests

Test that cross-references resolve correctly:

```typescript
describe('Cross-reference resolution', () => {
    test('resolve domain reference', async () => {
        const document = await parse(`
            Domain Sales {}
            BoundedContext Orders for Sales {}
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);

        const context = document.parseResult.value.children[1];
        if (isBoundedContext(context)) {
            expect(context.domain?.ref).toBeDefined();
            expect(context.domain?.ref?.name).toBe('Sales');
        }
    });

    test('report unresolved reference', async () => {
        const document = await parse(`
            BoundedContext Orders for NonExistent {}
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);

        expect(document.diagnostics).toHaveLength(1);
        expect(document.diagnostics[0].message).toContain('Could not resolve');
    });
});
```

### 3. Validation Tests

Test custom validation rules:

```typescript
describe('Domain validation', () => {
    test('detect circular domain hierarchy', async () => {
        const document = await parse(`
            Domain A in B {}
            Domain B in C {}
            Domain C in A {}
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);

        const errors = document.diagnostics.filter(d => d.severity === 1); // Error
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].message).toContain('circular');
    });

    test('allow valid domain hierarchy', async () => {
        const document = await parse(`
            Domain Root {}
            Domain Child in Root {}
            Domain GrandChild in Child {}
        `);

        await services.shared.workspace.DocumentBuilder.build([document]);

        const errors = document.diagnostics.filter(d => d.severity === 1);
        expect(errors).toHaveLength(0);
    });
});
```

### 4. Service Tests

Test service logic in isolation:

```typescript
import { GitUrlResolver } from '../../src/language/services/git-url-resolver.js';

describe('GitUrlResolver', () => {
    let resolver: GitUrlResolver;

    beforeEach(() => {
        resolver = new GitUrlResolver('/workspace', new Map());
    });

    test('parse GitHub URL', () => {
        const result = resolver.parseGitUrl('owner/repo@v1.0.0');

        expect(result).toEqual({
            type: 'github',
            owner: 'owner',
            repo: 'repo',
            version: 'v1.0.0'
        });
    });

    test('parse local file path', () => {
        const result = resolver.parseGitUrl('./local/file.dlang');

        expect(result).toEqual({
            type: 'local',
            path: './local/file.dlang'
        });
    });

    test('reject invalid URL', () => {
        expect(() => resolver.parseGitUrl('invalid:url')).toThrow();
    });
});
```

### 5. Integration Tests

Test complete workflows end-to-end:

```typescript
describe('CLI dependency commands', () => {
    test('install dependencies from lock file', async () => {
        // Create test workspace with domain.lock
        const workspace = await createTestWorkspace({
            'domain.lock': JSON.stringify({
                dependencies: {
                    'test-lib': {
                        url: 'owner/repo@v1.0.0',
                        integrity: 'sha256-...'
                    }
                }
            })
        });

        // Run install command
        await installModels(workspace.root);

        // Verify files were created
        const installed = await workspace.exists('node_modules/@dlang/test-lib');
        expect(installed).toBe(true);
    });
});
```

## Test Organization

### File Naming

- Test files: `*.test.ts`
- Place next to the code being tested, or in `test/` directory
- Match the structure of `src/` in `test/`

### Test Structure

```typescript
describe('Feature name', () => {
    // Setup
    let services: ReturnType<typeof createDomainLangServices>;
    let parse: ReturnType<typeof parseHelper<Model>>;

    beforeAll(async () => {
        // One-time setup
        services = createDomainLangServices(EmptyFileSystem);
        parse = parseHelper<Model>(services.DomainLang);
    });

    afterEach(() => {
        // Clean up after each test
        services.shared.workspace.LangiumDocuments.clear();
    });

    describe('Sub-feature', () => {
        test('specific behavior', async () => {
            // Arrange
            const input = `Domain Test {}`;

            // Act
            const document = await parse(input);

            // Assert
            expect(document.parseResult.parserErrors).toHaveLength(0);
        });

        test('error case', async () => {
            // Test error scenarios
        });
    });
});
```

## Common Patterns

### Testing Type Guards

```typescript
import { isDomain, isBoundedContext } from '../../src/language/generated/ast.js';

test('type guard identifies domain', async () => {
    const document = await parse(`Domain Test {}`);
    const node = document.parseResult.value.children[0];

    expect(isDomain(node)).toBe(true);
    expect(isBoundedContext(node)).toBe(false);
});
```

### Testing AST Structure

```typescript
test('domain has correct structure', async () => {
    const document = await parse(`
        Domain Sales {
            vision: "Sales operations"
            description: "Handles all sales"
        }
    `);

    const domain = document.parseResult.value.children[0];
    if (isDomain(domain)) {
        expect(domain.name).toBe('Sales');
        expect(domain.documentation).toHaveLength(2);

        const vision = domain.documentation.find(d => 'vision' in d);
        expect(vision).toBeDefined();
    }
});
```

### Testing Diagnostics

```typescript
function diagnosticToString(d: Diagnostic): string {
    return `[${d.range.start.line}:${d.range.start.character}] ${d.message}`;
}

test('diagnostic has correct location', async () => {
    const document = await parse(`
        Domain Sales for NonExistent {}
    `);

    expect(document.diagnostics).toHaveLength(1);
    console.log(diagnosticToString(document.diagnostics[0]));
});
```

### Testing Multi-File Scenarios

```typescript
import { NodeFileSystem } from 'langium/node';

test('cross-file reference', async () => {
    const services = createDomainLangServices(NodeFileSystem);

    // Create virtual files
    const file1 = await services.shared.workspace.LangiumDocuments.getOrCreateDocument(
        URI.file('/test/types.dlang'),
        'Domain Sales {}'
    );

    const file2 = await services.shared.workspace.LangiumDocuments.getOrCreateDocument(
        URI.file('/test/contexts.dlang'),
        'import "./types.dlang"\nBoundedContext Orders for Sales {}'
    );

    await services.shared.workspace.DocumentBuilder.build([file1, file2]);

    expect(file2.diagnostics).toHaveLength(0);
});
```

## Testing Best Practices

### ✅ DO

- Test one thing per test
- Use descriptive test names that explain what is being tested
- Follow Arrange-Act-Assert pattern
- Test both success and failure cases
- Clear state between tests with `clearDocuments()`
- Use type guards before accessing AST node properties
- Test validation at different severity levels (error, warning, info)

### ❌ DON'T

- Test implementation details (test behavior, not internal state)
- Skip edge cases and error scenarios
- Share mutable state between tests
- Forget to build documents when testing linking (`DocumentBuilder.build()`)
- Assume documents are ordered in workspace
- Test multiple unrelated features in one test

## Coverage Goals

- **Aim for 80%+ code coverage**
- **100% coverage for validation rules** (critical for correctness)
- **100% coverage for grammar parsing** (test all grammar rules)
- Focus on critical paths and complex logic

## Performance Testing

For performance-critical code:

```typescript
import { performance } from 'node:perf_hooks';

test('parsing performance', async () => {
    const largeDomain = `
        Domain Root {}
        ${Array.from({ length: 1000 }, (_, i) => `Domain Child${i} in Root {}`).join('\n')}
    `;

    const start = performance.now();
    const document = await parse(largeDomain);
    const duration = performance.now() - start;

    expect(document.parseResult.parserErrors).toHaveLength(0);
    expect(duration).toBeLessThan(1000); // Should parse in < 1 second
});
```

## Debugging Tests

### View Parse Errors

```typescript
test('debug parse errors', async () => {
    const document = await parse(`Domain { }`);

    if (document.parseResult.parserErrors.length > 0) {
        console.log('Parser errors:');
        document.parseResult.parserErrors.forEach(e => {
            console.log(`  - ${e.message}`);
        });
    }
});
```

### View Diagnostics

```typescript
test('debug diagnostics', async () => {
    const document = await parse(`Domain Sales for NonExistent {}`);

    if (document.diagnostics.length > 0) {
        console.log('Diagnostics:');
        document.diagnostics.forEach(d => {
            console.log(`  - [${d.severity}] ${d.message}`);
        });
    }
});
```

### Inspect AST

```typescript
test('debug AST structure', async () => {
    const document = await parse(`Domain Sales {}`);

    console.log(JSON.stringify(document.parseResult.value, null, 2));
});
```

## Continuous Integration

Tests run automatically on:
- Every commit (via GitHub Actions)
- Pull requests
- Before publishing

**All tests must pass before merging.**
