# Getting Started

Build a small DomainLang model that includes a domain, bounded contexts, ownership, terminology, and a context map.

## Prerequisites

- VS Code with the [DomainLang extension](https://marketplace.visualstudio.com/items?itemName=thinkability.domain-lang)
- (Optional) Node.js 20+ if building from source

::: tip
Use the VS Code extension for syntax highlighting, validation, and navigation while you learn the language.
:::

## Step 1: Define a Domain

Create a new file called `bookstore.dlang` and add your first domain:

```dlang
Domain Bookstore {
    description: "Online bookstore"
    vision: "Make books easy to buy"
}
```

A **domain** represents a sphere of knowledge or activity in your business.

## Step 2: Declare Teams and Classifications

Add teams and strategic classifications:

```dlang
Classification CoreDomain
Classification SupportingDomain

Team CatalogTeam
Team OrderTeam
```

**Classifications** indicate strategic importance (Core, Supporting, Generic).  
**Teams** represent the people responsible for bounded contexts.

## Step 3: Add Bounded Contexts

Use `as` for strategic classification and `by` for ownership:

```dlang
Domain Bookstore { description: "Online bookstore" }

Classification CoreDomain
Team CatalogTeam
Team OrderTeam

bc Catalog for Bookstore as CoreDomain by CatalogTeam {
    description: "Product catalog and inventory"
}

bc Orders for Bookstore as CoreDomain by OrderTeam {
    description: "Order lifecycle and orchestration"
}
```

::: info
`as` sets the bounded context **classification** (Core/Supporting/Generic).  
`by` assigns the responsible **team**.
:::

## Step 4: Capture Terminology

Document the ubiquitous language within each bounded context:

```dlang
bc Orders for Bookstore {
    terminology {
        term Order: "A customer's request to purchase"
        term OrderLine: "A single line item in an order"
    }
}
```

::: tip
The DDD concept is "ubiquitous language"—the keyword in DomainLang is `terminology { ... }`.
:::

## Step 5: Map Relationships

Create a context map to show how bounded contexts relate:

```dlang
ContextMap BookstoreSystem {
    contains Catalog, Orders
    Catalog -> Orders
}
```

## Step 6: Add Relationship Patterns (Optional)

Annotate relationships with DDD integration patterns:

```dlang
ContextMap BookstoreSystem {
    contains Catalog, Orders, Shipping
    
    [OHS] Catalog -> [CF] Orders
    [ACL] Shipping <- Orders
}
```

Common patterns:

| Pattern | Meaning |
|---------|---------|
| `[OHS]` | Open Host Service |
| `[CF]`  | Conformist |
| `[ACL]` | Anti-Corruption Layer |
| `[PL]`  | Published Language |
| `[SK]`  | Shared Kernel |
| `[P]`   | Partnership |

## Step 7: Organize with Namespaces (Optional)

As your model grows, use namespaces:

```dlang
namespace Bookstore.Core {
    bc Catalog for Bookstore { }
    bc Orders for Bookstore { }
}

ContextMap System {
    contains Bookstore.Core.Catalog, Bookstore.Core.Orders
}
```

## Complete Example

Here's the complete model:

```dlang
Classification CoreDomain
Classification SupportingDomain

Team CatalogTeam
Team OrderTeam

Domain Bookstore {
    description: "Online bookstore"
    vision: "Make books easy to buy"
}

bc Catalog for Bookstore as CoreDomain by CatalogTeam {
    description: "Product catalog and inventory"
    
    terminology {
        term Book: "A product available for purchase"
        term ISBN: "International Standard Book Number"
    }
}

bc Orders for Bookstore as CoreDomain by OrderTeam {
    description: "Order lifecycle and orchestration"
    
    terminology {
        term Order: "A customer's request to purchase"
        term OrderLine: "A single line item in an order"
    }
}

ContextMap BookstoreSystem {
    contains Catalog, Orders
    [OHS] Catalog -> [CF] Orders
}
```

## Next Steps

- [Learn about Domains](/guide/domains)
- [Learn about Bounded Contexts](/guide/bounded-contexts)
- [Explore the Language Reference](/reference/language)
- [Browse Examples](/examples/)
