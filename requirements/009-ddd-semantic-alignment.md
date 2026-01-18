# PRS-009: Bounded Context Canvas Alignment

**Status**: Draft  
**Priority**: High  
**Target Version**: 2.5.0  
**Created**: January 18, 2026  
**Effort Estimate**: 2-3 weeks

---

## Executive Summary

This PRS aligns DomainLang's BoundedContext scalar properties with the **Bounded Context Canvas**—the industry-standard tool for documenting bounded context design. The current grammar uses confusing terminology (`role`, `lifecycle`) that doesn't map clearly to canvas sections, making it difficult to generate BC Canvas artifacts from DomainLang models.

**Goals:**

1. Rename BC properties to match BC Canvas terminology
2. Add missing scalar properties required for canvas generation
3. Align Domain subdomain classification with canvas "Strategic Classification"
4. Establish consistent terminology across Domain and BoundedContext

**Non-Goals (deferred):**

- Relationship/communication changes (Commands, Queries, Events)
- Inbound/outbound message modeling
- Assumptions and Open Questions blocks
- Standard library definitions (see PRS-007)

**Design Principle:**

All classification properties reference user-defined `Classification` types. This keeps the grammar flexible while enabling tooling to suggest or validate standard canvas values.

---

## Background: The Bounded Context Canvas

