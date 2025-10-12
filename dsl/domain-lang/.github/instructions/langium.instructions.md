---
applyTo: "src/language/**,**/*.langium,**/*.dlang"
---

# Langium Guidelines for DomainLang

**Critical:** Never edit `src/language/generated/**` - regenerate with `npm run langium:generate` instead.

## DomainLang Language Requirements

### File Extension
- Official extension: `.dlang`
- Register in `langium-config.json` and `LanguageMetaData`

### Project Layout
- Grammar source lives at `packages/language/src/domain-lang.langium`
- Generated artifacts are emitted into `packages/language/src/generated/`
- Language-specific services and validators reside under `packages/language/src/lsp/` and `packages/language/src/validation/`
- Tests for grammar, scoping, and validation are in `packages/language/test/`

### Grammar Structure
Define block-based syntax for:
- `Domain` - Domain definitions with optional `in` hierarchy
- `BoundedContext` - Context boundaries with `for` domain association
- `Classification` - Strategic classifiers
- `Team` - Ownership declarations
- `ContextMap` and `DomainMap` - Architecture mapping constructs
- `ContextGroup` - Strategic clustering of contexts
- `NamespaceDeclaration` - Namespacing for hierarchical organization

### Namespace and Import System
Support nested namespaces and the supported import formats:
```langium
NamespaceDeclaration:
    ('namespace' | 'Namespace') name=QualifiedName '{' StructureElement* '}'

ImportStatement:
    'import' (
        '{' symbols+=ID (',' symbols+=ID)* '}' 'from' uri=STRING
        | uri=STRING ('as' alias=ID)? ('integrity' integrity=STRING)?
    )
```

Use fully qualified names built from namespaces, e.g. `Company.Engineering.BackendTeam`.

### Scope Resolution
Implement `ScopeComputation` and `ScopeProvider` to resolve:
- References within and across namespaces
- Symbols exported by imports (local files, workspace `~`, git URIs)
- npm-based `.dlang` modules

Ensure FQN disambiguation and avoid naming collisions.

### Validation Rules
Implement validations for:
- Cyclic `Domain in` hierarchies
- Invalid classifier assignments
- Duplicate identifiers within a namespace scope
- Unresolved or ambiguous references

### LSP Features

**Hover:** Show `description` fields and import origin for named entities.

**Completions:** Context-aware suggestions for:
- Domain types in `for`
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
