# Language Reference

This is the authoritative reference for DomainLang syntax and semantics.

::: tip
New to DomainLang? Start with the [Getting Started](/guide/getting-started) guide first.
:::

## Keywords and Aliases

DomainLang accepts aliases for common constructs:

### Top-Level Keywords

| Concept | Keywords |
| ------- | -------- |
| Domain | `Domain`, `dom` |
| Bounded context | `BoundedContext`, `bc` |
| Context map | `ContextMap`, `cmap` |
| Domain map | `DomainMap`, `dmap` |
| Namespace | `Namespace`, `ns` |
| Import | `Import`, `import` |
| Classification | `Classification` |
| Team | `Team` |
| Metadata key | `Metadata` |

### Block Keywords (inside Bounded Contexts)

| Block | Alias |
| ----- | ----- |
| `terminology` | `glossary` |
| `metadata` | `meta` |
| `decisions` | `rules` |
| `relationships` | `integrations` |

### Item Keywords (inside blocks)

| Item | Alias |
| ---- | ----- |
| `term` | `Term` |
| `decision` | `Decision` |
| `policy` | `Policy` |
| `rule` | `Rule` |

## Comments and Strings

```dlang
// Line comment

/* Block
   comment */

Domain Sales {
    description: "Double quotes"
    vision: 'Single quotes also work'
}
```

## Assignment Operators

Properties accept these equivalent operators:

- `:` (recommended)
- `=`
- `is`

```dlang
Domain Sales {
    description: "Using colon"
    vision = "Using equals"
}

bc Orders for Sales {
    description is "Using is"
}
```

## Domains

A domain represents a sphere of knowledge or activity.

```dlang
Domain Sales {
    description: "Revenue generation"
    vision: "Make buying easy"
    type: Core
}
```

### Subdomain Hierarchy

Use `in` to create subdomains:

```dlang
Domain Enterprise { }

Domain Sales in Enterprise {
    description: "Sales subdomain"
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `description` | string | Description of the domain |
| `vision` | string | Strategic vision statement |
| `type` | Classification | Strategic importance |

## Classifications

Declare reusable classifications:

```dlang
Classification CoreDomain
Classification SupportingDomain
Classification GenericSubdomain
```

## Teams

Declare teams for ownership:

```dlang
Team SalesTeam
Team PlatformTeam
```

## Bounded Contexts

A bounded context defines a model boundary.

### Full Syntax

```dlang
Metadata Language

bc Orders for Sales as CoreDomain by SalesTeam {
    description: "Order lifecycle"
    
    terminology {
        term Order: "A purchase request"
    }
    
    decisions {
        decision EventSourcing: "Use event sourcing"
    }
    
    metadata {
        Language: "TypeScript"
    }
    
    relationships {
        [OHS] this -> [CF] Billing
    }
}
```

### Header Keywords

| Keyword | Purpose | Example |
|---------|---------|---------|
| `for` | Parent domain | `for Sales` |
| `as` | Classification | `as CoreDomain` |
| `by` | Owning team | `by SalesTeam` |

### Body Properties

| Property | Type | Description |
|----------|------|-------------|
| `description` | string | Purpose/business value |
| `classification` | Classification | Strategic importance |
| `businessModel` | Classification | Revenue, Engagement, Compliance |
| `evolution` | Classification | Genesis, Custom, Product, Commodity |
| `archetype` | Classification | Gateway, Execution, Analysis, etc. |
| `team` | Team | Owning team (alternative to `by`) |

### Block Aliases

| Block | Alias |
|-------|-------|
| `metadata` | `meta` |
| `terminology` | `glossary` |
| `decisions` | `rules` |
| `relationships` | `integrations` |

## Terminology

Document ubiquitous language. Use `terminology` (or `glossary`) blocks with `term` (or `Term`) entries:

```dlang
terminology {
    term Order: "A customer's request to purchase"
        aka PurchaseOrder
        examples "Order #12345"
    
    term Customer: "A person who buys"
}
```

### Term Properties

| Property | Type | Description |
| -------- | ---- | ----------- |
| `aka` / `synonyms` | ID list | Alternative names (identifiers, not strings) |
| `examples` | string list | Example values |

## Decisions, Policies, Rules

Record governance and constraints. Use `decisions` (or `rules`) blocks with `decision`, `policy`, or `rule` entries:

```dlang
Classification Architectural
Classification Business

decisions {
    decision [Architectural] EventSourcing: "Capture every state change"
    policy [Business] Refunds: "Allow refunds within 30 days"
    rule [Business] MinOrder: "Minimum order is $10"
}
```

### Decision Keywords

| Keyword | Alias | Description |
| ------- | ----- | ----------- |
| `decision` | `Decision` | A documented choice |
| `policy` | `Policy` | A business guideline |
| `rule` | `Rule` | A business constraint |

## Metadata

Add key-value annotations:

```dlang
Metadata Language
Metadata Database

bc Orders for Sales {
    metadata {
        Language: "TypeScript"
        Database: "PostgreSQL"
    }
}
```

## Relationships

### Arrows

| Arrow | Meaning |
|-------|---------|
| `->` | Upstream to downstream |
| `<-` | Downstream to upstream |
| `<->` | Bidirectional |
| `><` | Separate ways |

### Integration Patterns

| Short | Long Form | Description |
|-------|-----------|-------------|
| `OHS` | `OpenHostService` | Well-defined protocol for consumers |
| `CF` | `Conformist` | Adopts upstream model |
| `ACL` | `AntiCorruptionLayer` | Translates between models |
| `PL` | `PublishedLanguage` | Shared documented language |
| `SK` | `SharedKernel` | Shared model subset |
| `P` | `Partnership` | Coordinated development |
| `BBoM` | `BigBallOfMud` | No clear structure |

### Relationship Types

- `Partnership`
- `SharedKernel`
- `CustomerSupplier`
- `UpstreamDownstream`
- `SeparateWays`

### Examples

```dlang
bc Orders for Sales {
    relationships {
        [OHS] this -> [ACL] Payments : UpstreamDownstream
        [P] this <-> [P] Shipping : Partnership
        this >< LegacySystem : SeparateWays
    }
}
```

## Context Maps

Visualize bounded context relationships:

```dlang
ContextMap Integration {
    contains Checkout, Payments, Shipping
    
    [OHS] Checkout -> [CF] Payments
    [OHS] Checkout -> [ACL] Shipping
    Payments -> Shipping
}
```

## Domain Maps

High-level domain organization:

```dlang
DomainMap Portfolio {
    contains Sales, Support, Platform
}
```

## Namespaces

Create hierarchical scopes:

```dlang
Namespace Acme.Sales {
    Domain Sales { }
    bc Orders for Sales { }
}

ContextMap System {
    contains Acme.Sales.Orders
}
```

## Imports

Split models across files:

```dlang
// Relative imports
import "./shared.dlang"
import "../common/teams.dlang"

// With alias
import "./shared.dlang" as Shared

// Package imports (from model.yaml)
import "acme/core"
import "acme/core" as Core
```

### Import Resolution

1. Relative paths resolve from the importing file
2. Package imports resolve from `model.yaml` dependencies
3. Directory imports try `index.dlang` first

```dlang
import "./types"           // → ./types/index.dlang or ./types.dlang
import "./types.dlang"     // → ./types.dlang (explicit)
```
