---
description: 'Guidelines for Langium 4.x grammar development and DomainLang DSL files'
applyTo: "**/*.langium,**/*.dlang"
---

# Langium Framework Guidelines

> Guidelines for working with Langium grammar files (`.langium`) and DomainLang DSL files (`.dlang`).

## Role

You are working with Langium 4.x, a framework for building DSLs with full LSP support. DomainLang uses Langium to implement a Domain-Driven Design modeling language.

## References

- [Langium Documentation](https://langium.org/docs/)
- [LSP Specification](https://microsoft.github.io/language-server-protocol/)
- [DomainLang Grammar](packages/language/src/domain-lang.langium)

## Core Intent

- Keep grammar clean and aligned with DDD terminology
- Never edit generated files; always regenerate
- Understand the document lifecycle before implementing services
- Test grammar changes with parsing and linking tests

## Critical Rules

🔴 **NEVER** edit `packages/language/src/generated/**` - regenerate with `npm run langium:generate`

🔴 **ALWAYS** run `npm run langium:generate` after editing `.langium` files

🔴 **ALWAYS** run `npm run build` after grammar changes to compile TypeScript

## Project Layout

| File | Purpose |
|------|---------|
| `packages/language/src/domain-lang.langium` | Grammar source |
| `packages/language/src/generated/` | Generated AST (never edit) |
| `packages/language/src/validation/` | Validation rules |
| `packages/language/src/lsp/` | LSP services |
| `packages/language/src/services/` | Import resolution, workspace |

## DomainLang Language Design

### Core Constructs

| Construct | Purpose | Key Features |
|-----------|---------|--------------|
| `Domain` | Sphere of knowledge/activity | `in` hierarchy, `vision`, `description`, `classifier` |
| `BoundedContext` / `BC` | Context boundary | `for` domain, `as` classifier, `by` team |
| `ContextMap` / `DomainMap` | Architecture mapping | MultiReference support |
| `Team`, `Classification` | Organizational elements | Cross-referenced |
| `NamespaceDeclaration` | Hierarchical organization | FQN support |

### BoundedContext Features

```dlang
BC OrderContext for Sales as Core by SalesTeam {
    description: "Order management"
    team: SalesTeam
    role: Core
    businessModel: Revenue
    evolution: Custom
    
    classifiers { role: Core }
    
    terminology {
        term Order: "A customer purchase request"
    }
    
    decisions {
        decision [Architectural] EventSourcing: "Use event sourcing for orders"
    }
    
    relationships {
        [OHS] this -> [CF] PaymentContext
    }
}
```

### Relationship Arrows

| Arrow | Meaning |
|-------|---------|
| `->` | Downstream direction |
| `<-` | Upstream direction |
| `<->` | Bidirectional |
| `><` | Mutual dependency |
| `U/D` or `u/d` | Upstream/Downstream |
| `C/S` or `c/s` | Customer/Supplier |

### DDD Patterns (Roles)

| Pattern | Meaning |
|---------|---------|
| `[OHS]` | Open Host Service |
| `[CF]` | Conformist |
| `[ACL]` | Anti-Corruption Layer |
| `[PL]` | Published Language |
| `[P]` | Partnership |
| `[SK]` | Shared Kernel |
| `[BBoM]` | Big Ball of Mud |

### Namespace and Import System

```dlang
namespace Strategic {
    Classification CoreDomain
}

import "./shared/types.dlang"
import "~/contexts/sales.dlang"
import "owner/repo@v1.0.0" as Patterns
```

Qualified names: `Strategic.CoreDomain`, `Company.Engineering.BackendTeam`

## Grammar Fundamentals

```langium
grammar DomainLang

entry Model:
    imports+=ImportStatement*
    (children+=StructureElement)*;

Domain:
    'Domain' name=ID ('in' parentDomain=[Domain:QualifiedName])?
    '{' documentation+=DomainDocumentationBlock* '}';
```

### Assignments

- `=` Single value: `name=ID`
- `+=` Array: `domains+=Domain`
- `?=` Boolean: `isPublic?='public'`

### Cross-References

```langium
// Reference to a Domain using QualifiedName
BoundedContext:
    'Context' name=ID 'for' domain=[Domain:QualifiedName];
```

### MultiReference Pattern

Use `[+Type]` for references that resolve to **multiple targets** (same-named elements):

```langium
ContextMap:
    'ContextMap' name=ID '{'
        'contains' boundedContexts+=[+BoundedContext:QualifiedName]
    '}';
```

```dlang
BC Orders for Sales {}
BC Orders for Billing {}

ContextMap AllOrders {
    contains Orders  // Resolves to BOTH BCs!
}
```

**Generated TypeScript:**
```typescript
interface MultiReference<T> {
    $refText: string;           // Written text ("Orders")
    items: Array<{ ref: T }>;   // All matching AST nodes
}
```

**Where MultiReference IS used:** `ContextMap.boundedContexts`, `DomainMap.domains`
**Where MultiReference is NOT used:** `BoundedContext.domain` (BC belongs to exactly ONE domain)

## Document Lifecycle (Critical)

Understanding this is **essential** for correct service implementation:

1. **Parsed** - AST generated from text
2. **IndexedContent** - Exported symbols indexed for global scope
3. **ComputedScopes** - Local scopes precomputed
4. **Linked** - Cross-references resolved ← **References available here**
5. **IndexedReferences** - Reference dependencies indexed
6. **Validated** - Custom validation checks executed

**Key Rule:** Cross-references are `undefined` until phase 4 (Linked).

## Scoping

### ScopeComputation (Phase 3)

- Creates precomputed scopes (symbols attached to containers)
- **Cannot access cross-references** (linking hasn't happened)

```typescript
export class DomainLangScopeComputation extends DefaultScopeComputation {
    protected override exportNode(node: AstNode, exports: AstNodeDescriptionProvider): void {
        if (isDomain(node) || isBoundedContext(node) || isTeam(node) || isClassification(node)) {
            exports.export(node, node.name);
        }
    }
}
```

### ScopeProvider (Phase 4)

- Resolves cross-references to AST nodes
- Can filter, shadow, and customize visibility
- Consults global scope for exported symbols

### Scoping Behavior (Test-Verified)

**Forward references work:**
```dlang
BoundedContext OrderContext for Sales {}  // Sales not yet defined
Domain Sales {}                            // Defined after reference - WORKS
```

**`this` reference in relationships:**
```dlang
BoundedContext OrderContext for Sales {
    relationships {
        [OHS] this -> [CF] PaymentContext  // "this" = OrderContext
    }
}
```

**Missing references don't crash:**
```dlang
BoundedContext OrderContext for NonExistent {}  // domain?.ref is undefined
```

**Duplicate detection uses FQN:**
```dlang
namespace A { Domain Sales {} }
namespace B { Domain Sales {} }  // OK - different FQN (A.Sales vs B.Sales)
```

## Validation Rules

### Currently Implemented

| Rule | Severity | Message |
|------|----------|---------|
| Missing domain vision | Warning | `Domain 'X' has no domain vision` |
| Missing BC description | Warning | `Bounded Context 'X' has no description` |
| Duplicate FQN | Error | `This element is already defined elsewhere` |

### Planned (TODO)

- Cyclic `Domain in` hierarchies
- Invalid classifier/team/domain reference validation
- Import file existence validation

```typescript
export class DomainLangValidator {
    @Check(Domain)
    checkDomainHasVision(domain: Domain, accept: ValidationAcceptor): void {
        const hasVision = domain.documentation?.some(d => 'vision' in d);
        if (!hasVision) {
            accept('warning', `Domain '${domain.name}' has no domain vision`, {
                node: domain,
                property: 'name'
            });
        }
    }
}
```

## Common Pitfalls

### ❌ Access cross-references during ScopeComputation

```typescript
// BAD: ref is undefined in phase 3
export class BadScopeComputation extends DefaultScopeComputation {
    protected override exportNode(node: AstNode) {
        if (isBoundedContext(node)) {
            const domain = node.domain?.ref; // ❌ ref is undefined!
        }
    }
}
```

### ❌ Edit generated files

Never edit `src/generated/ast.ts`, `grammar.ts`, or `module.ts` - always regenerate.

### ❌ Skip langium:generate after grammar changes

AST types will be out of sync with grammar.

### ❌ Forget document cleanup in tests

```typescript
// Use setupTestSuite() which handles cleanup automatically
let testServices: TestServices;
beforeAll(() => { testServices = setupTestSuite(); });
```

### ❌ Expensive operations in ScopeProvider without caching

```typescript
// BAD: Recomputes on every reference
getScope(context: ReferenceInfo): Scope {
    const result = computeExpensiveThing(); // ❌ Called repeatedly!
}

// GOOD: Use WorkspaceCache
private cache = new WorkspaceCache<string, Result>(this.services.shared);
getScope(context: ReferenceInfo): Scope {
    const uri = getDocument(context.container).uriString;
    const result = this.cache.get(uri, () => computeExpensiveThing());
}
```

## Advanced Patterns

### Qualified Names

```typescript
export class QualifiedNameProvider extends DefaultNameProvider {
    getQualifiedName(node: AstNode, name?: string): string | undefined {
        const nodeName = name ?? this.getName(node);
        if (!nodeName) return undefined;

        const container = node.$container;
        if (isNamespaceDeclaration(container)) {
            const containerName = this.getQualifiedName(container);
            return containerName ? `${containerName}.${nodeName}` : nodeName;
        }
        return nodeName;
    }
}
```

### Service Registration

```typescript
export const DomainLangModule: Module<DomainLangServices, PartialLangiumServices> = {
    references: {
        ScopeComputation: (services) => new DomainLangScopeComputation(services),
        QualifiedNameProvider: () => new QualifiedNameProvider()
    },
    lsp: {
        HoverProvider: (services) => new DomainLangHoverProvider(services),
        CompletionProvider: (services) => new DomainLangCompletionProvider(services)
    }
};
```

## Workflow

1. Edit `.langium` grammar
2. Run `npm run langium:generate`
3. Implement/update services
4. Write tests
5. Run `npm run build`
6. Run `npm test`

## Validation

Before committing Langium/DomainLang changes:

```bash
# Regenerate AST from grammar (required after .langium changes)
npm run langium:generate

# Build TypeScript
npm run build

# Run all tests
npm test
```

## Decision Framework

| Scenario | Use |
|----------|-----|
| New language construct | Add grammar rule, regenerate, add validation |
| Reference to single element | Standard `[Type:QualifiedName]` |
| Reference to multiple same-named elements | MultiReference `[+Type:QualifiedName]` |
| Custom scoping logic | Implement in ScopeProvider (phase 4) |
| Export symbols globally | Override ScopeComputation (phase 3) |
| Validate semantic rules | Add `@Check` methods in Validator |

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| `ref` is undefined | Accessing in wrong phase | Wait until phase 4 (Linked) |
| AST types don't match grammar | Forgot to regenerate | Run `npm run langium:generate` |
| Duplicate symbol errors | Missing namespace | Use `namespace` blocks for disambiguation |
| Slow reference resolution | No caching | Use `WorkspaceCache` in ScopeProvider |
| Tests fail with stale AST | Document cleanup | Use `setupTestSuite()` helper |
