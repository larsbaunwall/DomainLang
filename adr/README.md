# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for DomainLang. ADRs document significant architectural and design decisions made throughout the project's lifecycle.

## What is an ADR?

An Architecture Decision Record captures an important architectural decision along with its context and consequences. ADRs help:

- **Document the "why"** - Explain the reasoning behind key decisions
- **Preserve context** - Capture the situation and constraints at decision time
- **Guide future decisions** - Provide patterns and principles for consistency
- **Onboard new contributors** - Help understand the project's evolution
- **Prevent revisiting settled decisions** - Save time by documenting trade-offs already considered

## When to Write an ADR

Create an ADR for:

- ✅ Framework or library choices (e.g., "Why Langium over custom parser?")
- ✅ Architectural patterns (e.g., "Why dependency injection for services?")
- ✅ Design trade-offs (e.g., "Git-native imports vs package registry")
- ✅ Technology decisions affecting multiple components
- ✅ Performance vs maintainability choices
- ✅ Breaking changes or major refactorings

Don't create an ADR for:

- ❌ Implementation details (e.g., variable naming)
- ❌ Temporary workarounds
- ❌ Obvious choices with no alternatives
- ❌ Feature requirements (use PRSs in `/requirements` instead)

## Naming Convention

ADRs follow the naming pattern: `NNN-title-in-kebab-case.md`

- `NNN` = Zero-padded sequential number (001, 002, ..., 010, ..., 123)
- `title-in-kebab-case` = Short descriptive title in lowercase with hyphens

**Examples:**
- `001-langium-framework-selection.md`
- `002-git-native-import-system.md`
- `003-semver-versioning-scheme.md`
- `010-scope-computation-optimization.md`

**Numbering:** Find the highest existing number and increment by 1.

## ADR Template

```markdown
# NNN. [Decision Title]

Date: YYYY-MM-DD
Status: [Proposed | Accepted | Deprecated | Superseded by ADR-XXX]

## Context

What is the issue we're addressing? What forces are at play?
- Technical constraints
- Business requirements
- Team capabilities
- Existing architecture

## Decision

What is the change we're proposing/have agreed to?

Be specific and clear about:
- What we will do
- What we won't do
- Key implementation details

## Consequences

### Positive
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

### Negative
- [Trade-off 1]
- [Trade-off 2]

### Neutral
- [Implication 1]
- [Implication 2]

## Alternatives Considered

### Alternative 1: [Name]
**Description:** [Brief description]
**Pros:** [Benefits]
**Cons:** [Drawbacks]
**Why rejected:** [Reason]

### Alternative 2: [Name]
**Description:** [Brief description]
**Pros:** [Benefits]
**Cons:** [Drawbacks]
**Why rejected:** [Reason]

## Related Decisions

- ADR-XXX: [Related architectural decision]
- PRS-YYY: [Related requirement]
```

## ADR Lifecycle

### Status Values

- **Proposed** - Under consideration, not yet agreed
- **Accepted** - Decision made and being implemented
- **Deprecated** - No longer relevant but kept for historical context
- **Superseded by ADR-XXX** - Replaced by a newer decision

### Updating ADRs

- **Never delete ADRs** - They provide historical context
- **Mark as Deprecated or Superseded** when no longer current
- **Add a note** at the top linking to the new ADR if superseded

**Example:**
```markdown
# 003. Old Decision

> **Note:** This ADR has been superseded by [ADR-015](015-new-decision.md)

Date: 2024-01-15
Status: Superseded by ADR-015
```

## How to Create an ADR

The **Software Architect** agent is responsible for creating ADRs. To request an ADR:

```
@software-architect: Document the decision to use Langium framework as an ADR,
including the alternatives we considered (custom parser, Tree-sitter, ANTLR)
and why we chose Langium.
```

The architect will:
1. Analyze the decision context
2. Document alternatives and trade-offs
3. Create the ADR file with proper numbering
4. Link to related PRSs if applicable

## Example ADRs

See future ADRs in this directory for examples of well-written architecture decisions.

## References

- [ADR GitHub Organization](https://adr.github.io/)
- [Documenting Architecture Decisions by Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR Tools](https://github.com/npryce/adr-tools)

---

**Managed by:** Software Architect agent
**Location:** `/adr/`
**Format:** Markdown (`.md`)