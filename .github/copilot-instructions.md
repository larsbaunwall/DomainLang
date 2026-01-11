# DomainLang Project Instructions

> Repository-wide guidance for GitHub Copilot when working with DomainLang, a Langium-based DSL for Domain-Driven Design modeling.

## Core Intent

- Extend existing patterns before inventing new ones
- Keep the DSL aligned with DDD terminology and concepts
- Write readable, self-documenting code
- Every change must have tests

## Project Context

- **What:** Compilable DSL for DDD specification with LSP tooling
- **Stack:** TypeScript 5.x, Langium 4.x, Node.js 18+, Vite, Vitest
- **Working Directory:** All commands run from `dsl/domain-lang/`
- **Language-specific rules:** See `.github/instructions/` for TypeScript, testing, docs, and Langium guidelines

## Essential Commands

```bash
npm run langium:generate  # REQUIRED after .langium changes
npm run build             # Full build of all workspaces
npm run lint              # Check code quality (MUST be clean)
npm run lint:fix          # Auto-fix fixable violations
npm test                  # Run tests
```

**⚠️ CRITICAL:** Every code change MUST pass `npm run lint` with zero violations before committing.

## Architecture

| Component | Path | Purpose |
|-----------|------|---------|
| Grammar | `packages/language/src/domain-lang.langium` | DSL syntax definition |
| Generated AST | `packages/language/src/generated/**` | **🔴 NEVER EDIT** - auto-generated |
| LSP Features | `packages/language/src/lsp/` | Hover, completion, formatting |
| Validation | `packages/language/src/validation/` | Domain rules, BC checks |
| Services | `packages/language/src/services/` | Import resolution, workspace |
| Tests | `packages/language/test/` | Parsing, linking, validation tests |

## Critical Rules

### Git operations

1. **NEVER** commit to git without my explicit approval
2. **ALWAYS** use conventional commit messages
3. **ALWAYS** divide large changes into smaller commits
4. **ALWAYS** run tests before committing

### 🔴 Grammar Changes

1. **NEVER** edit `packages/language/src/generated/**` files
2. **ALWAYS** run `npm run langium:generate` after editing `.langium` files
3. **ALWAYS** run `npm run build` to compile TypeScript
4. **ALWAYS** add test cases for parsing changes

### Code Quality & Linting

**Linting is mandatory and non-negotiable:**
- Every change must pass `npm run lint` with **0 errors, 0 warnings**
- Use `npm run lint:fix` to auto-fix most violations
- If a warning must be suppressed, add ESLint disable comment with reason
- Test files can have pragmatic exceptions for setup code (document why)

**ESLint Rules Enforced:**
- ✅ No implicit `any` types (use `unknown` with type guards)
- ✅ No unused variables (prefix unused params with `_`)
- ✅ No unsafe `!` assertions in production code
- ✅ No `console.log()` in libraries (only `warn`/`error`)
- ✅ Explicit return types on public functions

**Before ANY commit:**
```bash
npm run lint              # Must report: 0 errors, 0 warnings
npm run build             # Must succeed
npm test                  # Must pass
```

### Code Standards

- Use TypeScript strict mode; no exceptions
- Prefer functional patterns over classes (except Langium services)
- Use generated AST type guards: `isDomain()`, `isBoundedContext()`
- Document public APIs with JSDoc
- Avoid `any`; prefer `unknown` with type narrowing

```typescript
// ✅ Correct: Use type guards
if (isDomain(node)) {
    console.log(node.name);
}

// ❌ Avoid: Type assertions
const domain = node as Domain;
```

### Testing Requirements

Always add tests for new behavior:
- Happy path (expected usage)
- Edge cases (boundary conditions)
- Error scenarios (invalid input)

```typescript
import { setupTestSuite, expectValidDocument, s } from '../test-helpers.js';

let testServices: TestServices;
beforeAll(() => { testServices = setupTestSuite(); });

test('should parse domain with vision', async () => {
    const doc = await testServices.parse(s`Domain Sales { vision: "Test" }`);
    expectValidDocument(doc);
});
```

### Before Committing

```bash
npm run lint              # Must pass: 0 errors, 0 warnings
npm run build             # Must succeed
npm test                  # Must pass
```

**If linting fails, fix immediately:**
1. Run `npm run lint:fix` to auto-fix
2. For warnings that can't auto-fix, understand why and suppress with comment
3. Never commit code with linting violations

## Language Quick Reference

| Construct | Example |
|-----------|---------|
| Domain | `Domain Sales { vision: "..." }` |
| Subdomain | `Domain Orders in Sales {}` |
| BoundedContext | `BC OrderContext for Sales as Core by SalesTeam` |
| ContextMap | `ContextMap Sales { contains OrderContext, BillingContext }` |
| Relationships | `[OHS] this -> [CF] PaymentContext` |
| Namespace | `namespace acme.sales { ... }` |
| Import | `import "owner/repo@v1.0.0"` |

## DDD Patterns

`[OHS]` Open Host Service · `[CF]` Conformist · `[ACL]` Anti-Corruption Layer · `[PL]` Published Language · `[P]` Partnership · `[SK]` Shared Kernel

## Validation Rules (Implemented)

- Missing domain vision → warning
- Missing BC description → warning
- Duplicate FQN names → error

## Git Workflow

- Commit messages: imperative title, detailed body
- No trailing punctuation in commit titles
- One logical change per commit