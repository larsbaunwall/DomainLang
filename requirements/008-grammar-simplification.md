# PRS-008: Grammar Simplification - Direct Property Access

**Status**: Proposed  
**Priority**: High  
**Target Version**: 2.3.0  
**Effort Estimate**: 1 week  
**Dependencies**: PRS-007 (Model Query SDK)

---

## Executive Summary

Simplify the DomainLang grammar by replacing documentation block arrays (`BoundedContextDocumentationBlock[]`, `DomainDocumentationBlock[]`) with **direct optional properties** on `Domain` and `BoundedContext` AST nodes. This eliminates the need for consumers to iterate arrays, use type guards, and manage block precedence logic.

**Current grammar** (block-based):

```langium
Domain:
    'Domain' name=ID '{'
        documentation+=DomainDocumentationBlock*
    '}'
;

DomainDocumentationBlock:
      {DescriptionBlock} 'description' Assignment description=STRING
    | {VisionBlock} 'vision' Assignment vision=STRING
    | {DomainClassificationBlock} 'classification' Assignment classification=[Classification]
;
```

**Current AST access** (requires traversal):

```typescript
// ❌ Must iterate and type-check
const hasDescription = bc.documentation?.some(
    (block: BoundedContextDocumentationBlock) => isDescriptionBlock(block) && block.description
);

// ❌ Complex precedence logic in SDK
export function resolveBcRole(bc: BoundedContext): Classification | undefined {
    if (bc.role?.ref) return bc.role.ref;
    const roleBlock = findBlock<RoleBlock>(bc.documentation, isRoleBlock);
    if (roleBlock?.role?.ref) return roleBlock.role.ref;
    const classBlock = findBlock<BoundedContextClassificationBlock>(...);
    if (classBlock?.role?.ref) return classBlock.role.ref;
    return undefined;
}
```

**Proposed grammar** (direct properties):

```langium
Domain:
    'Domain' name=ID '{'
        ('description' Assignment description=STRING)?
        ('vision' Assignment vision=STRING)?
        ('classification' Assignment classification=[Classification])?
    '}'
;

BoundedContext:
    'bc' name=ID 
    ('for' domain=[Domain:QualifiedName])?
    (('as' role=[Classification:QualifiedName])? ('by' team=[Team:QualifiedName])?)?
    ('{' 
        ('description' Assignment description=STRING)?
        ('role' Assignment role=[Classification:QualifiedName])?
        (TeamAssignment Assignment team=[Team:QualifiedName])?
        (('businessModel' | ('business' 'model')) Assignment businessModel=[Classification:QualifiedName])?
        ('lifecycle' Assignment lifecycle=[Classification:QualifiedName])?
        (('metadata' | 'meta') '{' (metadata+=MetadataEntry)* '}')?
        (('relationships' | 'integrations' | 'connections') '{' 
            (relationships += Relationship ((",")? relationships += Relationship)*)*
        '}')?
        (('terminology' | 'language' | 'glossary' | ('ubiquitous' 'language')) '{' 
            (terminology += DomainTerm (",")?)* 
        '}')?
        (('decisions' | 'constraints' | 'rules' | 'policies') '{' 
            (decisions += AbstractDecision (',')?)* 
        '}')?
    '}')?
;
```

**Proposed AST access** (direct):

```typescript
// ✅ Direct property access
const hasDescription = bc.description !== undefined;

// ✅ Simplified SDK resolution
export function resolveBcRole(bc: BoundedContext): Classification | undefined {
    return bc.role?.ref;  // Single source of truth
}
```

---

## Problem

The current grammar uses **union types** for documentation blocks, forcing consumers to:

1. **Iterate through arrays** - `bc.documentation?.some(block => ...)`
2. **Use type guards** - `isDescriptionBlock(block)`, `isRoleBlock(block)`, etc.
3. **Handle precedence** - inline vs block properties require complex resolution logic
4. **Duplicate traversal** - validation, SDK, LSP, and tests all re-implement block iteration
5. **Unclear AST structure** - difficult to discover what properties exist

This creates:

- 🔴 **Ergonomic friction** - simple queries require 5+ lines of code
- 🔴 **Maintenance burden** - changes to block types ripple across codebase
- 🔴 **Cognitive overhead** - developers must understand union types and precedence rules
- 🔴 **Error-prone code** - easy to forget a block type or precedence level

