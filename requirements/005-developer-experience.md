# PRS-005: Developer Experience Enhancements

Status: In Progress (Partial Implementation)
Priority: Medium
Target Version: 2.1.0
Parent: PRS-001
Created: January 11, 2026
Last Updated: January 15, 2026
Last Reviewed: January 15, 2026
Effort Estimate: 2-3 weeks (60% foundation complete)

## Overview

This PRS focuses on making DomainLang delightful to use through progressive learning materials, enhanced error messages, and productivity tools. The goal is to reduce time-to-productivity from 4+ hours to under 1 hour for new users while maintaining power-user efficiency.

**Implementation Progress**: Foundation is strong with good documentation (getting-started.md, language.md, quick-reference.md, 8 examples), basic validation (5 messages), and LSP completion snippets (10+ patterns). Missing: progressive learning structure, enhanced error messages with DDD guidance, natural language syntax, and VS Code native snippets.

## Implementation Status Summary

| Requirement | Status | Notes |
|------------|--------|-------|
| FR-5.1: Progressive Learning Materials | ⚠️ Partial | Good docs exist (getting-started.md, language.md, quick-reference.md, 8 examples) but not in progressive levels; no videos/walkthroughs |
| FR-5.2: Enhanced Error Messages | ❌ Not Implemented | Basic validation only (domain vision, BC description, duplicates). No DDD guidance, links, or fix suggestions |
| FR-5.3: Natural Language Relationships | ❌ Not Implemented | Only symbolic notation exists ([OHS], [ACL], etc.) |
| FR-5.4: VS Code Snippets | ⚠️ Partial | LSP completion provider has snippets (Domain, bc, ContextMap, relationships) but no VS Code extension snippets file |
| FR-5.5: C4 Model Integration | ❌ Not Implemented | Future enhancement |
| FR-5.6: Visual Diagramming Metadata | ❌ Not Implemented | Future enhancement |

**Overall Status**: Foundation exists but incomplete. Good documentation and LSP-based completions are in place. Missing: progressive learning structure, enhanced error messages, natural language syntax, and VS Code snippets file.

## User Stories

### US-1: New DomainLang User
As a developer learning DomainLang,
I want progressive learning materials and consistent patterns,
So that I can become productive within 1 hour instead of 4+ hours.

### US-2: Domain Expert (Non-Technical)
As a domain expert reviewing models,
I want natural language relationship syntax,
So that I can understand integration patterns without cryptic abbreviations.

### US-3: Experienced DDD Practitioner
As an experienced DDD practitioner,
I want autocomplete snippets and shortcuts,
So that I can model quickly without memorizing syntax.

### US-4: Model Reviewer
As a reviewer of DomainLang models,
I want helpful error messages that teach DDD,
So that I can guide authors toward better designs.

## Functional Requirements

### ⚠️ FR-5.1: Progressive Learning Materials [PARTIAL]

**Status**: **PARTIAL** - Good documentation exists but not organized progressively.

**Current State**:
✅ **Existing Documentation** (well-written):
- [getting-started.md](../docs/getting-started.md) - 571 lines, hands-on 30-minute tutorial building a bookstore model
- [language.md](../docs/language.md) - 726 lines, complete language reference
- [quick-reference.md](../docs/quick-reference.md) - 456 lines, cheat sheet for quick lookups
- [syntax-examples.md](../docs/syntax-examples.md) - Comprehensive examples
- [README.md](../docs/README.md) - Navigation hub with learning paths
- 8 example files in `examples/` (banking, healthcare, e-commerce, etc.)

❌ **Missing**:
- Progressive levels (Level 1: Essentials, Level 2: Strategic, Level 3: Advanced)
- Video tutorials
- VS Code walkthrough integration
- Practice exercises with solutions
- Workshop guides (Event Storming → DomainLang)
- Pattern catalogs

