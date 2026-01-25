# Quick Reference

A syntax cheat sheet for DomainLang. Keep this page open while modeling.

::: tip
For detailed explanations, see the [Language Reference](/reference/language).
:::

## Minimal Model

```dlang
Domain Sales { description: "Sales" }

bc Orders for Sales {
    description: "Order lifecycle"
}
```

## Declarations

| Concept | Keywords | Notes |
| ------- | -------- | ----- |
| Domain | `Domain`, `dom` | Use `in` for subdomains |
| Bounded context | `BoundedContext`, `bc` | Use `for` to link domain |
| Team | `Team` | Ownership via `by` |
| Classification | `Classification` | Reusable labels |
| Metadata key | `Metadata` | Declares allowed keys |
| Namespace | `Namespace`, `ns` | Qualified names |
| Context map | `ContextMap`, `cmap` | Context relationships |
| Domain map | `DomainMap`, `dmap` | Domain portfolio |
| Import | `import`, `Import` | Module system |

## Block Aliases

Inside bounded contexts:

| Block | Alias |
| ----- | ----- |
| `terminology` | `glossary` |
| `metadata` | `meta` |
| `decisions` | `rules` |
| `relationships` | `integrations` |

## Assignment Operators

All equivalent: `:`, `=`, `is`

```dlang
description: "Using colon"
vision = "Using equals"
team is SalesTeam
```

## Bounded Context Shortcuts

```dlang
// Header form (recommended)
bc Orders for Sales as CoreDomain by SalesTeam { }

// Body form (equivalent)
bc Orders for Sales {
    classification: CoreDomain
    team: SalesTeam
}
```

## Full Bounded Context

```dlang
Metadata Language
Metadata Database

bc Orders for Sales as CoreDomain by SalesTeam {
    description: "Order lifecycle"

    metadata {
        Language: "TypeScript"
        Database: "PostgreSQL"
    }

    terminology {
        term Order: "A customer's request to purchase"
            aka PurchaseOrder
            examples "Order #12345"
    }

    decisions {
        decision EventSourcing: "Capture every state change"
        policy Refunds: "Allow refunds within 30 days"
        rule MinOrder: "Minimum order is $10"
    }

    relationships {
        [OHS] this -> [ACL] Payments
    }
}
```

## Context Map Relationships

```dlang
ContextMap System {
    contains Orders, Payments, Shipping
    
    // Basic arrows
    Orders -> Payments           // upstream to downstream
    Payments <- Orders           // downstream to upstream
    Orders <-> Shipping          // bidirectional
    Orders >< Legacy             // separate ways
    
    // With patterns
    [OHS] Orders -> [CF] Payments
    [ACL] Shipping <- Orders
    [P] Orders <-> [P] Inventory
}
```

## Integration Patterns

| Pattern | Short | Description |
|---------|-------|-------------|
| Open Host Service | `[OHS]` | Published protocol |
| Conformist | `[CF]` | Adopts upstream |
| Anti-Corruption Layer | `[ACL]` | Translates models |
| Published Language | `[PL]` | Shared language |
| Shared Kernel | `[SK]` | Shared model |
| Partnership | `[P]` | Co-development |
| Big Ball of Mud | `[BBoM]` | No structure |

## Namespaces

```dlang
Namespace Acme.Sales {
    bc Orders for Sales { }
}

// Reference with FQN
ContextMap {
    contains Acme.Sales.Orders
}
```

## Imports

```dlang
import "./shared.dlang"
import "../common/teams.dlang"
import "acme/core" as Core

bc Orders for Core.SalesDomain { }
```

## Subdomains

```dlang
Domain Retail { }
Domain Sales in Retail { }
Domain Marketing in Retail { }
```

## Terminology

```dlang
terminology {
    term Order: "A purchase request"
        aka PurchaseOrder, BuyOrder
        examples "Order #12345", "Purchase #67890"
}
```

## Decisions

```dlang
Classification Architectural
Classification Business

decisions {
    decision [Architectural] EventSourcing: "Use events"
    policy [Business] Refunds: "30 day returns"
    rule [Business] MinOrder: "$10 minimum"
}
```

## Metadata

```dlang
// Declare keys first
Metadata Language
Metadata Database
Metadata Repository

// Use in bounded context
metadata {
    Language: "TypeScript"
    Database: "PostgreSQL"
    Repository: "github.com/acme/orders"
}
```
