# Quick reference

Use this page as a syntax cheat sheet. For explanations and semantics, see language.md.

## Minimal model

```dlang
Domain Sales { description: "Sales" }

bc Orders for Sales {
    description: "Order lifecycle"
}
```

## Declarations

| Concept | Keywords | Notes |
| --- | --- | --- |
| Domain | `Domain`, `dom` | Use `in` to nest subdomains |
| Bounded context | `BoundedContext`, `bc` | Use `for` to associate a domain |
| Team | `Team` | Ownership via `by` or `team` |
| Classification | `Classification` | Reusable labels for roles/categories |
| Metadata key | `Metadata` | Declares allowed metadata keys |
| Namespace | `Namespace`, `ns` | Creates qualified names |
| Context map | `ContextMap`, `cmap` | Relationships between contexts |
| Domain map | `DomainMap`, `dmap` | Portfolio view of domains |
| Import | `import`, `Import` | Module system |

## Assignment operators

DomainLang accepts `:`, `=`, and `is`.

These operators apply to most assignments, including metadata entries.

```dlang
Domain Sales {
    description: "Sales"
    vision = "Make buying easy"
}
```

## Bounded context shortcuts

```dlang
Classification CoreDomain
Team PaymentsTeam
Domain Sales { description: "Sales" }

bc Checkout for Sales as CoreDomain by PaymentsTeam {
    description: "Checkout orchestration"
}
```

The body form is equivalent:

```dlang
bc Checkout for Sales {
    role: CoreDomain
    team: PaymentsTeam
}
```

## Blocks inside a bounded context

```dlang
Metadata Language
Metadata Database

bc Orders for Sales {
    description: "Order lifecycle"

    metadata {
        Language: "TypeScript"
        Database = "PostgreSQL"
    }

    terminology {
        term Order: "A customer's request to purchase"
            aka: PurchaseOrder
            examples: "Order #12345"
    }

    decisions {
        decision EventSourcing: "Capture every state change"
        policy Refunds: "Allow refunds within 30 days"
        rule MinOrder: "Minimum order is $10"
    }

    relationships {
        [OHS] this -> [ACL] ExternalPayments
    }
}
```

## Context map relationships

```dlang
ContextMap Integration {
    contains A, B, C

    A -> B
    A <- B
    A <-> B
    A >< C

    [OHS] A -> [ACL] B
    [SK] A <-> B : SharedKernel
}
```

Supported patterns: `PL`, `OHS`, `CF`, `ACL`, `P`, `SK`, `BBoM`.

## Imports

```dlang
import "./shared.dlang"
import "~/shared/core.dlang"
import "owner/repo@v1.0.0" as External
import { CoreDomain } from "./classifications.dlang"
```