The [Bounded Context Canvas](https://github.com/ddd-crew/bounded-context-canvas) is a collaborative tool for designing and documenting bounded contexts. Its key sections include:

| Canvas Section | Purpose |
| -------------- | ------- |
| **Name** | Context identifier |
| **Purpose** | Business value description |
| **Strategic Classification** | Domain type, Business Model, Evolution |
| **Domain Roles** | Behavioral archetype (Gateway, Execution, Analysis, etc.) |
| **Ubiquitous Language** | Key domain terminology |
| **Business Decisions** | Rules, policies, constraints |
| **Inbound/Outbound Communication** | Messages and collaborators |

### Strategic Classification (3 Dimensions)

The canvas defines three classification dimensions:

1. **Domain** (importance): Core, Supporting, Generic
2. **Business Model** (revenue): Revenue, Engagement, Compliance
3. **Evolution** (maturity): Genesis, Custom, Product, Commodity

---

## Problem Statement

### Current Grammar vs Canvas Mapping

| Canvas Section | Current Grammar | Issue |
| -------------- | --------------- | ----- |
| Name | `bc.name` | ✅ Good |
| Purpose | `bc.description` | ✅ Good |
| Strategic: Domain | `role` / `as` | ❌ Wrong name—"role" suggests behavioral role |
| Strategic: Business Model | `businessModel` | ✅ Exists but poorly documented |
| Strategic: Evolution | `lifecycle` | ⚠️ Name doesn't match canvas terminology |
| Domain Roles | ❌ Missing | ❌ No archetype support |
| Ubiquitous Language | `terminology` | ✅ Good |
| Business Decisions | `decisions` | ✅ Good |

### Terminology Confusion

1. **`role`** on BoundedContext sounds like "Domain Roles" (archetypes) but actually means strategic classification (Core/Supporting/Generic)
2. **`classification`** on Domain and **`role`** on BC both reference the same `Classification` type but use different names
3. **`lifecycle`** doesn't match the canvas term "Evolution" and its Wardley Map origins

### Missing Canvas Dimension

The canvas includes **Domain Roles** (behavioral archetypes like Gateway, Execution, Analysis) which help characterize context behavior. This is currently missing from the grammar.

---

## User Stories

### US-1: Canvas Generator

As a tool developer,  
I want BoundedContext properties to map 1:1 to BC Canvas sections,  
So that I can generate canvas artifacts directly from DomainLang models.

### US-2: DDD Workshop Facilitator

As a workshop facilitator,  
I want DomainLang terminology to match the BC Canvas I use in workshops,  
So that participants can transfer knowledge between the canvas and code.

### US-3: Architecture Documenter

As an architect documenting my system,  
I want to capture all strategic classification dimensions (domain, business model, evolution) in my `.dlang` files,  
So that my models are complete and canvas-ready.

---

## Functional Requirements

### FR-9.1: Rename Domain `classification` to `type`

**Priority:** Must Have

Align Domain subdomain classification with DDD terminology and BC Canvas "Strategic Classification: Domain" section.

**Current:**

```langium
Domain:
    ...
    ('classification' Assignment classification=[Classification])?
```

**Proposed:**

```langium
Domain:
    ...
    ('type' Assignment type=[Classification:QualifiedName])?
;
```

**Rationale:**

- "Type" is more intuitive for subdomain classification
- References `Classification` for user-defined or standard values
- Matches canvas "Strategic Classification: Domain" section

**Standard Canvas Values:**

- `Core` - Key strategic initiative
- `Supporting` - Necessary but not a differentiator  
- `Generic` - Common capability found in many domains

**Example:**

```dlang
Classification Core
Classification Supporting
Classification Generic

Domain Sales {
    type: Core
}
```

**Success Criteria:**

- [ ] Domain uses `type:` referencing Classification
- [ ] Documentation updated with canvas mapping

---

### FR-9.2: Rename BoundedContext `role` to `classification`

**Priority:** Must Have

Rename the BC strategic classification property to match canvas terminology and align with Domain naming.

**Current:**

```langium
BoundedContext:
    ...
    ('as' role+=[Classification:QualifiedName])?
    ...
    ('role' Assignment role+=[Classification:QualifiedName])?
```

**Proposed:**

```langium
BoundedContext:
    ...
    ('as' classification+=[Classification:QualifiedName])?
    ...
    ('classification' Assignment classification+=[Classification:QualifiedName])?
;
```

**Rationale:**

- "Classification" matches canvas "Strategic Classification: Domain"
- Aligns naming with Domain's `type` (both express importance)
- References `Classification` for user-defined or standard values
- Removes confusion with "Domain Roles" (archetypes)

**Example:**

```dlang
Classification Core

bc OrderContext for Sales as Core {
    classification: Core
}
```

**Success Criteria:**

- [ ] BC uses `classification:` or `as` referencing Classification
- [ ] Symmetry with Domain `type:` is documented

---

### FR-9.3: Rename `lifecycle` to `evolution`

**Priority:** Must Have

Align with BC Canvas "Strategic Classification: Evolution" and Wardley Map terminology.

**Current:**

```langium
('lifecycle' Assignment lifecycle=[Classification:QualifiedName])?
```

**Proposed:**

```langium
('evolution' Assignment evolution=[Classification:QualifiedName])?
```

**Rationale:**

- "Evolution" is the canvas term (from Wardley Maps)
- References `Classification` for user-defined or standard values
- More descriptive than generic "lifecycle"

**Standard Canvas Values (Wardley Stages):**

- `Genesis` - Novel, uncertain, requires exploration
- `Custom` - Understood but built bespoke
- `Product` - Increasingly standardized, available as products
- `Commodity` - Highly standardized, utility services

**Example:**

```dlang
Classification Custom
Classification Product

bc OrderContext for Sales {
    evolution: Product
}
```

**Success Criteria:**

- [ ] BC uses `evolution:` referencing Classification
- [ ] Documentation explains Wardley Map evolution stages

---

### FR-9.4: Document `businessModel` with Canvas Values

**Priority:** Should Have

Keep `businessModel` grammar unchanged; document standard canvas values.

**Current:** `businessModel` references arbitrary `Classification`.

**Standard Canvas Values:**

| Value | Canvas Meaning |
| ----- | -------------- |
| `Revenue` | People pay directly for this |
| `Engagement` | Users like it but don't pay |
| `Compliance` | Protects reputation and existence |

**Grammar (unchanged):**

```langium
(('businessModel' | ('business' 'model')) Assignment businessModel=[Classification:QualifiedName])?
```

**Example:**

```dlang
Classification Revenue

bc OrderContext for Sales {
    businessModel: Revenue
}
```

**Success Criteria:**

- [ ] Documentation lists standard businessModel values
- [ ] Examples use Revenue/Engagement/Compliance

---

### FR-9.5: Add `archetype` Property (Domain Roles)

**Priority:** Should Have

Add support for BC Canvas "Domain Roles" section—behavioral archetypes that characterize context behavior.

**Proposed Grammar:**

```langium
BoundedContext:
    ...
    ('archetype' Assignment archetype=[Classification:QualifiedName])?
;
```

**Standard Canvas Values (from Alberto Brandolini):**

| Archetype | Behavior |
| --------- | -------- |
| `Gateway` | Entry point, routing, protocol translation |
| `Execution` | Enforces workflows and processes |
| `Analysis` | Crunches data into insights |
| `Engagement` | User interaction and experience |
| `Compliance` | Enforces rules and regulations |
| `Octopus` | Coordinates multiple contexts |
| `BubbleContext` | Legacy integration wrapper |

**Example:**

```dlang
Classification Execution

bc OrderContext for Sales {
    description: "Manages customer orders"
    classification: Core
    businessModel: Revenue
    evolution: Product
    archetype: Execution
}
```

**Success Criteria:**

- [ ] BC supports `archetype:` referencing Classification
- [ ] Documentation explains each archetype
- [ ] Examples demonstrate archetype usage

---

### FR-9.6: Grammar Consistency Polish

**Priority:** Should Have

Establish consistent conventions across the grammar.

**Keyword Alias Reduction:**

| Block | Primary | Keep Alias | Remove |
| ----- | ------- | ---------- | ------ |
| relationships | `relationships` | `integrations` | `connections` |
| terminology | `terminology` | `glossary` | `language`, `ubiquitous language` |
| decisions | `decisions` | `rules` | `constraints`, `policies` |
| metadata | `metadata` | `meta` | — |
| business model | `businessModel` | — | `business model` (two words) |

**Body Optionality:**

Allow Domain to have optional body (like BC already does):

```langium
Domain:
    'Domain' name=ID ('in' parent=[Domain:QualifiedName])?
    ('{'
        ...
    '}')?
;
```

**Success Criteria:**

- [ ] Each block type has max 2 keyword variants
- [ ] Domain allows header-only syntax
- [ ] Documentation lists all aliases

---

## Out of Scope

| Topic | Reason |
| ----- | ------ |
| Relationship/Communication changes | Complex; separate PRS for inbound/outbound messages |
| Command/Query/Event in relationships | Requires deeper design; see PRS-003 |
| Assumptions block | Low priority canvas section |
| Open Questions block | Low priority canvas section |
| Tactical DDD patterns | Covered by PRS-003 |

---

## Canvas Generation Mapping

After implementation, DomainLang → BC Canvas mapping:

| Canvas Section | DomainLang Property | Type |
| -------------- | ------------------- | ---- |
| Name | `bc.name` | ID |
| Purpose | `bc.description` | STRING |
| Strategic: Domain | `bc.classification` | Classification ref |
| Strategic: Business Model | `bc.businessModel` | Classification ref |
| Strategic: Evolution | `bc.evolution` | Classification ref |
| Domain Roles | `bc.archetype` | Classification ref |
| Ubiquitous Language | `bc.terminology[]` | DomainTerm[] |
| Business Decisions | `bc.decisions[]` | Decision[] |
| Team | `bc.team` | Team reference |

---

## Success Criteria

- [ ] All BC scalar properties map to BC Canvas sections
- [ ] Terminology matches canvas vocabulary
- [ ] All classification properties reference `Classification` type
- [ ] Domain `type` and BC `classification` are symmetric
- [ ] `archetype` enables Domain Roles modeling
- [ ] Documentation includes canvas mapping table
- [ ] Examples demonstrate canvas-ready models

---

## References

- [Bounded Context Canvas](https://github.com/ddd-crew/bounded-context-canvas) - DDD Crew
- [Wardley Maps Evolution](https://learnwardleymapping.com/landscape/) - Simon Wardley
- [Bounded Context Archetypes](https://blog.avanscoperta.it/2021/04/22/about-bounded-contexts-again/) - Alberto Brandolini
- Evans, Eric. *Domain-Driven Design* (2003)
- Vernon, Vaughn. *Implementing Domain-Driven Design* (2013)

---

## Appendix: Complete Example

```dlang
// Classifications (standard canvas values)
Classification Core
Classification Supporting
Classification Generic
Classification Revenue
Classification Engagement
Classification Product
Classification Custom
Classification Execution
Classification Engagement

// Teams
Team SalesTeam
Team SupportTeam

// Domains with subdomain types
Domain Sales {
    type: Core
    vision: "Maximize revenue through excellent customer experience"
}

Domain Support {
    type: Supporting
    vision: "Enable customer success"
}

// Canvas-ready Bounded Contexts
bc OrderContext for Sales as Core by SalesTeam {
    description: "Manages customer orders from placement to fulfillment"
    
    // Strategic Classification (all 3 dimensions)
    classification: Core
    businessModel: Revenue
    evolution: Product
    
    // Domain Role (behavioral archetype)
    archetype: Execution
    
    // Ubiquitous Language
    terminology {
        term Order: "A customer purchase request"
        term LineItem: "A single product within an order"
        term Fulfillment: "The process of delivering an order"
    }
    
    // Business Decisions
    decisions {
        policy MaxOrderValue: "Orders cannot exceed $50,000 without approval"
        rule FreeShipping: "Orders over $100 qualify for free shipping"
    }
}

bc TicketContext for Support as Supporting by SupportTeam {
    description: "Tracks and resolves customer support requests"
    classification: Supporting
    businessModel: Engagement
    evolution: Custom
    archetype: Engagement
}
```
