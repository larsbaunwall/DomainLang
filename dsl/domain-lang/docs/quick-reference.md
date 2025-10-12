# DomainLang Quick Reference

A one-page cheat sheet for DomainLang syntax.

## Basic Structure

```dlang
Domain DomainName {
    description: "What this domain does"
}

BC ContextName for DomainName {
    description: "What this context does"
}
```

## Keywords

| Concept | Keywords | Shorthand |
|---------|----------|-----------|
| Domain | `Domain` | - |
| Bounded Context | `BoundedContext`, `boundedcontext` | `BC`, `Context` |
| Team | `Team` | - |
| Classification | `Classification` | - |
| Context Map | `ContextMap` | - |
| Domain Map | `DomainMap` | - |
| Context Group | `ContextGroup` | - |
| Namespace | `namespace`, `Namespace` | - |

## Inline Syntax

```dlang
BC Orders for Sales as CoreDomain by SalesTeam {
    description: "Order processing"
}

// Equivalent to:
BC Orders for Sales {
    role: CoreDomain
    team: SalesTeam
    description: "Order processing"
}
```

## Documentation Blocks

```dlang
BC Orders for Sales {
    description: "Short description"

    terminology { term Order: "..." }
    language { term Order: "..." }      // alias for terminology
    glossary { term Order: "..." }      // alias for terminology

    decisions { decision [...]: "..." }
    constraints { ... }                 // alias for decisions
    rules { ... }                       // alias for decisions
    policies { ... }                    // alias for decisions

    relationships { A -> B }
    integrations { A -> B }             // alias for relationships
    connections { A -> B }              // alias for relationships

    classifiers {
        role: CoreDomain
        businessModel: B2B
        evolution: CustomBuilt
    }
}
```

## Terminology

```dlang
terminology {
    term Product: "Item for sale"
        aka: SKU, Item                  // synonyms
        examples: "Laptop", "Mouse"     // concrete examples
}
```

## Classifications

```dlang
Classification CoreDomain
Classification SupportingDomain

Domain Sales {
    classifier: CoreDomain
}

BC Orders for Sales {
    role: CoreDomain                    // context-specific
}
```

## Decisions, Policies, Rules

```dlang
decisions {
    decision EventSourcing: "Use event sourcing"
    decision [architectural] ES: "Use event sourcing"
    decision [technical] UseKafka: "Use Kafka"
    decision [business] FreeShipping: "Free shipping over $50"
    decision [compliance] GDPR: "GDPR compliant"
    decision [security] Encrypt: "Encrypt all data"
    decision [operational] 24x7: "24/7 availability"
}

// Shortened categories: [arch], [tech], [biz], [ops]

policies {
    policy [business] NoRefunds: "No refunds after 30 days"
}

rules {
    rule [compliance] DataRetention: "Keep for 7 years"
}
```

## Context Maps

```dlang
ContextMap System {
    contains A, B, C                    // list all contexts

    // Simple relationships
    A -> B                              // upstream -> downstream
    A <- B                              // downstream <- upstream
    A <-> B                             // bidirectional

    // Named relationships
    A -> B

    // With DDD patterns
    [OHS] A -> [ACL] B
    [SK] A <-> B : SharedKernel
}
```

## DDD Relationship Patterns

| Pattern | Meaning |
|---------|---------|
| `OHS` | Open Host Service |
| `ACL` | Anti-Corruption Layer |
| `PL` | Published Language |
| `SK` | Shared Kernel |
| `CF` | Conformist |
| `P` | Partnership |
| `U/D` or `C/S` | Upstream/Downstream (Customer/Supplier) |
| `BBoM` | Big Ball of Mud (separate ways) |
| `><` | Separate Ways |

## Imports

```dlang
// Local file
import "./shared.dlang"
import "../parent.dlang"

// Workspace root
import "~/shared/core.dlang"

// With alias
import "./types.dlang" as Types

// Named imports
import { CoreDomain, Team } from "./shared.dlang"

// Git repository
import "owner/repo@v1.0.0" as External
import "owner/repo@main"
import "owner/repo@abc123"

// Manifest-based (defined in model.yaml)
import "ddd-patterns" as Patterns
```