## Goals

| Goal | Measure |
|------|---------|
| **Ergonomic AST** | Direct property access: `bc.description` instead of iteration |
| **Simplified SDK** | Resolution functions become one-liners |
| **Clear semantics** | Single source of truth for each property (no precedence) |
| **Maintainability** | Fewer type guards, less traversal code |
| **Order independence** | Properties can be defined in any order |

## Non-Goals

- Support for multiple blocks of the same type (e.g., two `description` properties)
- Changes to syntax keywords (same keywords, different AST structure)

---

## Design

### Grammar Changes

#### 1. Domain Simplification

**Before:**

```langium
Domain:
    'Domain' name=ID ('in' parent=[Domain:QualifiedName])?
    '{'
        documentation+=DomainDocumentationBlock*
    '}'
;

DomainDocumentationBlock:
      {DescriptionBlock} 'description' Assignment description=STRING
    | {VisionBlock} 'vision' Assignment vision=STRING
    | {DomainClassificationBlock} 'classification' Assignment classification=[Classification]
;
```

**After:**

```langium
Domain:
    'Domain' name=ID ('in' parent=[Domain:QualifiedName])?
    '{'
        ('description' Assignment description=STRING)?
        ('vision' Assignment vision=STRING)?
        ('classification' Assignment classification=[Classification])?
    '}'
;
```

**Generated AST:**

```typescript
interface Domain extends AstNode {
    name: string;
    parent?: Reference<Domain>;
    description?: string;
    vision?: string;
    classification?: Reference<Classification>;
}
```

#### 2. BoundedContext Simplification

**Before:**

```langium
BoundedContext:
    'bc' name=ID 
    ('for' domain=[Domain:QualifiedName])?
    (('as' role=[Classification:QualifiedName])? ('by' team=[Team:QualifiedName])?)?
    ('{' documentation+=BoundedContextDocumentationBlock* '}')?
;

BoundedContextDocumentationBlock:
      {DescriptionBlock} 'description' Assignment description=STRING
    | {TeamBlock} TeamAssignment Assignment team=[Team:QualifiedName]
    | {RoleBlock} 'role' Assignment role=[Classification:QualifiedName]
    | {BusinessModelBlock} ...
    | {MetadataBlock} 'metadata' '{' (entries+=MetadataEntry)* '}'
    | {RelationshipsBlock} 'relationships' '{' ... '}'
    | {TerminologyBlock} ('terminology' | 'glossary') '{' (terminology += DomainTerm)* '}'
    | {DecisionsBlock} ('decisions' | 'rules' | 'policies') '{' (decisions += AbstractDecision)* '}'
    | ...
```

**After:**

```langium
BoundedContext:
    'bc' name=ID 
    ('for' domain=[Domain:QualifiedName])?
    (('as' role=[Classification:QualifiedName])? ('by' team=[Team:QualifiedName])?)?
    ('{' 
        // Scalar properties (direct access)
        ('description' Assignment description=STRING)?
        ('role' Assignment role=[Classification:QualifiedName])?
        (TeamAssignment Assignment team=[Team:QualifiedName])?
        (('businessModel' | ('business' 'model')) Assignment businessModel=[Classification:QualifiedName])?
        ('lifecycle' Assignment lifecycle=[Classification:QualifiedName])?
        
        // Collection properties (structured blocks)
        (('metadata' | 'meta') '{' (metadata+=MetadataEntry)* '}')?
        (('relationships' | 'integrations' | 'connections') '{' 
            (relationships += Relationship ((",")? relationships += Relationship)*)*
        '}')?
        (('terminology' | 'language' | 'glossary' | ('ubiquitous' 'language')) '{' 
            (terminology += DomainTerm (",")?)* 
        '}')?
        (('decisions' | 'constraints' | 'rules' | 'policies') '{' 
            (decisions += AbstractDecision (',')?)* 
        '}')?
    '}')?
;
```

**Generated AST:**

