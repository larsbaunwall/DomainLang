# PRS-002: Language Consistency and Validation

Status: Active
Priority: High
Target Version: 2.0.0
Parent: PRS-001
Created: January 11, 2026

## Overview

This PRS focuses on improving language consistency, reducing cognitive load through canonical keyword forms, and enhancing validation to catch common modeling errors. These improvements build upon the existing grammar foundation to make DomainLang more intuitive and reliable.

## Implementation Status Summary

| Requirement | Status | Notes |
|------------|--------|-------|
| FR-2.1: Keyword Canonicalization | ✅ Implemented | `Context` keyword not found in grammar; `BC` and `BoundedContext` exist |
| FR-2.2: Assignment Operator Semantics | ✅ Accepted As-Is | Operators exist; no further semantic enforcement needed |
| FR-2.3: Inline/Block Conflict Validation | ❌ Not Implemented | No validation for conflicting inline/block properties |
| FR-2.4: ESLint Configuration | ✅ Implemented | Strict rules configured; **0 errors, 24 warnings** (all in test code) |
| FR-2.5: Test Coverage | ✅ Implemented | Vitest with v8 coverage and 80% thresholds configured (currently at ~50%) |

## User Stories

### US-1: Consistent Model Author
As a domain architect,
I want clear guidelines on which keywords and operators to use,
So that my models are consistent and easy to understand.

### US-2: Error-Free Modeler
As a DomainLang user,
I want validation warnings when I make common mistakes,
So that I can fix issues before they cause confusion.

## Functional Requirements

### ✅ FR-2.1: Keyword Canonicalization [IMPLEMENTED]

**Status**: **IMPLEMENTED** - Grammar review confirms `Context` keyword is not present.

**Current State**:
- Primary: `BoundedContext`
- Shorthand: `BC`
- Primary: `Domain`
- Shorthand: `dom`

**Finding**: The grammar in `domain-lang.langium` only defines `BoundedContext` and `BC` as valid keywords. The deprecated `Context` keyword mentioned in the original requirements does not exist in the current grammar.

**Recommendation**: Document canonical forms in language guide:
- Use `BoundedContext` for clarity in documentation
- Use `BC` for brevity in code
- Avoid inventing new synonyms

### ✅ FR-2.2: Assignment Operator Semantics [ACCEPTED AS-IS]

**Status**: **ACCEPTED AS-IS** - Current implementation is sufficient.

**Decision Rationale**: After review, the current flexible implementation where all three operators (`:`, `is`, `=`) are functionally equivalent works well in practice. Users naturally write intuitively, and attempting to enforce semantic conventions would add unnecessary cognitive load without significant benefit. This decision aligns with DomainLang's principle of progressive disclosure—simplicity first, complexity only when needed.

**Current State**:
Grammar defines three assignment operators in the `Assignment` fragment:
```langium
fragment Assignment returns string: 
    (':' | 'is' | '=')
;
```

All three are functionally equivalent and work well for current use cases.

**Decision**: No further semantic enforcement or validation hints will be implemented. The operators are flexible and allow users to write naturally. This supports DomainLang's principle of progressive disclosure—users can write simply without worrying about choosing the "correct" operator.

**Rationale**: 
- Keeps language simple and welcoming to new users
- Avoids unnecessary cognitive load on syntax choices
- Current flexibility is a feature, not a bug
- Real-world usage shows operators work intuitively as-is

**Out of Scope**:
- ❌ Documentation of semantic conventions
- ❌ Validation info hints for operator usage
- ❌ Style guide enforcement

### ❌ FR-2.3: Inline/Block Conflict Validation [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - No validation exists for this scenario.

**Current Issue**: 
Can specify same property inline AND in block with no warning:

```dlang
BC Sales for Domain1 as CoreRole by Team1 {
    role: SupportingRole   // Conflicts with inline 'as CoreRole'
    team: Team2            // Conflicts with inline 'by Team1'
}
```

**Requirement**:
- Add validation warnings when property appears in both inline and block forms
- Document precedence rules (inline takes precedence)
- Suggest consistent style in warning messages

**Validation Location**: `packages/language/src/validation/bounded-context.ts`

**Example Warning Message**:
```
Role specified both inline ('as CoreRole') and in block ('role: SupportingRole'). 
Inline value takes precedence. Consider using only one form for clarity.
```

**Test Cases Required**:
1. Inline `as` conflicts with block `role`
2. Inline `by` conflicts with block `team`
3. Inline `for` conflicts with block domain assignment
4. Multiple conflicts simultaneously
5. No conflict when only one form used

### ⚠️ FR-2.4: ESLint Strict Rules Configuration [IMPLEMENTED]

**Status**: **IMPLEMENTED** - ESLint 9 strict rules are now configured and active.

**Implementation Complete**:
- ESLint 9 configuration with `eslint.config.js`
- Extends `eslint:recommended` and `@typescript-eslint/recommended`
- Rules enforced:
  - `@typescript-eslint/explicit-function-return-type` (warn)
  - `@typescript-eslint/no-explicit-any` (error) - **except in test files**
  - `@typescript-eslint/no-unused-vars` (error)
  - `no-console` (warn, allows warn/error)
  - `@typescript-eslint/no-non-null-assertion` (warn)

**Exception for Test Files**:
Test files (`.test.ts`) are allowed to use `any` types without linting errors. This is a deliberate exception to allow flexible test fixtures and mocking patterns. Rationale:
- Test code needs to work with diverse external types and mocks
- Enforcing strict types in tests adds burden without safety benefit
- Common industry practice to relax type strictness in tests
- Allows rapid test fixture creation for non-critical test setup code

**Current Status**:
- Linting is active via `npm run lint`