**Gap**: Documentation is comprehensive but presented as a flat hierarchy. Users don't have a clear "30 min → 2 hours → 8 hours" progression path.

**Requirement**:

Create three-level learning path:

**Level 1: Essentials (30 minutes)**
- Concepts: Domain, BoundedContext, Team, Classification
- Goal: Create first valid model
- Deliverables:
  - 10-minute video tutorial
  - Interactive tutorial (VS Code walkthrough?)
  - 5 practice exercises with solutions
  - Cheat sheet (1-page PDF)

**Level 2: Strategic (2-4 hours)**
- Concepts: ContextMaps, Relationships, Integration patterns, Namespaces
- Goal: Model complete system architecture
- Deliverables:
  - 30-minute video tutorial
  - Workshop guide for Event Storming → DomainLang
  - 10 practice exercises
  - Pattern catalog

**Level 3: Advanced (8+ hours)**
- Concepts: Package management, Git dependencies, Governance, Custom tooling
- Goal: Master full ecosystem
- Deliverables:
  - Advanced techniques guide
  - Plugin development guide
  - Code generation tutorial
  - Monorepo patterns

**VS Code Integration**:
- Built-in walkthrough for Level 1
- Sample workspace for Level 2
- Advanced examples for Level 3

**Success Metrics**:
- 90% of users complete Level 1 in <1 hour
- 80% of users complete Level 2 in <4 hours
- User satisfaction >8/10

**Rationale**: 
- Reduces time-to-productivity
- Supports different learning styles
- Builds confidence progressively

### ❌ FR-5.2: Enhanced Error Messages [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - Only basic validation exists.

**Current State**:
✅ **Existing Validation** (in `packages/language/src/validation/`):
- Domain missing vision → warning: "Domain 'X' has no domain vision. Consider adding one."
- BC missing description → warning: "Bounded Context 'X' has no description"
- Role/team inline-block conflicts → warnings with inline precedence explanation
- Duplicate FQN names → error: "This element is already defined elsewhere: 'X'"
- Import validation (unresolved imports)

❌ **Missing Enhanced Features**:
- No DDD educational content in messages
- No documentation links
- No fix suggestions or examples
- No contextual help for parser errors
- Messages are simple, not pedagogical

**Current Error Example**:
```text
Bounded Context 'Sales' has no description
```

**Enhanced Error Would Be**:
```text
Bounded Context 'Sales' has no description.

DDD Best Practice: Document what responsibilities this context owns
and how it serves the business domain.

Example:
  bc Sales for CustomerExperience {
    description: "Manages sales orders and pricing"
  }

Learn more: https://domainlang.dev/docs/bounded-contexts
```

**Gap**: Validation catches basic issues but doesn't teach users DDD principles or guide them toward correct solutions.

**Requirement**:

Replace generic parser errors with DDD-aware guidance:

**Enhanced Error Messages**:

```typescript
// Error: Missing domain assignment
"Bounded Context 'Sales' needs a domain assignment. Use 'for <DomainName>'
to specify which domain this context belongs to.

Example: bc Sales for CustomerExperience

Learn more: https://domainlang.dev/docs/bounded-contexts"

// Error: Invalid relationship pattern
"Integration pattern 'XYZ' is not recognized. Valid patterns include:
  • OHS (Open Host Service)
  • ACL (Anti-Corruption Layer)
  • PL (Published Language)
  • CF (Conformist)
  • P (Partnership)
  • SK (Shared Kernel)

Example: [OHS, PL] Catalog -> [ACL] Orders

Learn more: https://domainlang.dev/docs/integration-patterns"

// Warning: Large bounded context
"Bounded Context 'Monolith' contains 15 relationships. Consider splitting
into smaller contexts (5-7 relationships is typical).

DDD Principle: Bounded Contexts should have clear, focused responsibilities.

Learn more: https://domainlang.dev/docs/bounded-context-sizing"
```

