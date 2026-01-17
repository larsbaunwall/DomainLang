# PRS-008: Grammar Simplification - Direct Property Access

**Status**: Implemented ✅  
**Priority**: High  
**Target Version**: 2.3.0  
**Effort Estimate**: 5 days (1 work week)  
**Dependencies**: PRS-007 (Model Query SDK) - SDK core is implemented but not yet adopted across the codebase. This PRS will simplify the SDK and drive adoption.

> ⚠️ **ATTENTION TO DETAIL REQUIRED:** This change touches the entire codebase—grammar, SDK, validation, LSP, tests, and documentation. Every file accessing `documentation` arrays must be updated. Missing a single location will cause runtime errors or incorrect behavior. Use the search patterns in this document systematically.

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
    (('as' role+=[Classification:QualifiedName])? ('by' team+=[Team:QualifiedName])?)?
    ('{' 
        ('description' Assignment description=STRING)?
        ('role' Assignment role+=[Classification:QualifiedName])?
        (TeamAssignment Assignment team+=[Team:QualifiedName])?
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

> **Implementation Note:** The `role` and `team` properties use `+=` operator to create arrays (`Reference<Classification>[]` and `Reference<Team>[]`). This allows both inline (`as`, `by`) and block (`role:`, `team:`) syntax to coexist. Grammar order ensures inline takes precedence (appears first in array). Validation warns when both forms are used.

**Proposed AST access** (direct):

```typescript
// ✅ Direct property access for scalars
const hasDescription = bc.description !== undefined;

// ✅ Simplified SDK resolution for dual-location properties
export function resolveBcRole(bc: BoundedContext): Classification | undefined {
    return bc.role?.[0]?.ref;  // Grammar order ensures inline (header) wins
}

export function resolveBcTeam(bc: BoundedContext): Team | undefined {
    return bc.team?.[0]?.ref;  // Grammar order ensures inline (header) wins
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
| ---- | ------- |
| **Ergonomic AST** | Direct property access: `bc.description` instead of iteration |
| **Simplified SDK** | Resolution functions become one-liners |
| **Clear semantics** | Single source of truth for each property (no precedence) |
| **Maintainability** | Fewer type guards, less traversal code |
| **Order independence** | Properties can be defined in any order |

## Non-Goals

- Support for multiple blocks of the same type (e.g., two `description` properties)
- Changes to syntax keywords (same keywords, different AST structure)

---

## User Story

As a **DomainLang SDK consumer**,  
I want to access BoundedContext and Domain properties directly (e.g., `bc.description`, `bc.role`),  
So that I can query models without iterating arrays, using type guards, or understanding block precedence rules.

**Secondary:**

As a **DomainLang contributor**,  
I want a simpler AST structure with flat properties,  
So that validation, LSP, and SDK code is easier to write, test, and maintain.

---

## Out of Scope

- **Multiple property values** - No support for multiple descriptions or visions per element
- **Keyword changes** - Same DSL keywords, only AST structure changes
- **Migration tooling** - No automatic migration of existing `.dlang` files (breaking change is acceptable since no external users exist)
- **Runtime backwards compatibility** - This is a clean-slate improvement

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
    (('as' role+=[Classification:QualifiedName])? ('by' team+=[Team:QualifiedName])?)?
    ('{' 
        // Scalar properties (direct access)
        ('description' Assignment description=STRING)?
        ('role' Assignment role+=[Classification:QualifiedName])?
        (TeamAssignment Assignment team+=[Team:QualifiedName])?
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

> **Implementation Note:** The `role` and `team` properties use `+=` operator (arrays) rather than `=` (single reference). This allows both inline header syntax (`as`, `by`) and block syntax (`role:`, `team:`) to coexist. Grammar order ensures inline values appear first in the array (index 0). Validation warns when both forms are used.

**Generated AST:**

```typescript
interface BoundedContext extends AstNode {
    name: string;
    domain?: Reference<Domain>;
    role: Reference<Classification>[];  // Array: [0]=inline, [1]=block if both present
    team: Reference<Team>[];             // Array: [0]=inline, [1]=block if both present
    
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

> **SDK Access Pattern:** Use `resolveBcRole(bc)` and `resolveBcTeam(bc)` from the SDK for precedence-aware access, or access `bc.role[0]?.ref` directly for the effective value.

**Property naming rationale:**

- **`terminology` (not `terms`):** Matches the keyword and better reflects the DDD concept of Ubiquitous Language - a shared vocabulary within a Bounded Context.
- **`decisions` (singular collection):** In DDD, Decisions, Policies, Business Rules, and Constraints are all forms of domain governance. The grammar accepts multiple keywords (`decisions`, `constraints`, `rules`, `policies`) for natural language, but they all map to the same collection. This avoids property proliferation while maintaining linguistic flexibility.

### Key Design Decisions

#### Decision 1: Optional Properties with `?`

All properties use Langium's optional operator (`?`), which:

- ✅ Allows properties in **any order**
- ✅ Generates clean TypeScript types (`property?: Type`)
- ✅ Makes omission clear (undefined if not present)
- ✅ Prevents duplicate definitions (parser error if repeated)

#### Decision 2: Flat Scalars, Structured Collections

**Scalar values** (description, vision, businessModel, lifecycle):

- Direct properties for O(1) access
- Single occurrence enforced by grammar

**Dual-location properties** (role, team):

- Use arrays (`+=` operator) to support both inline and block syntax
- Grammar order provides natural precedence (inline first)
- SDK resolution functions return `array[0]` for effective value
- Validation warns when both inline and block are used

**Collections** (relationships, terminology, decisions):

- Keep block structure for grouping
- Allows multiple items within the block
- Natural syntax: `relationships { ... }`

#### Decision 3: Grammar-Based Precedence (Implemented)

**Original proposal:** Remove precedence logic entirely, error if both inline and block used.

**Implemented approach:** Use arrays with grammar-order precedence.

- Inline `as`/`by` syntax appears first in grammar → first array element
- Block `role:`/`team:` syntax appears second → second array element
- `bc.role[0]?.ref` always gives the effective (winning) value
- Validation warns when `bc.role.length > 1` (both forms used)

**Why this is better:**

- ✅ Backwards compatible - existing files still parse
- ✅ No breaking change for SDK consumers
- ✅ Clear precedence via array index
- ✅ Validation catches ambiguous usage
- ✅ Simple resolution: `return bc.role?.[0]?.ref`

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

> 🔴 **CRITICAL:** Before starting each phase, perform a **full codebase search** for the patterns listed below. After completing each phase, verify **zero occurrences remain**. Do not proceed to the next phase until the current phase passes all tests.

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

**After (Implemented):**

```typescript
// Direct property access - trivially simple
export function resolveBcDescription(bc: BoundedContext): string | undefined {
    return bc.description;
}

// Array-based resolution for dual-location properties
export function resolveBcRole(bc: BoundedContext): Classification | undefined {
    return bc.role?.[0]?.ref;  // Grammar order ensures inline wins
}

export function resolveBcTeam(bc: BoundedContext): Team | undefined {
    return bc.team?.[0]?.ref;  // Grammar order ensures inline wins
}
```

**Note:** Resolution functions remain useful for SDK consumers who want precedence-aware access without understanding array semantics.

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

**After (Implemented):**

```typescript
function validateBoundedContextHasDescription(bc: BoundedContext, accept: ValidationAcceptor): void {
    if (!bc.description) {
        accept('warning', ValidationMessages.BOUNDED_CONTEXT_NO_DESCRIPTION(bc.name), { node: bc });
    }
}
```

**Conflict detection for dual-location properties (Implemented):**

```typescript
function validateNoRoleConflict(bc: BoundedContext, accept: ValidationAcceptor): void {
    if (bc.role.length > 1) {
        accept('warning', `Role specified in both header ('as') and body ('role:'). Using header value.`, 
            { node: bc, property: 'role' });
    }
}

function validateNoTeamConflict(bc: BoundedContext, accept: ValidationAcceptor): void {
    if (bc.team.length > 1) {
        accept('warning', `Team specified in both header ('by') and body ('team:'). Using header value.`,
            { node: bc, property: 'team' });
    }
}
```

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

**After (Implemented):**

```typescript
if (ast.isBoundedContext(node)) {
    const description = n.description;
    const team = resolveBcTeam(n);  // Returns n.team?.[0]?.ref
    const role = resolveBcRole(n);  // Returns n.role?.[0]?.ref
    // Direct access for scalars, SDK resolution for arrays
}
```

### Phase 5: Test Updates

**Files to modify:**

- `packages/language/test/**/*.test.ts` - All tests using `documentation` arrays

**Strategy:**

1. Search for `documentation.find(`, `documentation.some(`, `documentation?.find`
2. Replace with direct property access
3. Update assertions to check properties directly
4. For role/team, use array access: `bc.role?.[0]?.ref`
5. Remove unused type guard imports

**Example:**

```typescript
// Before
const descBlock = bc.documentation?.find(isDescriptionBlock);
expect(descBlock?.description).toBe('Test');

// After (Implemented)
expect(bc.description).toBe('Test');

// Before (role/team)
const roleBlock = bc.documentation?.find(isRoleBlock);
expect(roleBlock?.role?.ref?.name).toBe('Core');

// After (Implemented) - array access
expect(bc.role?.[0]?.ref?.name).toBe('Core');
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

1. **`.github/copilot-instructions.md`** - Main Copilot guidance
   - Update architecture table if AST structure mentioned
   - Ensure validation examples use direct properties

2. **`.github/instructions/langium.instructions.md`** - Langium-specific rules
   - Update grammar patterns and examples
   - Document new property access patterns
   - Remove references to documentation block traversal

3. **`.github/instructions/typescript.instructions.md`** - TypeScript guidelines
   - Update AST access patterns
   - Remove examples showing `documentation.find()` traversal
   - Add examples of direct property access
   - Update SDK usage patterns

4. **`.github/instructions/testing.instructions.md`** - Test patterns
   - Update test assertion examples
   - Document new patterns for checking properties
   - Remove block-based test patterns

**Grammar documentation (JSDoc):**

1. **`packages/language/src/domain-lang.langium`**
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
    role: Reference<Classification>[];   // Array: inline header + block body
    team: Reference<Team>[];             // Array: inline header + block body
    businessModel?: Reference<Classification>;
    lifecycle?: Reference<Classification>;
    metadata: MetadataEntry[];      // Renamed from entries in MetadataBlock
    relationships: Relationship[];
    terminology: DomainTerm[];       // Renamed from terms in TerminologyBlock
    decisions: AbstractDecision[];
}
```

> **Note:** `role` and `team` are arrays because they can be assigned in both the header (`as`, `by`) and body (`role:`, `team:`). Grammar order ensures the header value appears first (index 0), providing natural precedence.

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

#### Pattern 4: Role/Team Resolution (Dual-Location Properties)

```typescript
// ❌ Old code - complex precedence with block iteration
import { resolveBcRole } from '../sdk/resolution.js';
const role = resolveBcRole(bc);  // Searched header, then body, then classifications block

// ✅ New code - array access (grammar order provides precedence)
const role = bc.role?.[0]?.ref;  // [0] = header value if present, else body value

// Or use SDK resolution function (same behavior, clearer intent)
import { resolveBcRole } from '../sdk/resolution.js';
const role = resolveBcRole(bc);  // Returns bc.role?.[0]?.ref
```

---

## Benefits

### Immediate Benefits

| Benefit | Impact |
| ------- | ------ |
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
const role = bc.role?.[0]?.ref;  // Grammar order provides precedence
```

### Maintenance

- ✅ Fewer type guards to maintain (`isDescriptionBlock`, `isRoleBlock`, etc.)
- ✅ No precedence rules to document and enforce
- ✅ Simpler validation logic (direct property checks)
- ✅ Less duplication across modules

---

## Acceptance Testing

### Test Scenarios

1. **Direct property parsing** - Verify `bc.description`, `bc.role`, `domain.vision` are populated correctly
2. **Order independence** - Properties defined in any order produce identical AST
3. **Collection properties** - `metadata`, `relationships`, `terminology`, `decisions` arrays populate correctly
4. **Inline vs block conflict** - Validation error when both `as Core` and `role: Generic` are used
5. **Empty bodies** - `bc Name {}` and `Domain Name {}` parse without errors
6. **All examples pass** - Every file in `examples/*.dlang` parses successfully

### Regression Tests

- All existing parsing tests updated and passing
- All validation tests updated and passing
- SDK query tests work with new AST structure
- LSP hover/completion work correctly

### Manual Verification

- [ ] VS Code extension loads without errors
- [ ] Syntax highlighting unchanged
- [ ] Hover tooltips show correct property values
- [ ] Autocompletion suggests new properties inside blocks

---

## Implementation Notes

- **Code updates needed:** All modules that access `documentation` arrays will need updates
- **Testing:** Comprehensive test suite updates required to use new AST structure
- **Single occurrences:** Each property can only be defined once (enforced by parser)
- **Documentation scope:** This change affects 12+ documentation files (user docs + repo instructions)
- **Documentation validation:** All example files must parse successfully before merging
- **Backward compatibility:** None - this is a clean slate improvement since no external users exist yet

### 🔍 Required Search Patterns

**Run these searches before and after each phase to ensure complete coverage:**

```bash
# Type guards to remove (must be zero after Phase 2)
grep -rn "isDescriptionBlock\|isVisionBlock\|isRoleBlock\|isTeamBlock" packages/
grep -rn "isBusinessModelBlock\|isLifecycleBlock\|isMetadataBlock" packages/
grep -rn "isBoundedContextClassificationBlock\|isDomainClassificationBlock" packages/

# Documentation array access (must be zero after Phase 3)
grep -rn "documentation\.find\|documentation\.some\|documentation\.filter" packages/
grep -rn "documentation\?\.find\|documentation\?\.some" packages/
grep -rn "\.documentation" packages/

# Resolution function imports (review after Phase 2)
grep -rn "resolveBcRole\|resolveBcTeam\|resolveBcDescription" packages/
grep -rn "resolveDomainVision\|resolveDomainDescription" packages/

# Block type imports (must be zero after completion)
grep -rn "DomainDocumentationBlock\|BoundedContextDocumentationBlock" packages/
grep -rn "DescriptionBlock\|VisionBlock\|RoleBlock\|TeamBlock" packages/
```

**Expected results after full implementation:**

- All search patterns above return **0 matches** in `packages/language/src/`
- Only documentation files may reference old patterns (in "before" examples)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Grammar ambiguity with optional properties | Low | High | Thorough testing of property order combinations |
| Performance regression in parsing | Low | Medium | Benchmark before/after; Langium handles optional properties efficiently |
| **Missed code locations using old AST** | **High** | **High** | **Systematic grep searches (see Required Search Patterns); Zero-tolerance policy - all searches must return 0 matches before merge** |
| Documentation drift | Medium | Low | Checklist-driven updates; CI validation of example files |
| Tests passing but incomplete coverage | Medium | Medium | Review each test file; ensure direct property assertions replace block traversals |

---

## Acceptance Criteria

### Pre-Implementation Verification

- [ ] **Baseline search results captured** - Document current grep hit counts for all search patterns
- [ ] **PRS-007 SDK reviewed** - Understand current resolution functions before simplifying
- [ ] **All test files identified** - List every test that uses `documentation` arrays

### Grammar & Generation

- [ ] Grammar updated with direct properties for Domain and BoundedContext
- [ ] `npm run langium:generate` succeeds without errors
- [ ] `npm run build` succeeds without errors

### Code Updates

- [ ] **All search patterns return 0 matches** (see Required Search Patterns section)
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

---

## Design Considerations

### Architectural Implications

- **AST structure change** - All code accessing `documentation` arrays must be updated
- **No migration path** - This is a breaking change; existing `.dlang` files continue to work (same syntax)
- **SDK simplification** - Resolution functions may become unnecessary (direct property access)
- **Type guard removal** - 8+ type guards (`isDescriptionBlock`, `isRoleBlock`, etc.) can be deleted

### Performance Considerations

- **Parsing** - No performance impact (same tokens, different AST shape)
- **Memory** - Slight reduction (fewer intermediate objects)
- **Validation** - Faster (direct property access vs array iteration)

### Backward Compatibility

- **DSL syntax** - Fully backward compatible (same keywords and syntax)
- **AST structure** - Breaking change (new property locations)
- **SDK API** - Breaking change (resolution functions removed/simplified)

**Related ADRs:**

- [ADR-002: Architectural Review 2025](../adr/002-architectural-review-2025.md) - Discusses AST ergonomics and maintainability
- [Grammar Review 2025](../dsl/domain-lang/docs/design-docs/GRAMMAR_REVIEW_2025.md) - Identified documentation block complexity as technical debt

---

## Timeline

| Days | Phase | Deliverables |
| ---- | ----- | ------------ |
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

## Open Questions

1. **~Should resolution functions be removed entirely?~** → **Resolved:** Yes, direct property access (`bc.role?.ref`) is clearer than wrapper functions.

2. **~Should we keep the `classifications` block for grouping?~** → **Resolved:** No, remove it. Direct properties (`role`, `businessModel`, `lifecycle`) are simpler and the grouping doesn't add value.

3. **Property naming for terminology block** → Use `terminology` (matches keyword, reflects DDD concept of Ubiquitous Language). The grammar property `terms` in `TerminologyBlock` becomes `terminology` on `BoundedContext`.

4. **Property naming for metadata block** → Use `metadata` (matches keyword). The grammar property `entries` in `MetadataBlock` becomes `metadata` on `BoundedContext`.

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
