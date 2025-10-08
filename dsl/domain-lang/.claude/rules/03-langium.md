# Langium Framework Guidelines for DomainLang

## Critical: Generated Files

**NEVER edit** `src/language/generated/**` - always regenerate with `npm run langium:generate`

## DomainLang Language Requirements

### File Extension

- Official extension: `.dlang`
- Register in `langium-config.json` and `LanguageMetaData`

### Grammar Structure

The grammar defines block-based syntax for:
- `Domain` - Domain definitions
- `BoundedContext` - Context boundaries
- `Classification` - Domain classifiers
- `Team` - Team ownership
- `ContextMap` - Context relationships
- `DomainMap` - Domain relationships
- `ContextGroup` - Strategic grouping
- `PackageDeclaration` - Package namespaces
- `GroupDeclaration` - Hierarchical grouping

### Package and Import System

Support Git-native imports (Go modules/Deno style):
```dlang
import "./shared/types.dlang"
import "~/contexts/sales.dlang"
import "owner/repo@v1.0.0"
import "https://gitlab.com/owner/repo@v1.0.0"
import "ddd-patterns/core@v2.1.0" as DDD
import { OrderContext } from "./contexts.dlang"
```

Use fully qualified names for cross-package references: `acme.sales.OrderContext`

### Scope Resolution

Implement `ScopeComputation` and `ScopeProvider` to resolve:
- References within and across packages
- Symbols from imported files
- Git-based `.dlang` modules

Ensure FQN disambiguation and avoid naming collisions.

### Validation Rules

Implement validations for:
- Circular `Domain.in` references (subdomain cycles)
- Invalid classifier assignments
- Duplicate identifiers in a package/group
- Unresolved or ambiguous references
- Import validation (invalid URLs, missing files, integrity mismatches)

### LSP Features

**Hover:** Show JSDoc documentation and DDD pattern explanations for named entities.

**Completions:** Context-aware suggestions for:
- Domain types in `for` clauses
- Classifications in `classifiers {}` blocks
- Known terms in `terminology {}`
- Integration patterns in relationships

**Other:** Go-to-definition, diagnostics, semantic tokens, auto-import resolution, formatting.

## Key Langium Concepts

### Grammar Language Basics

```langium
grammar DomainLang

entry Model:
    imports+=ImportStatement*
    (children+=StructureElement)*;

Domain:
    'Domain' name=ID ('in' parentDomain=[Domain:QualifiedName])?
    '{'
        documentation+=DomainDocumentationBlock*
    '}';
```

- **Entry rule** defines the parsing start point
- **Parser rules** create AST nodes (PascalCase)
- **Terminal rules** define tokens (UPPER_CASE)
- Use `.langium` extension; reference in `langium-config.json`

### Assignments

- `=` - Single value: `name=ID`
- `+=` - Array: `domains+=Domain`
- `?=` - Boolean: `isPublic?='public'`

### Cross-References

Reference objects of a given type:
```langium
property=[Type:TOKEN]

Example:
BoundedContext:
    'Context' name=ID 'for' domain=[Domain:QualifiedName];
```

The `[Domain:QualifiedName]` creates a cross-reference resolved during linking.

### Type Inference

Langium infers TypeScript types from grammar:

```langium
Domain infers DomainNode:
    'Domain' name=ID;
```

Creates:
```typescript
interface DomainNode extends AstNode {
    name: string;
}
```

Use `infers` for declarative type inference or `returns` for explicit types.

### Document Lifecycle States

Understanding the document lifecycle is **critical** for implementing services correctly:

1. **Parsed** - AST generated from text
2. **IndexedContent** - Exported symbols indexed for global scope
3. **ComputedScopes** - Local scopes precomputed (symbols attached to containers)
4. **Linked** - Cross-references resolved to target AST nodes
5. **IndexedReferences** - Reference dependencies indexed
6. **Validated** - Custom validation checks executed

**Key Rule:** You **cannot** access cross-references during `ScopeComputation` (phase 3) because linking hasn't happened yet (phase 4).

### Scoping

**Two-phase scoping system:**

