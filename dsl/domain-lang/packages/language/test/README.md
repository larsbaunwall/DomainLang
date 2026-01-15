# DomainLang Test Structure Guide

## Overview

This document describes the test organization for the DomainLang language package after comprehensive restructuring completed in January 2025. The structure provides excellent coverage with clear separation of concerns and reusable utilities.

## Test Architecture

### Core Test Utilities

**`test/test-helpers.ts`** - Central testing infrastructure
- **Test fixtures**: Standardized domain models for reuse across tests
- **Parsing helpers**: `createTestServices()`, `setupTestSuite()` with automatic cleanup  
- **Validation helpers**: `expectValidationErrors()`, `expectValidationWarnings()`, `expectValidDocument()`
- **AST helpers**: `getFirstBoundedContext()`, `getFirstDomain()`, type-safe AST navigation
- **Debug utilities**: `getDocumentErrors()`, `getDiagnosticsBySeverity()`

### Test Categories

#### 1. Grammar & Parsing Tests

**`test/parsing/grammar-completeness.test.ts`** (34 tests)
- **Purpose**: Systematic coverage of all grammar rules
- **Organization**: 8 sections mirroring grammar structure
  1. Entry Point & Model Structure
  2. DDD Strategic Design (Domain, BoundedContext)
  3. DDD Tactical Design (Team, Classification, ContextGroup)
  4. Architecture Mapping (ContextMap, DomainMap)  
  5. Relationships & Integration Patterns
  6. Documentation & Governance (DomainTerm, Decisions, Policies)
  7. Module System (Import, Package, QualifiedName)
  8. Terminals & Lexical Grammar
- **Coverage**: Every grammar rule tested with valid syntax examples

**`test/parsing/new-syntax.test.ts`** (9 tests)  
- **Purpose**: Advanced syntax combinations and shorthand features
- **Covers**: bc shorthand, inline assignments, categorized decisions, relationship arrows
- **Status**: Active - tests working features not covered by grammar completeness

#### 2. Validation Tests

**`test/validating/comprehensive-validation.test.ts`** (33 tests)
- **Purpose**: Complete coverage of all validation rules in `src/validation/`
- **Organization**: By validation module (domain, bounded-context, context-group, etc.)
- **Pattern**: Both positive (valid) and negative (invalid) test cases
- **Coverage**: All 9 validation modules covered

**`test/validating/import-validation.test.ts`** (5 tests)
- **Purpose**: Specialized import validation testing
- **Covers**: File existence, symbol resolution, URI validation, Git imports

#### 3. Linking Tests

**`test/linking/linking.test.ts`**
- **Purpose**: Basic cross-reference resolution
- **Status**: Stable foundation tests

**`test/linking/basic-linking.test.ts`**

- **Purpose**: Additional basic linking scenarios to guard regressions

#### 4. Scoping Tests

The former monolithic scoping suite was split into focused, cohesive files:

- **`test/scoping/local-scope.test.ts`**
    - Local scope resolution inside a file (domain/team/classification references in BCs)
- **`test/scoping/references.test.ts`**
    - ContextMap/ContextGroup references and domain parent references
- **`test/scoping/multi-targets.test.ts`**
    - Multi-target resolution (same-named BCs across domains)
- **`test/scoping/edge-cases.test.ts`**
    - Forward refs, `this` references, circular and missing references
- **`test/scoping/performance.test.ts`**
    - Stress scenarios for many elements

Note: The previous monolithic scoping suite has been fully migrated to `test/scoping/*`.

#### 5. Feature-Specific Tests  

**`test/multireference/`**

- **Purpose**: MultiReference resolution for same-named elements across domains
- **Files**: `multi-target-refs.test.ts`, `practical-examples.test.ts`
- **Coverage**: Core MultiReference functionality with some advanced features skipped

#### 6. Service Tests

**`test/services/`** (36 tests, all passing)

- **Purpose**: Business logic testing for language services
- **Files**:
    - `dependency-analyzer.test.ts` (12 tests)
    - `governance-validator.test.ts` (10 tests)
    - `performance-optimizer.test.ts` (10 tests)
    - `workspace-manager.test.ts` (3 tests)
    - `git-url-resolver.test.ts` (1 test)
- **Status**: Well-maintained, comprehensive service coverage

## Test Patterns & Best Practices

### 1. Test Setup Pattern

```typescript
describe('Test Suite', () => {
    let testServices: TestServices;

    beforeAll(() => {
        testServices = setupTestSuite(); // Handles cleanup automatically
    });

    test('test case', async () => {
        const document = await testServices.parse(s`
            Domain TestDomain {
                vision: "Test vision"
            }
        `);
        
        expectValidDocument(document);
        // Test assertions...
    });
});
```

### 2. Template String Helper

- Use `s` helper from test-helpers for readable multi-line input:

```typescript
const document = await testServices.parse(s`
    Domain Sales {
        vision: "Sales domain"
    }
    BoundedContext OrderContext for Sales {
        description: "Order processing"
    }
`);
```

### 3. Validation Testing Pattern

```typescript
// For warnings
expectValidationWarnings(document, [
    "Expected warning message"
]);

// For errors  
expectValidationErrors(document, [
    "Expected error message"
]);
```

### 4. AST Navigation

```typescript
const bc = getFirstBoundedContext(document);
expect(bc.domain?.ref?.name).toBe('Sales');
```

### 5. Fixture Usage

Use pre-defined fixtures from test-helpers for common scenarios:
- `basicDomain` - Simple domain with vision
- `fullBoundedContext` - Complete BC with all documentation
- `domainHierarchy` - Parent-child domain structure
- `contextMapWithRelationships` - ContextMap with multiple relationship types

## Current Test Status

### ✅ Excellent Coverage

- **Grammar**: 100% rule coverage (34 tests)
- **Validation**: All rules covered (33 tests) 
- **Services**: Complete business logic (36 tests)
- **Core Linking**: Basic cross-references working

### ⚠️ Known Limitations (Documented as TODOs)

- **Qualified Name Scoping**: Package-scoped references like `com.example.Sales` (5 tests skipped)
- **Advanced MultiReference**: Some complex scenarios (2 tests skipped)
- **Import Resolution**: Advanced import scenarios (limited coverage)

### 📊 Coverage Metrics (Post-Restructuring)

- **Overall**: 52.23% statement coverage
- **Validation**: 69.35% (excellent)
- **Services**: 53.87% (good) 
- **Generated AST**: 92.45% (excellent)
- **LSP Features**: 29.96% (opportunity for improvement)

## Future Maintenance

### Adding New Tests
1. Use `test-helpers.ts` utilities consistently
2. Follow established naming patterns (`*.test.ts`)
3. Use inline fixtures over external files
4. Include both positive and negative test cases for validation
5. Document limitations as `.skip()` with TODO comments

### Test Organization Principles
1. **Separation of Concerns**: Grammar vs Validation vs Linking vs Services
2. **Systematic Coverage**: Every grammar rule and validation rule tested
3. **Maintainable Fixtures**: Centralized, reusable test data
4. **Clear Documentation**: README files and TODO comments for limitations
5. **Consistent Patterns**: Standardized setup, assertion, and naming conventions

### Coverage Goals
- Maintain grammar and validation completeness
- Improve LSP feature coverage (currently 29.96%)
- Implement qualified name scoping to enable skipped tests
- Expand import resolution coverage

This structure provides a solid foundation for maintaining and extending the DomainLang test suite while ensuring high coverage and code quality.