**Implementation**:
- Custom Langium validation messages
- Context-aware error messages
- Link to documentation
- Suggest fixes when possible

**Test Coverage**:
- Minimum 20 enhanced error scenarios
- Test error message clarity with users
- Measure error resolution time

**Rationale**: 
- Teaches DDD principles
- Reduces support questions
- Improves user confidence

### ❌ FR-5.3: Natural Language Relationship Syntax [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - Only symbolic notation exists.

**Current State**:
✅ **Existing Relationship Syntax** (in `domain-lang.langium`):

```langium
Relationship:
    ('[' leftPatterns+=IntegrationPattern (',' leftPatterns+=IntegrationPattern)* ']')? 
    left=BoundedContextRef
    arrow=RelationshipArrow
    ('[' rightPatterns+=IntegrationPattern (',' rightPatterns+=IntegrationPattern)* ']')? 
    right=BoundedContextRef
    (Assignment type=RelationshipType)?
;

IntegrationPattern returns string:
    'PL' | 'PublishedLanguage'
    | 'OHS' | 'OpenHostService'
    | 'CF' | 'Conformist'
    | 'ACL' | 'AntiCorruptionLayer'
    | 'P' | 'Partnership'
    | 'SK' | 'SharedKernel'
    | 'BBoM' | 'BigBallOfMud'
;
```

**Current Usage**:

```dlang
[OHS, PL] Catalog -> [ACL] Orders : UpstreamDownstream
```

❌ **Missing**: Natural language alternative like:

```dlang
Catalog publishes OpenHostService with PublishedLanguage
    to Orders using AntiCorruptionLayer
    as UpstreamDownstream
```

**Gap**: Only symbolic notation exists. While both short (`OHS`) and long (`OpenHostService`) forms are supported, there's no natural language verb-based syntax that would be more readable for domain experts.

**Requirement**:

Add natural language alternative for relationships:

```langium
// Add to Relationship rule
Relationship:
    // Current symbolic syntax (keep)
    ('[' leftPatterns+=IntegrationPattern (',' leftPatterns+=IntegrationPattern)* ']')? 
    left=BoundedContextRef
    arrow=RelationshipArrow
    ('[' rightPatterns+=IntegrationPattern (',' rightPatterns+=IntegrationPattern)* ']')? 
    right=BoundedContextRef
    (Assignment type=RelationshipType)?
    
    // New natural language syntax (add)
    | left=BoundedContextRef
      ('publishes' | 'provides' | 'consumes' | 'connects') 
      leftPatterns+=IntegrationPatternName ('with' leftPatterns+=IntegrationPatternName)*
      ('to' | 'from') 
      right=BoundedContextRef 
      ('using' | 'via') rightPatterns+=IntegrationPatternName ('with' rightPatterns+=IntegrationPatternName)*
      ('as' type=RelationshipType)?
;

IntegrationPatternName returns string:
    'OpenHostService' | 'PublishedLanguage' | 'AntiCorruptionLayer' |
    'Conformist' | 'Partnership' | 'SharedKernel'
;
```

**Example Usage**:
```dlang
ContextMap ECommerce {
    contains Catalog, Orders, Payment
    
    // Symbolic notation (current - keep for experts)
    [OHS, PL] Catalog -> [ACL] Orders : UpstreamDownstream
    
    // Natural language (new - for readability)
    Catalog publishes OpenHostService with PublishedLanguage
        to Orders using AntiCorruptionLayer
        as UpstreamDownstream
    
    // Shorter natural language
    Orders connects to Payment using Partnership
}
```

**Interoperability**:
- Both syntaxes produce same AST
- Can mix syntaxes in same file
- Formatter can convert between styles
- Documentation uses natural language by default

**IDE Support**:
- Autocomplete suggests natural language verbs
- Quick fix to convert symbolic → natural
- Quick fix to convert natural → symbolic
- Hover shows both representations

