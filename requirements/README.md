# Product Requirement Specifications (PRSs)

This directory contains Product Requirement Specifications (PRSs) for DomainLang features and capabilities. PRSs document **what** needs to be built and **why**, without prescribing **how**.

## What is a PRS?

A Product Requirement Specification captures the requirements for a feature or capability. PRSs help:

- **Define scope** - Clear boundaries for what's included and excluded
- **Establish success criteria** - Measurable outcomes to validate completion
- **Guide implementation** - Provide requirements for technical teams
- **Track progress** - Reference point for feature status
- **Facilitate testing** - Basis for acceptance tests

## When to Write a PRS

Create a PRS for:

- ✅ New language features (e.g., "Package versioning support")
- ✅ Major enhancements (e.g., "Multi-file import resolution")
- ✅ User-facing capabilities (e.g., "CLI dependency management")
- ✅ Integration requirements (e.g., "VS Code extension marketplace")
- ✅ Performance goals (e.g., "Sub-100ms validation for large files")

Don't create a PRS for:

- ❌ Bug fixes (use GitHub issues)
- ❌ Small improvements or tweaks
- ❌ Architectural decisions (use ADRs in `/adr` instead)
- ❌ Internal refactorings

## Naming Convention

PRSs follow the naming pattern: `NNN-title-in-kebab-case.md`

- `NNN` = Zero-padded sequential number (001, 002, ..., 010, ..., 123)
- `title-in-kebab-case` = Short descriptive title in lowercase with hyphens

**Examples:**
- `001-git-native-imports.md`
- `002-package-versioning.md`
- `003-cli-dependency-management.md`
- `010-lsp-hover-documentation.md`

**Numbering:** Find the highest existing number and increment by 1.

## PRS Template

```markdown
# PRS-NNN: [Feature Title]

Status: [Draft | Approved | In Progress | Completed]
Priority: [Critical | High | Medium | Low]
Target Version: [e.g., 1.2.0 or TBD]

## Overview

1-2 paragraph summary of what this requirement addresses and why it matters.

## User Story

As a [user type],
I want to [capability],
So that [benefit].

**Example:**
As a DomainLang user,
I want to import models from GitHub repositories,
So that I can reuse domain models across projects.

## Success Criteria

- [ ] Criterion 1: [Measurable, testable outcome]
- [ ] Criterion 2: [Measurable, testable outcome]
- [ ] Criterion 3: [Measurable, testable outcome]

## Functional Requirements

### Must Have
1. [Core requirement that must be included]
2. [Core requirement that must be included]

### Should Have
1. [Important but not critical for initial release]
2. [Important but not critical for initial release]

### Could Have (Future)
1. [Nice to have for future iterations]
2. [Nice to have for future iterations]

## Non-Functional Requirements

- **Performance:** [e.g., "Validation completes in < 100ms for files < 1000 lines"]
- **Usability:** [e.g., "IDE completion appears within 50ms"]
- **Compatibility:** [e.g., "Works with VS Code 1.80+"]
- **Scalability:** [e.g., "Supports projects with 100+ .dlang files"]
- **Reliability:** [e.g., "Graceful degradation when imports fail"]

## Out of Scope

Explicitly list what is NOT included:
- [Item explicitly not included]
- [Future consideration]

## Design Considerations

High-level architectural implications and constraints:
- Integration points
- Performance considerations
- Backward compatibility
- Related ADRs (if applicable)

**Related ADRs:**
- ADR-XXX: [Architectural decision that guides implementation]

## Dependencies

- **Requires:** [Other PRSs or features that must exist first]
- **Blocks:** [Other PRSs waiting on this one]
- **Related:** [Associated work or documentation]

## Acceptance Testing

How will we verify this requirement is met?

**Test scenarios:**
1. [Scenario 1: Expected behavior]
2. [Scenario 2: Error handling]
3. [Scenario 3: Edge case]

## Open Questions

1. [Question needing resolution before implementation]
2. [Question needing stakeholder input]

## Notes

Additional context, links to discussions, prototypes, etc.
```

## PRS Lifecycle

### Status Values

- **Draft** - Requirements being refined, not ready for implementation
- **Approved** - Requirements finalized, ready for implementation
- **In Progress** - Implementation underway
- **Completed** - Feature implemented and accepted

### Priority Levels

- **Critical** - Must have for next release, blocks other work
- **High** - Important for near-term roadmap
- **Medium** - Valuable but not urgent
- **Low** - Nice to have, future consideration

### Updating PRSs

- **Keep PRSs current** - Update status as work progresses
- **Add implementation notes** - Document actual implementation details
- **Link to pull requests** - Reference PRs that implement the feature
- **Mark completed** when all success criteria are met

## How to Create a PRS

The **Software Architect** agent is responsible for creating PRSs. To request a PRS:

```
@software-architect: Create a PRS for adding package versioning support.
We need to support semantic versioning for imported packages, including
version constraints and lock file management.
```

The architect will:
1. Explore the problem space with you
2. Define user stories and success criteria
3. Document functional and non-functional requirements
4. Create the PRS file with proper numbering
5. Link to related ADRs if applicable

## PRS vs ADR

| Aspect | PRS | ADR |
|--------|-----|-----|
| **Purpose** | What to build | How/why to build it |
| **Focus** | Requirements, user value | Architecture, trade-offs |
| **Audience** | Product, users, implementers | Technical team |
| **Content** | User stories, acceptance criteria | Context, decision, consequences |
| **Example** | "Support package imports" | "Git-native import resolution strategy" |

**Rule of thumb:** If it's about **features and capabilities**, write a PRS. If it's about **architecture and design decisions**, write an ADR.

## Example PRSs

See future PRSs in this directory for examples of well-written requirements.

## References

- [User Stories Applied by Mike Cohn](https://www.mountaingoatsoftware.com/agile/user-stories)
- [MoSCoW Prioritization](https://en.wikipedia.org/wiki/MoSCoW_method)
- [INVEST Criteria for User Stories](https://en.wikipedia.org/wiki/INVEST_(mnemonic))

---

**Managed by:** Software Architect agent
**Location:** `/requirements/`
**Format:** Markdown (`.md`)