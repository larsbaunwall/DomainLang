# Getting started

Build a small DomainLang model that includes a domain, bounded contexts, ownership, terminology, and a context map.

## Audience

This tutorial is for architects and developers who want a practical introduction to the language. You do not need prior DDD experience.

## Prerequisites

- VS Code + the DomainLang extension (recommended)
- If you build from source: Node.js 20 (Volta is configured)

> [!TIP]
> Use the VS Code extension for syntax highlighting, validation, and navigation while you learn the language.

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

Use `as` for strategic classification and `by` for ownership.

> [!NOTE]
> `as` sets the bounded context **classification** (Core/Supporting/Generic). Use `classification:` in the body when you want the longer form.

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

## Step 4: Capture terminology (ubiquitous language)

> [!TIP]
> "Ubiquitous language" is the DDD concept. The DomainLang keyword is `terminology { ... }`.

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

> [!TIP]
> Use namespaces to group related concepts (domains, bounded contexts, and shared vocabularies) as your model grows.

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

## Step 7: Split into multiple files (optional)

As your model grows, split it across files and use imports.

Create a shared vocabulary file (`shared.dlang`):

```dlang
Classification CoreDomain
Classification SupportingDomain
Team CatalogTeam
Team OrderTeam
```

Import it in your main model:

```dlang
import "./shared.dlang"

Domain Bookstore { description: "Online bookstore" }

bc Catalog for Bookstore as CoreDomain by CatalogTeam { }
```

For external packages, create a `model.yaml`:

```yaml
dependencies:
  acme/ddd-core: "v1.0.0"
```

Then import them:

```dlang
import "acme/ddd-core"
```

> [!TIP]
> See [imports.md](imports.md) for the complete import system guide.

## Next steps

- [quick-reference.md](quick-reference.md): keep open while you model
- [language.md](language.md): look up exact semantics and edge cases
- [imports.md](imports.md): learn about multi-file models and dependencies