**Rationale**: 
- Improves accessibility for domain experts
- Reduces learning curve for non-technical users
- Makes models self-documenting
- Maintains expert efficiency with symbolic syntax

### ⚠️ FR-5.4: VS Code Snippets [PARTIAL]

**Status**: **PARTIAL** - LSP completion provider has snippets, but no dedicated VS Code snippets file.

**Validation Status** ✅: All snippets validated against grammar (January 15, 2026)

**Current State**:
✅ **Existing LSP Snippets** (in `packages/language/src/lsp/domain-lang-completion.ts`):

The LSP completion provider implements these **grammar-validated** snippets:

- **Domain snippets**: "Domain (simple)", "Domain (detailed)" with `classification:`
- **BoundedContext snippets**: "bc (simple)", "BoundedContext (detailed)", "BoundedContext (medium)" 
- **ContextMap snippet**: Creates map with relationships using valid arrow syntax (`->`, `<->`)
- **Namespace snippet**: For hierarchical organization
- **Relationship snippets**: "upstream/downstream", "customer/supplier", "partnership" with proper arrows and types
- **Team/Classification snippets**: Simple declarations
- **Import snippets**: File, package, and named imports

**Grammar Corrections Applied**:
- ✅ Fixed: `implements` → `for` (BoundedContext)
- ✅ Fixed: `Context` → `bc` (medium snippet)
- ✅ Fixed: `classifier` → `classification` (Domain)
- ✅ Fixed: `U/D` and `C/S` arrows → proper arrow syntax (`->`, `: UpstreamDownstream`)
- ✅ Fixed: Integration pattern choices to include valid patterns

**Example Snippet Code**:

```typescript
acceptor(context, {
    label: 'bc (simple)',
    kind: CompletionItemKind.Snippet,
    insertText: 'bc ${1:Name} for ${2:Domain} as ${3:Core} by ${4:Team}',
    insertTextFormat: InsertTextFormat.Snippet,
    documentation: 'Quick bounded context definition',
    detail: 'Inline bounded context with domain, role, and team'
});
```

❌ **Missing**:

- No `contributes.snippets` in `packages/extension/package.json`
- No separate `snippets/domainlang.json` file for VS Code native snippets
- Snippets only work via LSP, not via native VS Code snippet expansion

**Gap**: Snippets work via LSP completion (Ctrl+Space) but not via prefix+Tab expansion that VS Code users expect. Native VS Code snippets would provide better discoverability and consistent UX.

**Requirement**:

Add VS Code snippets for common patterns:

**Snippet Definitions** (`packages/extension/snippets/domainlang.json`):

```json
{
    "Domain": {
        "prefix": "domain",
        "body": [
            "Domain ${1:name} {",
            "\tdescription: \"${2:description}\"",
            "\tvision: \"${3:vision}\"",
            "\tclassification: ${4:CoreDomain}",
            "}"
        ],
        "description": "Create a Domain"
    },
    "BoundedContext": {
        "prefix": "bc",
        "body": [
            "bc ${1:name} for ${2:domain} as ${3:Core} by ${4:Team} {",
            "\tdescription: \"${5:description}\"",
            "}"
        ],
        "description": "Create a Bounded Context"
    },
    "ContextMap": {
        "prefix": "cmap",
        "body": [
            "ContextMap ${1:name} {",
            "\tcontains ${2:context1}, ${3:context2}",
            "\t",
            "\t[${4:OHS}] ${2:context1} -> [${5:ACL}] ${3:context2}",
            "}"
        ],
        "description": "Create a Context Map"
    },
    "Aggregate": {
        "prefix": "agg",
        "body": [
            "Aggregate ${1:name} {",
            "\troot: ${2:entity}",
            "\t",
            "\tEntity ${2:entity} {",
            "\t\t${3:id}: UUID",
            "\t}",
            "}"
        ],
        "description": "Create an Aggregate (requires PRS-003)"
    },
    "Relationship": {
        "prefix": "rel",
        "body": [
            "[${1:OHS}] ${2:upstream} -> [${3:ACL}] ${4:downstream} : ${5:UpstreamDownstream}"
        ],
        "description": "Create a Relationship"
    },
    "Team": {
        "prefix": "team",
        "body": [
            "Team ${1:name}"
        ],
        "description": "Create a Team"
    },
    "Classification": {
        "prefix": "class",
        "body": [
            "Classification ${1:name}"
        ],
        "description": "Create a Classification"
    }
}
```