```typescript
interface BoundedContext extends AstNode {
    name: string;
    domain?: Reference<Domain>;
    role?: Reference<Classification>;
    team?: Reference<Team>;
    
    // Scalar properties
    description?: string;
    businessModel?: Reference<Classification>;
    lifecycle?: Reference<Classification>;
    
    // Collection properties
    metadata: MetadataEntry[];
    relationships: Relationship[];
    terminology: DomainTerm[];  // Ubiquitous Language glossary
    decisions: AbstractDecision[];  // Decision, Policy, BusinessRule
}
```

**Property naming rationale:**

- **`terminology` (not `terms`):** Matches the keyword and better reflects the DDD concept of Ubiquitous Language - a shared vocabulary within a Bounded Context.
- **`decisions` (singular collection):** In DDD, Decisions, Policies, Business Rules, and Constraints are all forms of domain governance. The grammar accepts multiple keywords (`decisions`, `constraints`, `rules`, `policies`) for natural language, but they all map to the same collection. This avoids property proliferation while maintaining linguistic flexibility.

```typescript

### Key Design Decisions

#### Decision 1: Optional Properties with `?`

All properties use Langium's optional operator (`?`), which:

- ✅ Allows properties in **any order**
- ✅ Generates clean TypeScript types (`property?: Type`)
- ✅ Makes omission clear (undefined if not present)
- ✅ Prevents duplicate definitions (parser error if repeated)

#### Decision 2: Flat Scalars, Structured Collections

**Scalar values** (description, role, team):

- Direct properties for O(1) access
- Single occurrence enforced by grammar

**Collections** (relationships, terminology, decisions):

- Keep block structure for grouping
- Allows multiple items within the block
- Natural syntax: `relationships { ... }`

#### Decision 3: Remove Precedence Logic

**Current behavior:**

- Inline `as` beats block `role:` beats `classifications { role: ... }`
- Complex resolution logic in SDK
- Confusing for users

**New behavior:**

- If inline `as` is used, that's the role (header wins)
- If block `role:` is used, that's the role
- If both are used, validation error (explicit conflict)

#### Decision 4: Order Independence

Langium's parser naturally supports order independence for optional properties:

```dlang
// ✅ All valid - same AST
bc OrderContext {
    description: "A"
    role: Core
    team: DevTeam
}

bc OrderContext {
    team: DevTeam
    description: "A"
    role: Core
}

