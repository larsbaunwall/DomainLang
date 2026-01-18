# DomainLang Project Instructions

> Repository-wide guidance for GitHub Copilot when working with DomainLang, a Langium-based DSL for Domain-Driven Design modeling.

## Core Intent

- Extend existing patterns before inventing new ones
- Keep the DSL aligned with DDD terminology and concepts
- Write readable, self-documenting code
- Every change must have tests

## Critical tools

- Use the perplexity tools to do research on unfamiliar topics and search the web for relevant information 

## Skill Activation (Mandatory)

When a user request clearly matches one of the skill areas below, you MUST consult and follow the corresponding skill file before making changes.

- Documentation work (docs, READMEs, examples-as-docs, JSDoc, grammar hover text) → `.github/skills/technical-writer/SKILL.md`
- Language design work (syntax/semantics decisions, grammar authoring strategy, notations/aliases, DDD expressiveness trade-offs) → `.github/skills/language-expert/SKILL.md`
- Implementation work (TypeScript/Langium code, LSP features, validators, services, SDK, performance) → `.github/skills/lead-engineer/SKILL.md`
- Testing work (Vitest tests, test strategy, coverage, edge cases) → `.github/skills/tester/SKILL.md`
- Architecture/requirements work (ADRs, PRSs in `requirements/`, strategic trade-offs, scope decisions) → `.github/skills/software-architect/SKILL.md`

If a request spans multiple areas, apply the primary skill first, then the secondary one(s).

## Project Context

- **What:** Compilable DSL for DDD specification with LSP tooling
- **Stack:** TypeScript 5.x, Langium 4.x, Node.js 20+, Vite, Vitest
- **Working Directory:** All commands run from `dsl/domain-lang/`
- **Language-specific rules:** See `.github/instructions/` for TypeScript, testing, docs, and Langium guidelines

## Canonical Docs (Start Here)

- User documentation hub: `dsl/domain-lang/docs/README.md`
- Examples: `dsl/domain-lang/examples/`

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
| Model Query SDK | `packages/language/src/sdk/` | Programmatic model queries |
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
5. **ALWAYS** update documentation for new keywords/constructs (see below)

### 📚 Documentation Requirements

**For new grammar features, keywords, or DSL constructs:**
- Update the user docs (start from `dsl/domain-lang/docs/README.md`)
- Create or extend `.dlang` examples under `dsl/domain-lang/examples/`
- Add/adjust JSDoc on grammar rules and validation functions

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
  const _name = node.name;
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
import { beforeAll, test } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { expectValidDocument, s, setupTestSuite } from '../test-helpers.js';

let testServices: TestServices;
beforeAll(() => {
  testServices = setupTestSuite();
});

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
| BoundedContext | `bc OrderContext for Sales as Core by SalesTeam` |

## Model Query SDK

The SDK provides programmatic access to DomainLang models:

**Key Capabilities:**
- Direct property access for simple values: `bc.description`, `domain.vision`
- SDK augmentation for precedence resolution: `bc.effectiveRole`, `bc.effectiveTeam`, `bc.metadataMap`
- Fluent query builders with lazy evaluation: `query.boundedContexts().withRole('Core')`
- O(1) indexed lookups by FQN, name, team, role, and metadata
- Type-safe pattern matching for DDD integration patterns

**Entry Points:**
- `loadModelFromText(text)` - Browser-safe in-memory parsing
- `loadModel(file)` - Node.js file loader (from `sdk/loader-node`)
- `fromDocument(document)` - Zero-copy LSP integration
- `fromModel(model)` - Direct AST wrapping

**Property Access Patterns:**
```typescript
// Direct AST access (no SDK needed)
const desc = bc.description;           // Direct string property
const bm = bc.businessModel?.ref;      // Direct reference
const lc = bc.lifecycle?.ref;          // Direct reference

// SDK augmented (precedence resolution)
const role = bc.effectiveRole;         // Header 'as' wins over body 'role:'
const team = bc.effectiveTeam;         // Header 'by' wins over body 'team:'
const meta = bc.metadataMap;           // Metadata as Map for O(1) lookups
```

**Usage Example:**
```typescript
import { loadModelFromText } from 'domain-lang-language/sdk';

const { query } = await loadModelFromText(`
  Domain Sales { vision: "Sales" }
  bc OrderContext for Sales as Core by SalesTeam
`);

const coreContexts = query.boundedContexts()
  .withRole('Core')
  .withTeam('SalesTeam')
  .toArray();
```

| Construct | Example |
|-----------|---------|
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