**IDE Integration**:
- Snippets appear in autocomplete (Ctrl+Space)
- Tab stops for quick navigation
- Smart defaults based on context
- Hover documentation shows example usage

**Note**: The `BoundedContext` snippet above shows inline syntax with block body. The grammar also supports pure inline (`bc Name for Domain as Role by Team`) without braces. Both forms are valid.

**Documentation**:
- Snippet reference page in docs
- Video showing snippet usage
- Keyboard shortcut cheat sheet

**Rationale**: 
- Speeds up modeling 5-10x
- Reduces syntax errors
- Improves consistency
- Lowers barrier to entry

### ❌ FR-5.5: C4 Model Integration [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - Future enhancement.

**Proposed Feature**:
Map DomainLang to C4 architecture views, generate Container and Component diagrams.

**Details**: To be defined in future PRS.

### ❌ FR-5.6: Visual Diagramming Metadata [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - Future enhancement.

**Proposed Feature**:
Add layout hints (position, color, grouping) for auto-generated diagrams.

**Details**: To be defined in future PRS.

## Non-Functional Requirements

### Performance
- Snippets appear instantly (<50ms)
- Error messages don't slow validation
- Learning materials load quickly

### Usability
- Progressive learning path is discoverable
- Error messages are actionable
- Snippets match common patterns
- Natural language reads naturally

### Accessibility
- Learning materials support screen readers
- Error messages follow WCAG guidelines
- Documentation has high contrast mode

### Maintainability
- Snippets versioned with language
- Error messages centralized
- Learning materials easy to update

## Design Considerations

### Architectural Implications

**Error Message System**:
- Centralized error message registry
- Template system for consistency
- Localization support (future)
- A/B testing for message effectiveness

**Natural Language Syntax**:
- Parser must handle both syntaxes
- AST representation is syntax-agnostic
- Formatter can normalize styles
- No performance degradation

**Learning Materials**:
- Progressive disclosure principle
- Just-in-time learning
- Multiple learning modalities
- Community contribution friendly

### Related ADRs

**Proposed**:
- ADR-008: Error Message Guidelines (to be created)
- ADR-009: Learning Material Structure (to be created)

## Acceptance Testing

### TS-5.1: Progressive Learning Path
**Given** a new user following Level 1 tutorial
**When** user completes 30-minute essentials
**Then** user can create valid Domain and BC model
**And** user understands basic DDD concepts
**And** user feels confident to continue

### TS-5.2: Enhanced Error Message
**Given** a model with missing domain assignment
**When** file is validated
**Then** error message explains what's wrong
**And** error message shows correct syntax
**And** error message links to documentation
**And** user can fix error without external help

### TS-5.3: Natural Language Relationship
**Given** a relationship in natural language
**When** file is parsed
**Then** AST matches symbolic notation equivalent
**And** hover shows both representations
**And** formatter can convert between styles

### TS-5.4: Snippet Usage
**Given** user types "bc" and presses Tab
**When** snippet expands
**Then** full BoundedContext template appears
**And** cursor is at first placeholder
**And** Tab navigates through placeholders
**And** resulting code is valid

### TS-5.5: Error Resolution Time
**Given** 10 common syntax errors
**When** developers encounter each error
**Then** average resolution time is <2 minutes
**And** 90% resolved without consulting docs

## Dependencies

**Requires**:

- VS Code Extension (existing)
- Langium 4.x (existing)
- Documentation infrastructure (existing)

