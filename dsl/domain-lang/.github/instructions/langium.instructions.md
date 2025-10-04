---
applyTo: "src/language/**,**/*.langium,**/*.dlang"
---

# Langium Guidelines for DomainLang

**Critical:** Never edit `src/language/generated/**` - regenerate with `npm run langium:generate` instead.

## DomainLang Language Requirements

### File Extension
- Official extension: `.dlang`
- Register in `langium-config.json` and `LanguageMetaData`

### Grammar Structure
Define block-based syntax for:
- `Domain` - Domain definitions
- `BoundedContext` - Context boundaries
- `Classification` - Domain classifiers
- `Role` - Context roles
- `ContextMap` - Context relationships
- `PackageDeclaration` - Package namespaces

### Package and Import System
Support nested packages and imports:
```langium
import Strategic from './types.dlang'
import * from 'acme-ddd'
```

Use fully qualified names for cross-package references: `acme.sales.Sales`

### Scope Resolution
Implement `ScopeComputation` and `ScopeProvider` to resolve:
- References within and across packages
- Symbols from imported files
- npm-based `.dlang` modules

Ensure FQN disambiguation and avoid naming collisions.

### Validation Rules
Implement validations for:
- Circular `Domain.partof` references
- Invalid classifier assignments
- Duplicate identifiers in a package
- Unresolved or ambiguous references

### LSP Features

**Hover:** Show `description` fields and import origin for named entities.

**Completions:** Context-aware suggestions for:
- Domain types in `implements`
- Classifications in `classifiers {}` blocks
- Known terms in `terminology {}`

**Other:** Go-to-definition, diagnostics, semantic tokens, auto-import resolution.

## Key Langium Concepts

### Grammar Language Basics

```langium
grammar DomainLang

entry Model:
    (domains+=Domain | contexts+=BoundedContext)*;

Domain:
    'domain' name=ID '{'
        // domain content
    '}';
```

- Entry rule defines the parsing start point
- Parser rules create AST nodes
- Terminal rules define tokens (use UPPER_CASE)
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
Greeting: 'Hello' person=[Person:ID] '!';
```

### Type Inference
Langium infers TypeScript types from grammar:
```langium
Domain infers MyDomain:
    'domain' name=ID;
```

Creates:
```typescript
interface MyDomain extends AstNode {
    name: string
}
```

Use `infers` for declarative type inference or `returns` for explicit types.

### Document Lifecycle States
1. **Parsed** - AST generated
2. **IndexedContent** - Symbols indexed
3. **ComputedScopes** - Local scopes prepared
4. **Linked** - Cross-references resolved
5. **IndexedReferences** - References indexed
6. **Validated** - Document validated

### Scoping
- `ScopeComputation` creates precomputed scopes (symbols attached to containers)
- `ScopeProvider` queries scopes during linking
- Override to customize symbol visibility and qualified names
- Cannot access cross-references during scope computation

### Validation
Register validators in `DomainLangValidator`:
```typescript
export class DomainLangValidator {
    @Check(Domain)
    checkDomain(domain: Domain, accept: ValidationAcceptor): void {
        // validation logic
    }
}
```

Use `ValidationAcceptor` to report errors, warnings, and info.

### Services and Dependency Injection
Access services via module:
```typescript
export const DomainLangModule: Module<DomainLangServices, PartialLangiumServices> = {
    validation: {
        DomainLangValidator: () => new DomainLangValidator()
    }
};
```

## Best Practices

- Keep grammar changes minimal and regenerate immediately
- Use `LangiumTest` utilities for unit tests
- Test parsing, linking, and validation separately
- Reference grammar file explicitly in prompts (`@domain-lang.langium`)
- Keep diffs focused on smallest useful change
- Document breaking grammar changes in changelog
