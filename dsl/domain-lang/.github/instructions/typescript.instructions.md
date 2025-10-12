---
applyTo: "**/*.ts,**/*.tsx,**/*.mts,**/*.cts"
---

# TypeScript Guidelines for DomainLang

## Workspace Context

- The repository is an npm workspace; TypeScript sources live primarily in `packages/{language,cli,extension,demo}/src/`
- When running scripts, prefer workspace-scoped commands (e.g. `npm run build --workspace packages/language`)

## Core Principles

- Use TypeScript strict mode
- Prefer functional programming over classes
- Use strong typing - avoid `any` and `unknown`
- Inspect the AST to find proper types instead of using type assertions
- Prefer `import type` for type-only imports
- Use descriptive names with auxiliary verbs (e.g., `isLoaded`, `hasError`)

## Naming Conventions

- **Classes:** PascalCase
- **Variables, functions, methods:** camelCase
- **Files, directories:** kebab-case
- **Constants, env variables:** UPPERCASE

## Type System

- Prefer interfaces over types
- Use `readonly` for immutable properties
- Avoid enums - use const objects instead:
  ```typescript
  const UserRole = {
      Admin: 'admin',
      User: 'user'
  } as const;
  type UserRoleType = typeof UserRole[keyof typeof UserRole];
  ```
- Avoid type assertions (`as`, `!`) - use proper type guards
- Use generated Langium AST guards (e.g., `isNamespaceDeclaration`) instead of checking `$type` or casting to `any`
- Import types separately: `import type { AstNode } from 'langium';`

## Functions and Documentation

- Use arrow functions for simple operations
- Use default parameters and object destructuring
- Document all public APIs with JSDoc (TypeDoc-compatible tags only)
- Include `@param`, `@returns`, `@throws`, and `@example` tags when relevant

Example:
```typescript
/**
 * Parses a DomainLang document and returns the AST.
 * 
 * @param content - The raw DomainLang source code
 * @returns The parsed abstract syntax tree
 * @throws {ParseError} When the content contains syntax errors
 */
export function parseDocument(content: string): AstNode {
    // implementation
}
```

## Performance Optimization

- Use `Promise.all()` for parallel async operations (avoid sequential processing)
- Leverage Lodash for complex collection operations
- Optimize loops with batching for large datasets

Example:
```typescript
// Good: Parallel processing
await Promise.all(items.map(item => processItem(item)));

// Good: Lodash for grouping
import _ from 'lodash';
const grouped = _.groupBy(items, 'category');
```

## Error Handling

- Handle expected failures explicitly with typed results or domain errors
- Never suppress errors silently
- Add tests for new behavior (happy path + edge cases)

## Common Patterns

### Immutability
```typescript
// Good: Returns new object
function updateUser(user: User, name: string): User {
    return { ...user, name };
}
```

### Optional Chaining and Nullish Coalescing
```typescript
const userName = user?.profile?.name;
const displayName = userName ?? 'Anonymous';
```

### Composition Over Inheritance
```typescript
// Prefer composition with interfaces
interface Movable {
    move(): void;
}
interface Barkable {
    bark(): void;
}
const dog: Movable & Barkable = {
    move: () => { },
    bark: () => { }
};
```

## Anti-patterns to Avoid

- Using `any` or `unknown` without justification
- Type assertions instead of proper type guards
- Classes when functions suffice
- Inline side effects
- Mutating function parameters
- Magic numbers/strings (use named constants)

## Git Commits

Use conventional commit format with two newlines after title:

```
Add domain validation for circular partof references


This change introduces validation to detect and prevent circular
references in Domain.partof relationships. The validator traverses
the partof chain and reports an error when a cycle is detected.

Resolves #123
```

## Documentation

Follow Google's Technical Writing Style Guide for all documentation, READMEs, and comments:
- Use active voice and present tense
- Define terminology when needed
- Use lists and tables for clarity
- Write concisely and logically
