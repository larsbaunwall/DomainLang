# Getting started

Build a small DomainLang model that includes a domain, bounded contexts, ownership, terminology, and a context map.

## Audience

This tutorial is for architects and developers who want a practical introduction to the language. You do not need prior DDD experience.

## Prerequisites

- VS Code + the DomainLang extension (recommended)
- If you build from source: Node.js 20 (Volta is configured)

## Step 1: Define a domain

```dlang
Domain Bookstore {
    description: "Online bookstore"
    vision: "Make books easy to buy"
}
```

## Step 2: Declare teams and classifications

```dlang
Classification CoreDomain
Classification SupportingDomain

Team CatalogTeam
Team OrderTeam
```

## Step 3: Add bounded contexts

Use `as` for role and `by` for ownership.

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

## Step 4: Capture ubiquitous language

```dlang
bc Orders for Bookstore {
    terminology {
        term Order: "A customer's request to purchase"
        term OrderLine: "A single line item in an order"
    }
}
```

## Step 5: Map relationships

```dlang
ContextMap BookstoreSystem {
    contains Catalog, Orders
    Catalog -> Orders
}
```

## Step 6: Organize with namespaces (optional)

Namespaces create qualified names.

```dlang
Namespace Bookstore.Core {
    bc Catalog for Bookstore { }
    bc Orders for Bookstore { }
}

ContextMap System {
    contains Bookstore.Core.Catalog, Bookstore.Core.Orders
    Bookstore.Core.Catalog -> Bookstore.Core.Orders
}
```

## Next steps

- quick-reference.md: keep open while you model
- language.md: look up exact semantics and edge cases

## Validate

If you are working from source, run:

```bash
cd dsl/domain-lang
npm test
```
