# PRS-005: Developer Experience Enhancements

Status: Planned
Priority: Medium
Target Version: 2.1.0
Parent: PRS-001
Created: January 11, 2026
Effort Estimate: 2-3 weeks

## Overview

This PRS focuses on making DomainLang delightful to use through progressive learning materials, enhanced error messages, and productivity tools. The goal is to reduce time-to-productivity from 4+ hours to under 1 hour for new users while maintaining power-user efficiency.

## Implementation Status Summary

| Requirement | Status | Notes |
|------------|--------|-------|
| FR-5.1: Progressive Learning Materials | ⚠️ Partial | Docs exist but not structured in progressive levels |
| FR-5.2: Enhanced Error Messages | ❌ Not Implemented | Generic parser errors only |
| FR-5.3: Natural Language Relationships | ❌ Not Implemented | Only symbolic notation exists |
| FR-5.4: VS Code Snippets | ❌ Not Implemented | No snippets defined |
| FR-5.5: C4 Model Integration | ❌ Not Implemented | Future enhancement |
| FR-5.6: Visual Diagramming Metadata | ❌ Not Implemented | Future enhancement |

**Overall Status**: Minimal implementation. Documentation exists but needs restructuring. IDE productivity features are missing.

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

**Status**: **PARTIAL** - Documentation exists but not structured progressively.

**Current State**:
Documentation exists in `docs/`:
- `getting-started.md`
- `language.md`
- `quick-reference.md`
- Various design docs

However, it's not organized into progressive learning levels.

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

**Status**: **NOT IMPLEMENTED** - Uses generic Langium parser errors.

**Current Issue**:
Generic error messages don't teach DDD or guide syntax correction.

**Example Current Error**:
```
Expecting 'for' after BoundedContext name at line 5
```

**Requirement**:

Replace generic parser errors with DDD-aware guidance:

**Enhanced Error Messages**:

```typescript
// Error: Missing domain assignment
"Bounded Context 'Sales' needs a domain assignment. Use 'for <DomainName>'
to specify which domain this context belongs to.

Example: BC Sales for CustomerExperience

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

**Current Issue**: 
Symbolic notation `[OHS, PL] A -> [ACL] B` is cryptic for domain experts.

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

### ❌ FR-5.4: VS Code Snippets [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - No snippets exist in extension.

**Current Gap**: 
Users must type full syntax from memory or reference docs.

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
            "\tclassification is ${4:CoreDomain}",
            "}"
        ],
        "description": "Create a Domain"
    },
    "BoundedContext": {
        "prefix": "bc",
        "body": [
            "BC ${1:name} for ${2:domain} as ${3:role} by ${4:team} {",
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

## Implementation Phases

### Phase 1: Error Messages (1 week)
- [ ] Create error message registry
- [ ] Implement 20+ enhanced error messages
- [ ] Add documentation links
- [ ] Test error message clarity
- [ ] Update validation code

### Phase 2: Snippets (1 week)
- [ ] Define snippet library
- [ ] Implement in VS Code extension
- [ ] Add snippet documentation
- [ ] Create snippet demo video
- [ ] Test snippet usability

### Phase 3: Learning Materials (1 week)
- [ ] Restructure docs into 3 levels
- [ ] Create Level 1 interactive tutorial
- [ ] Create Level 2 workshop guide
- [ ] Create Level 3 advanced guide
- [ ] Record video tutorials

### Phase 4: Natural Language (Optional - 2 weeks)
- [ ] Design natural language grammar
- [ ] Implement parser extensions
- [ ] Add formatter support
- [ ] Create examples
- [ ] Add IDE quick fixes

**Total Effort**: 3 weeks (5 weeks with Phase 4)

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Time to first model | 4 hours | <1 hour |
| Tutorial completion rate | N/A | 90% (Level 1) |
| Error resolution time | Unknown | <2 minutes |
| Snippet usage | 0% | 60% of users |
| User satisfaction | N/A | 9/10 |
| Support questions | Baseline | -50% |

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

## References

- [Original PRS-001](./001-language-design-improvements.md)
- [VS Code Snippets Guide](https://code.visualstudio.com/docs/editor/userdefinedsnippets)
- [VS Code Walkthroughs](https://code.visualstudio.com/api/references/contribution-points#contributes.walkthroughs)
- [Error Message Guidelines](https://wix-ux.com/when-life-gives-you-lemons-write-better-error-messages-46c5223e1a2f)
- [Progressive Disclosure in UX](https://www.nngroup.com/articles/progressive-disclosure/)

---

**Document Version:** 1.0
**Last Updated:** January 11, 2026
**Status:** Planned
**Next Review:** Q1 2026 planning