bc OrderContext {
    metadata { Language: "Java" }
    description: "A"
}
```

---

## Implementation Plan

### Phase 1: Grammar Changes (Breaking)

**Files to modify:**

- `packages/language/src/domain-lang.langium`

**Tasks:**

1. Replace `DomainDocumentationBlock` union with direct properties
2. Replace `BoundedContextDocumentationBlock` union with direct properties
3. Keep collection blocks (relationships, terminology, decisions, metadata)
4. Remove unused block types from grammar
5. Run `npm run langium:generate` to regenerate AST
6. Run `npm run build` to verify TypeScript compilation

### Phase 2: SDK Updates

**Files to modify:**

- `packages/language/src/sdk/resolution.ts` - Simplify resolution functions
- `packages/language/src/sdk/ast-augmentation.ts` - Update augmentation logic
- `packages/language/src/sdk/query.ts` - Update iteration logic

**Before:**

```typescript
export function resolveBcDescription(bc: BoundedContext): string | undefined {
    const block = findBlock<DescriptionBlock>(bc.documentation, isDescriptionBlock);
    return block?.description;
}
```

**After:**

```typescript
export function resolveBcDescription(bc: BoundedContext): string | undefined {
    return bc.description;  // Direct access - function may be unnecessary
}
```

**Consider:** Can we remove resolution functions entirely and just use direct properties?

### Phase 3: Validation Updates

**Files to modify:**

- `packages/language/src/validation/bounded-context.ts`
- `packages/language/src/validation/domain.ts`

**Before:**

```typescript
function validateBoundedContextHasDescription(bc: BoundedContext, accept: ValidationAcceptor): void {
    const hasDescription = bc.documentation?.some(
        (block: BoundedContextDocumentationBlock) => isDescriptionBlock(block) && block.description
    );
    if (!hasDescription) {
        accept('warning', ValidationMessages.BOUNDED_CONTEXT_NO_DESCRIPTION(bc.name), { node: bc });
    }
}
```

**After:**

```typescript
function validateBoundedContextHasDescription(bc: BoundedContext, accept: ValidationAcceptor): void {
    if (!bc.description) {
        accept('warning', ValidationMessages.BOUNDED_CONTEXT_NO_DESCRIPTION(bc.name), { node: bc });
    }
}
```

**New validations needed:**

- Warn/error if both inline and block properties are defined (e.g., `as Core` + `role: Generic`)

### Phase 4: LSP Updates

**Files to modify:**

- `packages/language/src/lsp/hover/domain-lang-hover.ts`
- `packages/language/src/lsp/domain-lang-completion.ts`

**Before:**

```typescript
if (ast.isBoundedContext(node)) {
    const descriptionBlock = n.documentation.find(ast.isDescriptionBlock);
    const teamBlock = n.documentation.find(ast.isTeamBlock);
    const description = descriptionBlock ? descriptionBlock.description : undefined;
    const team = teamBlock?.team;
    // ...
}
```

**After:**

```typescript
if (ast.isBoundedContext(node)) {
    const description = n.description;
    const team = n.team;
    // Direct access - much cleaner
}
```

### Phase 5: Test Updates

**Files to modify:**

- `packages/language/test/**/*.test.ts` - All tests using `documentation` arrays

**Strategy:**

1. Search for `documentation.find(`, `documentation.some(`, `documentation?.find`
2. Replace with direct property access
3. Update assertions to check properties directly
4. Remove unused type guard imports

**Example:**

```typescript
// Before
const descBlock = bc.documentation?.find(isDescriptionBlock);
expect(descBlock?.description).toBe('Test');

// After
expect(bc.description).toBe('Test');
```

### Phase 6: Documentation Updates

**User-facing documentation files to update:**

1. **`docs/language.md`** - Complete language reference
   - Update Domain syntax and properties section
   - Update BoundedContext syntax and properties section
   - Remove references to documentation blocks
   - Add examples with direct properties
   - Update AST structure diagrams

2. **`docs/quick-reference.md`** - Syntax cheat sheet
   - Update Domain syntax example
   - Update BoundedContext syntax example
   - Remove block-based examples
   - Ensure all property names match new grammar

3. **`docs/syntax-examples.md`** - Comprehensive code examples
   - Update all Domain examples to use direct properties
   - Update all BoundedContext examples to use direct properties
   - Ensure `terminology` keyword is used (not `terms`)
   - Verify collection syntax (metadata, relationships, decisions)

4. **`docs/getting-started.md`** - Beginner tutorial
   - Update first example to use new syntax
   - Ensure tutorial examples are correct
   - Update any mentions of AST structure

5. **`packages/language/README.md`** - Package documentation
   - Update AST structure description
   - Correct examples if present
   - Update SDK usage examples

6. **`packages/language/src/sdk/README.md`** - SDK documentation
   - Update augmented properties list (remove documentation arrays)
   - Update code examples to use direct properties
   - Simplify resolution examples

7. **Example files (`examples/*.dlang`)**
   - `examples/banking-system.dlang`
   - `examples/customer-facing.dlang`
   - `examples/domains.dlang`
   - `examples/healthcare-system.dlang`
   - `examples/metadata-*.dlang`
   - All other `.dlang` examples in workspace

**Repository instruction files to update:**

8. **`.github/copilot-instructions.md`** - Main Copilot guidance
   - Update architecture table if AST structure mentioned
   - Ensure validation examples use direct properties

9. **`.github/instructions/langium.instructions.md`** - Langium-specific rules
   - Update grammar patterns and examples
   - Document new property access patterns
   - Remove references to documentation block traversal

10. **`.github/instructions/typescript.instructions.md`** - TypeScript guidelines
    - Update AST access patterns
    - Remove examples showing `documentation.find()` traversal
    - Add examples of direct property access
    - Update SDK usage patterns

11. **`.github/instructions/testing.instructions.md`** - Test patterns
    - Update test assertion examples
    - Document new patterns for checking properties
    - Remove block-based test patterns

**Grammar documentation (JSDoc):**

12. **`packages/language/src/domain-lang.langium`**
    - Add/update JSDoc for Domain properties
    - Add/update JSDoc for BoundedContext properties
    - Ensure hover tooltips are accurate
    - Document property semantics inline

---

## AST Changes

**Removed types:**

- `DomainDocumentationBlock` (union type)
- `BoundedContextDocumentationBlock` (union type)
- `DescriptionBlock` (interface)
- `VisionBlock` (interface)
- `DomainClassificationBlock` (interface)
- `RoleBlock` (interface)
- `TeamBlock` (interface)
- `BusinessModelBlock` (interface)
- `LifecycleBlock` (interface)
- `BoundedContextClassificationBlock` (interface)

**Updated interfaces:**

```typescript
// Before
interface Domain {
    documentation: DomainDocumentationBlock[];
}

interface BoundedContext {
    documentation: BoundedContextDocumentationBlock[];
}

// After
interface Domain {
    description?: string;
    vision?: string;
    classification?: Reference<Classification>;
}

interface BoundedContext {
    description?: string;
    role?: Reference<Classification>;
    team?: Reference<Team>;
    businessModel?: Reference<Classification>;
    lifecycle?: Reference<Classification>;
    metadataEntries: MetadataEntry[];
    relationships: Relationship[];
    terminology: DomainTerm[];
    decisions: AbstractDecision[];
}
```

### Code Update Patterns

#### Pattern 1: Finding Blocks

```typescript
// ❌ Old code
const descBlock = bc.documentation?.find(isDescriptionBlock);
const description = descBlock?.description;

// ✅ New code
const description = bc.description;
```

#### Pattern 2: Checking Existence

```typescript
// ❌ Old code
const hasDescription = bc.documentation?.some(
    block => isDescriptionBlock(block) && block.description
);

// ✅ New code
const hasDescription = bc.description !== undefined;
```

#### Pattern 3: Collection Access

```typescript
// ❌ Old code
const metaBlock = bc.documentation?.find(isMetadataBlock);
const metadata = metaBlock?.entries ?? [];

// ✅ New code
const metadata = bc.metadata;  // Always an array, never undefined
```

#### Pattern 4: SDK Resolution

```typescript
// ❌ Old code - complex precedence
import { resolveBcRole } from '../sdk/resolution.js';
const role = resolveBcRole(bc);

// ✅ New code - direct access (consider removing resolution functions)
const role = bc.role?.ref;
```

---

## Benefits

### Immediate Benefits

| Benefit | Impact |
|---------|--------|
| **Cleaner AST** | Direct properties instead of union arrays |
| **Simpler code** | Remove type guards and iteration logic |
| **Better IDE support** | Autocomplete shows actual properties |
| **Fewer lines of code** | ~30% reduction in validation/SDK code |
| **Clearer semantics** | One property = one value, no precedence |

### Developer Experience

**Before (5+ lines):**

```typescript
const roleBlock = bc.documentation?.find(isRoleBlock);
const classBlock = bc.documentation?.find(isBoundedContextClassificationBlock);
const role = bc.role?.ref ?? roleBlock?.role?.ref ?? classBlock?.role?.ref;
```

**After (1 line):**

```typescript
const role = bc.role?.ref;
```

### Maintenance

- ✅ Fewer type guards to maintain (`isDescriptionBlock`, `isRoleBlock`, etc.)
- ✅ No precedence rules to document and enforce
- ✅ Simpler validation logic (direct property checks)
- ✅ Less duplication across modules

---

## Implementation Notes

- **Code updates needed:** All modules that access `documentation` arrays will need updates
- **Testing:** Comprehensive test suite updates required to use new AST structure
- **Single occurrences:** Each property can only be defined once (enforced by parser)
- **Documentation scope:** This change affects 12+ documentation files (user docs + repo instructions)
- **Documentation validation:** All example files must parse successfully before merging
- **Backward compatibility:** None - this is a clean slate improvement since no external users exist yet

---

## Acceptance Criteria

### Grammar & Generation

- [ ] Grammar updated with direct properties for Domain and BoundedContext
- [ ] `npm run langium:generate` succeeds without errors
- [ ] `npm run build` succeeds without errors

### Code Updates

- [ ] SDK resolution functions simplified or removed
- [ ] All validation modules use direct property access
- [ ] All LSP providers (hover, completion) updated
- [ ] All tests pass with updated AST structure
- [ ] `npm run lint` passes with zero violations

### Documentation Updates

- [ ] `docs/language.md` - Grammar and AST sections updated
- [ ] `docs/quick-reference.md` - All syntax examples corrected
- [ ] `docs/syntax-examples.md` - All code samples use new properties
- [ ] `docs/getting-started.md` - Tutorial examples validated
- [ ] `packages/language/README.md` - Package docs updated
- [ ] `packages/language/src/sdk/README.md` - SDK docs updated
- [ ] All example files (`examples/*.dlang`) parse correctly with new grammar

### Repository Instructions

- [ ] `.github/copilot-instructions.md` - Updated if AST mentioned
- [ ] `.github/instructions/langium.instructions.md` - Grammar patterns updated
- [ ] `.github/instructions/typescript.instructions.md` - AST access patterns updated
- [ ] `.github/instructions/testing.instructions.md` - Test patterns updated

### Grammar Documentation

- [ ] JSDoc added/updated for Domain properties
- [ ] JSDoc added/updated for BoundedContext properties
- [ ] Hover tooltips tested and accurate

### Validation

- [ ] Examples updated (`examples/*.dlang` all parse correctly)
- [ ] Performance benchmarks show no regression
- [ ] No console errors or warnings in development

---

## Implementation Decisions

1. **Resolution functions:** Remove entirely - direct property access (`bc.role?.ref`) is simpler and clearer than wrapper functions.

2. **Inline vs block conflicts:** Validate as error - if both inline `as Core` and block `role: Generic` are present, show validation error to force user to pick one. This prevents confusion.

3. **Classifications block:** Remove it - redundant now that `role`, `businessModel`, and `lifecycle` are direct properties at the top level. The nested grouping doesn't provide value when properties are directly accessible.

4. **Metadata structure:** Keep block structure - groups related key-value entries naturally and allows multiple items (`metadata { Language: "Java", Framework: "Spring" }`).

5. **Terminology vs terms:** Use `terminology` property to match the keyword and better reflect the DDD concept of Ubiquitous Language.

6. **Decisions/rules/policies:** Single `decisions` property - in DDD, these are all forms of domain constraints/governance. The grammar accepts multiple keywords (`decisions`, `constraints`, `rules`, `policies`) for natural language, but they all map to the same collection of `AbstractDecision` types (Decision, Policy, BusinessRule).
- **ADR-002: Architectural Review** - Discusses AST ergonomics and maintainability
- **Grammar Review 2025** - Identified documentation block complexity as technical debt

---

## Timeline

| Days | Phase | Deliverables |
|------|-------|--------------|
| 1 | Grammar & Generation | Updated `.langium` file, regenerated AST |
| 2 | SDK & Validation | Simplified SDK, updated validators |
| 3 | LSP & Tests | Updated providers, all tests passing |
| 4-5 | Documentation | All docs updated (user-facing + repo instructions) |
| 5 | Final Verification | Examples validated, lint clean, ready to merge |

**Total estimated time:** 5 days (1 work week)

## Success Metrics

- **Code reduction:** 25-35% fewer lines in SDK/validation modules
- **Type guards:** Remove 8+ type guard functions
- **Traversal code:** Eliminate all `documentation.find()` calls
- **Simplicity:** Property access in 1 line instead of 5+
- **Maintainability:** Easier to add new properties in future

---

## Appendix: Alternative Considered

### Alternative 1: Keep Blocks, Add Computed Properties

**Approach:** Keep current grammar, add computed properties via AST augmentation.

**Rejected because:**

- Doesn't solve the root problem (still need block iteration internally)
- Adds complexity instead of removing it
- Computed properties hide the precedence logic instead of eliminating it

### Alternative 2: Hybrid (Flat + Some Blocks)

**Approach:** Use direct properties for common fields, keep blocks for others.

**Considered but rejected because:**

- Inconsistent: some properties direct, others in blocks
- Still requires partial block iteration
- Doesn't fully simplify the codebase

**Decision:** Full simplification is better - consistent, predictable, maintainable.

---

**Prepared by:** GitHub Copilot (AI Assistant)  
**Date:** January 17, 2026  
**Version:** 1.0