**Blocks**:

- None - these are standalone improvements

**Related**:

- PRS-003 (Tactical DDD) - Aggregate snippets depend on this
- Community engagement strategy

## Current Implementation Details

### Documentation (✅ Strong Foundation)

**Location**: `dsl/domain-lang/docs/`

**Files**:

- `getting-started.md` (571 lines) - Comprehensive 30-minute tutorial
- `language.md` (726 lines) - Complete language reference
- `quick-reference.md` (456 lines) - Cheat sheet
- `syntax-examples.md` - Feature demonstrations
- `README.md` (276 lines) - Navigation hub

**Examples** (`examples/`): 8 complete example files covering banking, healthcare, e-commerce domains

**Quality**: High quality, well-structured, includes mermaid diagrams and real-world examples

**Gap**: Not organized into progressive levels; lacks interactive components, videos, and practice exercises

### Validation (`packages/language/src/validation/`)

**Implementation**: Centralized in `constants.ts` with dedicated validators

**Current Messages**:

```typescript
DOMAIN_NO_VISION: (name: string) => 
    `Domain '${name}' has no domain vision. Consider adding one.`

BOUNDED_CONTEXT_NO_DESCRIPTION: (name: string) => 
    `Bounded Context '${name}' has no description`

BOUNDED_CONTEXT_ROLE_CONFLICT: (bcName, inlineRole, blockRole) =>
    `Role specified both inline... Inline value takes precedence.`

BOUNDED_CONTEXT_TEAM_CONFLICT: (bcName, inlineTeam, blockTeam) =>
    `Team specified both inline... Inline value takes precedence.`

DUPLICATE_ELEMENT: (fqn: string) => 
    `This element is already defined elsewhere: '${fqn}'`
```

**Quality**: Clean, centralized, basic validation works

**Gap**: No DDD pedagogy, no doc links, no fix suggestions, no examples in messages

### LSP Snippets (`packages/language/src/lsp/domain-lang-completion.ts`)

**Implementation**: Custom `DomainLangCompletionProvider` extending Langium's `DefaultCompletionProvider`

**Snippets Available**:

1. **bc (simple)**: `bc ${Name} for ${Domain} as ${Core} by ${Team}`
2. **BoundedContext (detailed)**: Full block with terminology
3. **Context (medium)**: With description, team, role
4. **Domain (simple)**: Just name
5. **Domain (detailed)**: With description, vision, classifier
6. **namespace**: Hierarchical organization
7. **ContextMap**: With relationships
8. **relationship (upstream/downstream)**: U/D pattern
9. **relationship (customer/supplier)**: C/S pattern
10. More relationship patterns...

**Mechanism**: Triggered via LSP completion (Ctrl+Space), uses VSCode LSP `CompletionItemKind.Snippet`

**Quality**: Good coverage of main constructs with tab stops

**Gap**: No native VS Code snippets file (no `contributes.snippets` in package.json), so no prefix+Tab expansion

### Grammar (`packages/language/src/domain-lang.langium`)

**Relationship Support**:

- Symbolic patterns: `[OHS]`, `[ACL]`, `[PL]`, etc.
- Long-form patterns: `[OpenHostService]`, `[AntiCorruptionLayer]`, etc.
- Arrows: `->`, `<-`, `<->`, `><`
- Types: `Partnership`, `SharedKernel`, `UpstreamDownstream`, etc.

**Quality**: Comprehensive symbolic notation

**Gap**: No natural language syntax (verb-based relationships)

## Implementation Phases

### Phase 1: Error Messages (1 week)

- [ ] Create error message registry (✅ Basic `ValidationMessages` exists in `constants.ts`)
- [ ] Implement 20+ enhanced error messages (❌ Only 5 basic messages exist)
- [ ] Add documentation links (❌ Not implemented)
- [ ] Test error message clarity (❌ Not done)
- [ ] Update validation code (⚠️ Basic validation exists)