## Namespaces

```dlang
// Namespace (hierarchical container)
namespace Shared {
    Classification CoreDomain
    Team ProductTeam
}

// Reference: Shared.CoreDomain, Shared.ProductTeam
```

## Assignment Operators

```dlang
BC Orders {
    description: "..."      // colon (recommended)
    team = SalesTeam         // equals
    role is CoreDomain       // is (natural language)
}
```

All three are equivalent. Use `:` for consistency.

## Context Groups

```dlang
ContextGroup CoreCapabilities for Sales {
    role: CoreDomain
    contains Orders, Catalog
}
```

## Domain Maps

```dlang
DomainMap Portfolio {
    contains Sales, Marketing, Support
}
```

## Domain Hierarchy

```dlang
Domain Enterprise { }

Domain Sales in Enterprise { }

Domain OrderManagement in Sales { }
```

## Alternative Keywords

| Primary | Alternatives |
|---------|--------------|
| `as` | `tagged:` |
| `by` | `owner:`, `managed by` |
| `terminology` | `language`, `glossary` |
| `decisions` | `constraints`, `rules`, `policies` |
| `relationships` | `integrations`, `connections` |

## Self-Reference

```dlang
BC Orders {
    relationships {
        this -> ExternalSystem      // self-reference
    }
}
```

## Comments

```dlang
// Line comment

/*
 * Block comment
 */
```

## Complete Minimal Example

```dlang
Classification CoreDomain
Team ProductTeam

Domain ECommerce {
    description: "Online shopping"
}

BC Catalog for ECommerce as CoreDomain by ProductTeam {
    description: "Product catalog"

    terminology {
        term Product: "Item for sale"
    }
}

BC Orders for ECommerce as CoreDomain by ProductTeam {
    description: "Order management"
}

ContextMap Platform {
    contains Catalog, Orders
    Catalog -> Orders
}
```

## Common Patterns

### Strategic DDD

```dlang
// Define classifications
Classification CoreDomain
Classification SupportingDomain
Classification GenericDomain

// Apply to domains
Domain Sales {
    classifier: CoreDomain
}

// Apply to contexts
BC Orders for Sales {
    role: CoreDomain
}
```

### Full Context Definition

```dlang
BC OrderManagement for Sales as CoreDomain by SalesTeam {
    description: "Process customer orders"

    terminology {
        term Order: "Customer purchase"
            aka: PurchaseOrder
            examples: "Order #12345"
    }

    classifiers {
        role: CoreDomain
        businessModel: B2B
    }

    decisions {
        decision [architectural] EventSourcing: "Track all changes"
        policy [business] FreeShipping: "Free over $50"
        rule [compliance] DataRetention: "7 years"
    }

    relationships {
        [OHS] this -> Catalog
    }
}
```

### Context Map with Patterns

```dlang
ContextMap Integration {
    contains Publisher, Subscriber, Legacy

    [OHS, PL] Publisher -> [ACL] Subscriber
    [SK] Publisher <-> Subscriber : SharedKernel
    [CF] Legacy -> Publisher
}
```

## Tips

1. **Use `BC` shorthand** instead of `BoundedContext`
2. **Use `:` for assignments** (most common)
3. **Always associate contexts with domains** using `for`
4. **Define terminology** to document ubiquitous language
5. **Use inline syntax** (`as`, `by`) for concise models
6. **Create context maps** to show integration patterns
7. **Mark strategic importance** with classifications
8. **Document decisions** with decision records
9. **Use namespaces** for large models
10. **Import reusable patterns** instead of duplicating

## See Also

- [Getting Started Guide](./getting-started.md) - Step-by-step tutorial
- [Syntax Examples](./syntax-examples.md) - Comprehensive examples
- [Language Reference](./language.md) - Complete grammar specification
- [Real-World Examples](../examples/) - Full domain models