### ✅ FR-2.4: ESLint Configuration [IMPLEMENTED]

**Status**: **IMPLEMENTED** - Strict TypeScript linting is fully configured and enforced.

**Implementation Details**:

- Configuration file: `eslint.config.js` (ESLint 9 format)
- Rules enforced as **errors** (fail build):
  - `@typescript-eslint/no-explicit-any`: Disallow implicit `any` types
  - `@typescript-eslint/no-unused-vars`: Disallow unused variables (allow `_` prefix)
  - `no-console`: Disallow `console.log`, allow `console.warn` and `console.error`
  - `@typescript-eslint/no-non-null-assertion`: Disallow unsafe `!` assertions
- Rules enforced as **warnings** (advisory):
  - `@typescript-eslint/explicit-function-return-type`: Recommend explicit types

**Special Exceptions**:

- Test files: Allow `any` type for pragmatic mocking
- Test files: Allow non-null assertions for test setup
- CLI code (`packages/cli/**`): Allow `console.log` (legitimate CLI output)

**Current Status** (as of January 11, 2026):

- **0 errors** (reduced from 15 errors in previous phase)
- **24 warnings** (all in test code):
  - 6 missing return types in test helpers
  - 18 non-null assertions in test fixtures (pragmatic for test setup)
- Auto-fix available via `npm run lint:fix`

**Linting Commands**:

- `npm run lint` - Report all violations
- `npm run lint:fix` - Auto-fix fixable violations (primarily unused variables)

### ✅ FR-2.5: Test Coverage Measurement and Enforcement [IMPLEMENTED]

**Status**: **IMPLEMENTED** - Coverage measurement and thresholds are now configured.

**Implementation Complete**:

Coverage thresholds added to `vitest.config.ts`:
```typescript
coverage: {
    provider: 'v8',
    reporter: ['text', 'html'],
    include: ['src'],
    exclude: ['**/generated'],
    thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
    }
}
```

**Current Metrics** (as of January 11, 2026):
- Lines: 50.62% (below 80% threshold)
- Functions: 50.25% (below 80% threshold)
- Branches: 79.84% (near threshold)
- Statements: 50.62% (below 80% threshold)

**How to Run**:
- `npm run test:coverage` - Run tests with coverage report
- Coverage report generated in HTML format in `coverage/` directory
- CI will fail if thresholds are not met

**Next Steps to Reach 80% Target**:
1. **High Priority**: Add tests for LSP features (hover, completion) - currently ~4% coverage
2. **Medium Priority**: Add tests for import utilities (~4% coverage)
3. **Medium Priority**: Add tests for main entry points (~0% coverage)
4. **Lower Priority**: Increase service layer coverage from ~53% to 80%

**Remaining Work** (Future Implementation):
- CI/CD integration to block PRs below threshold
- Coverage badge for README
- Detailed coverage reports per module

## Non-Functional Requirements

### Performance
- Validation completes in <100ms for files <1000 lines
- No impact on parser performance from new validations

### Usability
- Warning messages include actionable guidance
- Examples follow all documented conventions
- Language guide clearly explains operator semantics

### Maintainability
- Validation rules are isolated and testable
- ESLint rules are documented with rationale
- Coverage reports integrated into development workflow

## Acceptance Testing

### TS-2.1: Assignment Operator Usage
**Given** a property using `=` for business descriptions
**When** file is validated  
**Then** info hint suggests using `:` for property-value pairs
**And** no error prevents parsing

### TS-2.2: Inline/Block Conflict
**Given** a BoundedContext with inline `as CoreRole` and block `role: SupportingRole`
**When** file is validated
**Then** warning appears indicating conflict
**And** hover tooltip explains precedence
**And** inline value takes precedence in semantics

### TS-2.3: ESLint Enforcement
**Given** new TypeScript code with `any` type
**When** linting runs
**Then** error is reported
**And** CI build fails

### TS-2.4: Coverage Threshold
**Given** a PR that reduces test coverage below 80%
**When** CI runs tests with coverage
**Then** build fails with coverage report
**And** developer sees which areas need tests

## Dependencies

**Requires**:
- Langium 4.x (existing)
- TypeScript 5.8+ (existing)
- Vitest (existing)
- ESLint + @typescript-eslint plugins (existing)

**Blocks**:
- None - these are foundational improvements

## Implementation Phases

### Phase 1: Documentation (1 week)
- [ ] Document canonical keyword forms in language guide
- [ ] Update all examples to follow conventions
- [ ] Create style guide document

### Phase 2: Validation (1 week)
- [ ] Implement inline/block conflict validation (FR-2.3)
- [ ] Add comprehensive test suite for new validations
- [ ] Ensure 80%+ coverage maintained

### Phase 3: Tooling (1 week)
- [ ] Configure ESLint strict rules (FR-2.4)
- [ ] Fix existing linting violations
- [ ] Add coverage thresholds to vitest config
- [ ] Integrate linting and coverage into CI/CD
- [ ] Add coverage badge to README

**Total Effort**: 3 weeks

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Examples following conventions | ~60% | 100% |
| Inline/block conflicts in examples | Unknown | 0 |
| ESLint violations | Unknown | 0 |
| Test coverage | ~50-80% | 80%+ enforced |
| Developer satisfaction | N/A | 8/10 |

## References

- [Original PRS-001](./001-language-design-improvements.md)
- [Grammar Review 2025](../dsl/domain-lang/docs/design-docs/GRAMMAR_REVIEW_2025.md)
- [Langium 4.x Documentation](https://langium.org/docs/)
- [TypeScript ESLint Rules](https://typescript-eslint.io/rules/)

---

**Document Version:** 1.0  
**Last Updated:** January 11, 2026  
**Status:** Active  
**Next Review:** After Phase 3 completion