1. **`ScopeComputation`** (runs in phase 3):
   - Creates precomputed scopes (symbols attached to containers)
   - Gathers symbols from AST nodes
   - **Cannot access cross-references** (linking hasn't happened yet)
   - Used for local symbol visibility

2. **`ScopeProvider`** (runs during phase 4):
   - Queries scopes during linking
   - Resolves cross-references to actual AST nodes
   - Can filter, shadow, and customize visibility
   - Consults global scope for exported symbols

**Example:**
```typescript
export class DomainLangScopeComputation extends DefaultScopeComputation {
    protected override exportNode(node: AstNode, exports: AstNodeDescriptionProvider, document: LangiumDocument): void {
        // Export domains, contexts, teams, classifications
        if (isDomain(node) || isBoundedContext(node) || isTeam(node) || isClassification(node)) {
            exports.export(node, node.name);
        }
    }
}
```

Override to customize symbol visibility and qualified names.

### Validation

Register validators in `DomainLangValidator`:

```typescript
export class DomainLangValidator {
    @Check(Domain)
    checkDomainCircularReference(domain: Domain, accept: ValidationAcceptor): void {
        const visited = new Set<Domain>();
        let current: Domain | undefined = domain;

        while (current) {
            if (visited.has(current)) {
                accept('error', 'Circular domain hierarchy detected', {
                    node: domain,
                    property: 'parentDomain'
                });
                return;
            }
            visited.add(current);
            current = current.parentDomain?.ref;
        }
    }
}
```

Use `ValidationAcceptor` to report errors, warnings, and info with:
- `severity`: 'error' | 'warning' | 'info'
- `message`: User-facing error message
- `options`: Target node, property, keyword, or range

### Services and Dependency Injection

Access services via module:

```typescript
export const DomainLangModule: Module<DomainLangServices, PartialLangiumServices & DomainLangAddedServices> = {
    imports: {
        ImportResolver: (services) => new ImportResolver(services),
        WorkspaceManager: () => new WorkspaceManager()
    },
    references: {
        ScopeComputation: (services) => new DomainLangScopeComputation(services),
        QualifiedNameProvider: () => new QualifiedNameProvider()
    },
    lsp: {
        Formatter: () => new DomainLangFormatter(),
        HoverProvider: (services) => new DomainLangHoverProvider(services),
        CompletionProvider: (services) => new DomainLangCompletionProvider(services)
    }
};
```

**Service lifecycle:**
- Services are singletons per language instance
- Use function wrappers `(services) => new Service(services)` to resolve dependencies
- Access other services via `services.references.ScopeProvider`, etc.

## Best Practices

### Grammar Changes

1. Keep grammar changes minimal and focused
2. Run `npm run langium:generate` immediately after editing `.langium`
3. Run `npm run build` to compile TypeScript
4. Test parsing changes with new test cases
5. Update examples in `static/` if syntax changes

### Reference Grammar File Explicitly

When discussing grammar in prompts, use `@domain-lang.langium` to ensure context.

### Smallest Useful Diff

Keep changes focused on the task at hand. Don't refactor unrelated code.

### Document Breaking Changes

Maintain changelog for grammar evolution. Breaking grammar changes require major version bump per SemVer.

## Testing Patterns

Use `LangiumTest` utilities:

```typescript
import { parseHelper } from 'langium/test';
import { createDomainLangServices } from '../src/language/domain-lang-module.js';
import { EmptyFileSystem } from 'langium';

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

**Important:**
- Test parsing, linking, and validation separately
- Use `{ validation: true }` to run validators during parsing
- Call `clearDocuments()` between tests if needed
- Check both `parseResult.parserErrors` and `diagnostics`

## Common Pitfalls

### ❌ DON'T: Access cross-references during ScopeComputation

```typescript
// BAD: This runs during ScopeComputation (phase 3)
export class BadScopeComputation extends DefaultScopeComputation {
    protected override exportNode(node: AstNode) {
        if (isBoundedContext(node)) {
            const domain = node.domain?.ref; // ❌ ref is undefined!
        }
    }
}
```

Cross-references are `undefined` until linking (phase 4).

### ❌ DON'T: Edit generated files manually

**Never** edit:
- `src/language/generated/ast.ts`
- `src/language/generated/grammar.ts`
- `src/language/generated/module.ts`

Always regenerate with `npm run langium:generate`.

### ❌ DON'T: Forget to clear documents between tests

```typescript
// BAD: Documents leak between tests
test('test1', async () => {
    await parse('Domain A {}');
});

test('test2', async () => {
    await parse('Domain B {}'); // A is still in workspace!
});

// GOOD: Clear between tests
afterEach(() => {
    services.shared.workspace.LangiumDocuments.clear();
});
```

### ❌ DON'T: Skip langium:generate after grammar changes

Always run `npm run langium:generate` after editing `.langium` files. Otherwise, AST types will be out of sync with grammar.

### ❌ DON'T: Use direct AST node references across documents

```typescript
// BAD: Direct reference breaks with document changes
const domainRef = otherDocument.model.domains[0];

// GOOD: Use AstNodeDescription
const domainDesc = services.workspace.AstNodeDescriptionProvider.createDescription(domain, domain.name);
// Later, resolve: domainDesc.node?.ref
```

### ❌ DON'T: Perform expensive operations in ScopeProvider without caching

```typescript
// BAD: Recomputes on every reference
export class SlowScopeProvider extends DefaultScopeProvider {
    getScope(context: ReferenceInfo): Scope {
        const expensiveResult = computeExpensiveThing(); // ❌ Called repeatedly!
        return super.getScope(context);
    }
}

// GOOD: Use WorkspaceCache
export class CachedScopeProvider extends DefaultScopeProvider {
    private cache = new WorkspaceCache<string, ComputedResult>(this.services.shared);

    getScope(context: ReferenceInfo): Scope {
        const uri = getDocument(context.container).uriString;
        const result = this.cache.get(uri, () => computeExpensiveThing());
        return super.getScope(context);
    }
}
```

## Advanced Patterns

### Qualified Names

For hierarchical namespacing:

```typescript
export class QualifiedNameProvider extends DefaultNameProvider {
    getName(node: AstNode): string | undefined {
        if (isDomain(node) || isBoundedContext(node)) {
            return node.name;
        }
        return undefined;
    }

    getQualifiedName(node: AstNode, name?: string): string | undefined {
        const nodeName = name ?? this.getName(node);
        if (!nodeName) return undefined;

        const container = node.$container;
        if (isPackageDeclaration(container) || isGroupDeclaration(container)) {
            const containerName = this.getQualifiedName(container);
            return containerName ? `${containerName}.${nodeName}` : nodeName;
        }

        return nodeName;
    }
}
```

### Multi-File Linking

For workspace-wide cross-references:

1. Implement `ScopeComputation` to export symbols
2. Use `IndexManager` to access global scope
3. Implement `ScopeProvider` to include imported symbols
4. Validate imports in validation phase

See `src/language/services/import-resolver.ts` and `src/language/services/workspace-manager.ts` for examples.

### Custom Validation with State

```typescript
export class DomainLangValidator {
    private validatedDomains = new WeakSet<Domain>();

    @Check(Domain)
    checkDomain(domain: Domain, accept: ValidationAcceptor): void {
        if (this.validatedDomains.has(domain)) return;
        this.validatedDomains.add(domain);

        // Validation logic
    }
}
```

Use `WeakSet` or `WeakMap` to avoid memory leaks.

## Tooling and Workflow

### Standard Workflow

1. Modify `.langium` grammar file
2. Run `npm run langium:generate` to regenerate AST
3. Implement/update services (validation, scoping, LSP features)
4. Write tests using `langium/test` utilities
5. Run `npm run build` to compile
6. Test in VS Code extension or CLI
7. Run `npm test` to verify all tests pass

### Key Commands

```bash
npm run langium:generate    # Generate TypeScript from grammar
npm run build              # Compile TypeScript
npm run watch              # Watch mode for development
npm test                   # Run all tests
npm run lint               # Run ESLint
```

### Configuration

**`langium-config.json`:**
```json
{
    "projectName": "DomainLang",
    "languages": [{
        "id": "domain-lang",
        "grammar": "src/language/domain-lang.langium",
        "fileExtensions": [".dlang"],
        "textMate": {
            "out": "syntaxes/domain-lang.tmLanguage.json"
        }
    }],
    "mode": "development"
}
```

## Resources

- **Langium Documentation**: https://langium.org/docs/
- **Langium API Reference**: https://eclipse-langium.github.io/langium/
- **LSP Specification**: https://microsoft.github.io/language-server-protocol/
- **GitHub Repository**: https://github.com/eclipse-langium/langium

Your work should reflect deep understanding of Langium's architecture, document lifecycle, and service-based design.