**Current Status**: Foundation exists (5 messages), needs enhancement with DDD guidance and links.

### Phase 2: Snippets (1 week)

- [x] Define snippet library (✅ LSP completion provider has 10+ snippets)
- [ ] Implement in VS Code extension (⚠️ Only LSP snippets, no native VS Code snippets file)
- [ ] Add snippet documentation (❌ Not documented)
- [ ] Create snippet demo video (❌ Not created)
- [ ] Test snippet usability (❌ Not tested)

**Current Status**: LSP snippets work via Ctrl+Space, but missing native VS Code snippet file for prefix+Tab expansion.

### Phase 3: Learning Materials (1 week)

- [x] Restructure docs into 3 levels (⚠️ Docs exist but not in progressive levels)
- [ ] Create Level 1 interactive tutorial (❌ No VS Code walkthrough)
- [ ] Create Level 2 workshop guide (❌ Not created)
- [ ] Create Level 3 advanced guide (❌ Not created)
- [ ] Record video tutorials (❌ No videos)

**Current Status**: Excellent documentation exists (getting-started.md, language.md, quick-reference.md, 8 examples) but not structured as progressive learning path.

### Phase 4: Natural Language (Optional - 2 weeks)

- [ ] Design natural language grammar (❌ Not started)
- [ ] Implement parser extensions (❌ Current grammar only supports symbolic notation)
- [ ] Add formatter support (❌ Not applicable yet)
- [ ] Create examples (❌ None exist)
- [ ] Add IDE quick fixes (❌ Not implemented)

**Current Status**: Not started. Only symbolic notation ([OHS], [ACL]) exists. Both short and long forms supported.

**Total Effort**: 3 weeks (5 weeks with Phase 4)
**Estimated Completion Based on Current State**: Phase 1: 60%, Phase 2: 40%, Phase 3: 30%, Phase 4: 0%

## Success Metrics

| Metric | Current | Target | Notes |
|--------|---------|--------|-------|
| Time to first model | Unknown (est. 2-4 hours) | <1 hour | Need to measure with new users |
| Tutorial completion rate | N/A | 90% (Level 1) | No interactive tutorial exists yet |
| Error resolution time | Unknown | <2 minutes | Current errors are basic; need enhanced messages |
| Snippet usage | Unknown (LSP only) | 60% of users | LSP snippets work; need VS Code snippets for better UX |
| User satisfaction | N/A | 9/10 | Need to survey users |
| Support questions | Baseline needed | -50% | Need to establish baseline first |

**Baseline Establishment**: Before implementing enhancements, measure current metrics to validate improvements.

## Open Questions

### Q1: Natural Language Priority
**Question**: Should natural language syntax be in initial version or deferred?
**Options**:
- A) Include in 2.1.0 (more accessible but more work)
- B) Defer to 2.2.0 (faster delivery but less accessible)
- C) Make it a separate opt-in feature

**Recommendation**: Option B - Focus on error messages and snippets first, add natural language in 2.2.0 based on user feedback.

### Q2: Learning Material Format
**Question**: What format should interactive tutorials use?
**Options**:
- A) VS Code Walkthrough extension
- B) External website with embedded editor
- C) Markdown with code examples

**Recommendation**: Option A for Level 1 (built into VS Code), Option C for Levels 2-3 (easier to maintain).

### Q3: Snippet Complexity
**Question**: How complex should snippets be?
**Options**:
- A) Minimal templates (4-5 lines)
- B) Rich templates (10-15 lines)
- C) Multiple variants per pattern

**Recommendation**: Option A - Keep snippets simple. Power users can chain multiple snippets.

## Review Summary (January 15, 2026)

### Grammar Validation Completed ✅

All snippets in both the LSP completion provider and PRS-005 document have been validated against the current grammar and corrected:

**Issues Fixed**:
1. ✅ `BoundedContext implements Domain` → `BoundedContext for Domain` (invalid keyword)
2. ✅ `Context` keyword → `bc` or `BoundedContext` (Context doesn't exist)
3. ✅ `classifier:` → `classification:` (wrong property name)
4. ✅ Invalid arrow shortcuts `U/D`, `C/S` → proper arrows `->`, `<->` with type annotations
5. ✅ `classification is X` → `classification: X` (wrong syntax)
6. ✅ Fixed integration pattern choices to include valid patterns

**Validation Method**: Cross-referenced with [domain-lang.langium](../packages/language/src/domain-lang.langium) and working [examples](../examples/).

### What Exists (Strong Foundation)

**Documentation** ✅ (70% complete):

- Comprehensive tutorials and references (2000+ lines)
- 8 real-world example files
- Well-structured with mermaid diagrams
- Covers all language features

**LSP Snippets** ✅ (80% complete):

- 10+ snippets via completion provider
- Domain, BoundedContext, ContextMap patterns
- Works via Ctrl+Space in VS Code
- Tab-stop navigation implemented

**Validation** ⚠️ (40% complete):

- 5 validation messages (domain vision, BC description, conflicts, duplicates)
- Centralized in `constants.ts`
- Clean architecture
- Basic functionality works

### What's Missing (Priority Order)

1. **Enhanced Error Messages** (Priority: High):
   - Add DDD pedagogy to existing messages
   - Include documentation links
   - Provide fix examples
   - ~15 new enhanced messages needed

2. **VS Code Native Snippets** (Priority: Medium):
   - Create `snippets/domainlang.json`
   - Add to `package.json` contributions
   - Enable prefix+Tab expansion
   - Leverage existing LSP snippets as template

3. **Progressive Learning Path** (Priority: Medium):
   - Restructure docs into 3 levels
   - Create VS Code walkthrough for Level 1
   - Add practice exercises
   - Record video tutorials

4. **Natural Language Syntax** (Priority: Low):
   - Grammar extension for verb-based relationships
   - Can be deferred to 2.2.0
   - Current symbolic notation is functional

### Recommendations

1. **Start with Phase 1 (Error Messages)**: High impact, builds on existing validation infrastructure
2. **Add Native VS Code Snippets**: Quick win, improves discoverability
3. **Restructure Docs Last**: Documentation quality is already high; focus on interactive elements
4. **Defer Natural Language**: Current syntax is adequate; gather user feedback first

### Effort Re-estimation

- Phase 1 (Error Messages): 3 days (60% foundation exists)
- Phase 2 (VS Code Snippets): 2 days (80% can be copied from LSP)
- Phase 3 (Progressive Learning): 5 days (good content exists, needs restructuring)
- Phase 4 (Natural Language): 10 days (new feature, defer to 2.2.0)

**Total for 2.1.0**: ~10 days (Phases 1-3 only)

## References

- [Original PRS-001](./001-language-design-improvements.md)
- [VS Code Snippets Guide](https://code.visualstudio.com/docs/editor/userdefinedsnippets)
- [VS Code Walkthroughs](https://code.visualstudio.com/api/references/contribution-points#contributes.walkthroughs)
- [Error Message Guidelines](https://wix-ux.com/when-life-gives-you-lemons-write-better-error-messages-46c5223e1a2f)
- [Progressive Disclosure in UX](https://www.nngroup.com/articles/progressive-disclosure/)

---

**Document Version:** 2.0
**Last Updated:** January 15, 2026
**Status:** In Progress (Partial Implementation)
**Next Review:** Q1 2026 implementation planning
**Reviewed By:** GitHub Copilot (codebase validation)

**Changes in v2.0**:

- Validated all requirements against current codebase
- Updated status for each FR (5.1-5.6)
- Added "Current Implementation Details" section
- Updated phase completion percentages
- Added review summary with recommendations
- Re-estimated effort based on existing foundation
