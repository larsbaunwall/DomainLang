# Getting Started with DomainLang

A hands-on tutorial to get you modeling domains in 30 minutes.

## What is DomainLang?

DomainLang is a Domain-Driven Design (DDD) modeling language that lets you describe your software architecture as executable specifications. Think of it as "architecture as code" - you write models in a clean DSL, validate them with tooling, and generate artifacts for your teams.

## Who is This For?

- Software architects designing domain-driven systems
- Domain experts collaborating with technical teams
- Development teams implementing DDD patterns
- Anyone who wants to model complex business domains clearly

## Prerequisites

- Node.js 18 or higher installed
- Basic understanding of software architecture (helpful but not required)
- A text editor (VS Code recommended for IDE features)

## Installation

Navigate to the repository root and bootstrap the npm workspaces:

```bash
cd dsl/domain-lang
npm install
```

Regenerate the language parser (this runs inside the `packages/language` workspace):

```bash
npm run langium:generate
```

Compile every package, including the language server, CLI, extension, and demo:

```bash
npm run build
```

You can target the core language build and tests directly when iterating on the grammar:

```bash
npm run build --workspace packages/language
npm test --workspace packages/language
```

## Your First Model: A Bookstore

Let's model a simple online bookstore. Create a new file called `bookstore.dlang`:

### Step 1: Define Your First Domain

A **Domain** represents a sphere of knowledge or business activity.

```dlang
Domain Bookstore {
    description: "Online bookstore for selling books"
    vision: "Make books accessible to everyone online"
}
```

**What this means:**

- `Domain` is the keyword that starts a domain declaration
- `Bookstore` is the name of your domain
- Inside the braces `{}` you add documentation
- `description` briefly explains what this domain does
- `vision` describes the long-term goal

### Step 2: Add a Bounded Context

A **Bounded Context** is a boundary within which a specific model is defined. It's a core DDD pattern for managing complexity.

```dlang
Domain Bookstore {
    description: "Online bookstore for selling books"
    vision: "Make books accessible to everyone online"
}

BoundedContext Catalog for Bookstore {
    description: "Manages the book catalog and inventory"
}
```

**What this means:**

- `BoundedContext` (or shorthand `BC`) declares a bounded context
- `Catalog` is the context name
- `for Bookstore` links this context to the Bookstore domain
- Every bounded context should belong to a domain

### Step 3: Add Terminology

Define the **ubiquitous language** - the common vocabulary your team uses:

```dlang
BoundedContext Catalog for Bookstore {
    description: "Manages the book catalog and inventory"

    terminology {
        term Book: "A published work available for purchase"
            examples: "The Great Gatsby", "1984"

        term ISBN: "International Standard Book Number"
            aka: BookIdentifier
    }
}
```

**What this means:**

- `terminology` block contains domain terms
- Each `term` has a name and description
- `examples` provide concrete instances
- `aka` lists synonyms (also known as)

### Step 4: Add Team Ownership

Track who owns this context:

```dlang
Team CatalogTeam

BoundedContext Catalog for Bookstore by CatalogTeam {
    description: "Manages the book catalog and inventory"

    terminology {
        term Book: "A published work available for purchase"
            examples: "The Great Gatsby", "1984"

        term ISBN: "International Standard Book Number"
            aka: BookIdentifier
    }
}
```

**What this means:**

- `Team` declares a team (usually outside the context)
- `by CatalogTeam` assigns ownership
- This helps with Conway's Law alignment

### Step 5: Add Another Context

Let's add an order management context:

```dlang
Domain Bookstore {
    description: "Online bookstore for selling books"
    vision: "Make books accessible to everyone online"
}

Team CatalogTeam
Team OrderTeam

BoundedContext Catalog for Bookstore by CatalogTeam {
    description: "Manages the book catalog and inventory"

    terminology {
        term Book: "A published work available for purchase"
        term ISBN: "International Standard Book Number"
            aka: BookIdentifier
    }
}

BoundedContext OrderManagement for Bookstore by OrderTeam {
    description: "Handles customer orders and fulfillment"

    terminology {
        term Order: "Customer request to purchase books"
        term OrderLine: "Single book in an order"
    }
}
```

### Step 6: Create a Context Map

A **Context Map** shows how bounded contexts relate to each other:

```dlang
ContextMap BookstoreSystem {
    contains Catalog, OrderManagement

    Catalog -> OrderManagement
}
```

**What this means:**

- `ContextMap` defines relationships between contexts
- `contains` lists the contexts in this map
- `->` shows that Catalog depends on OrderManagement (upstream/downstream)

### Step 7: Add Strategic Patterns

Mark contexts with DDD patterns:

```dlang
Classification CoreDomain
Classification SupportingDomain

BoundedContext Catalog for Bookstore as CoreDomain by CatalogTeam {
    description: "Manages the book catalog and inventory"

    terminology {
        term Book: "A published work available for purchase"
        term ISBN: "International Standard Book Number"
    }
}

BoundedContext OrderManagement for Bookstore as CoreDomain by OrderTeam {
    description: "Handles customer orders and fulfillment"

    terminology {
        term Order: "Customer request to purchase books"
        term OrderLine: "Single book in an order"
    }
}
```

**What this means:**

- `Classification` creates reusable strategic labels
- `as CoreDomain` marks this as a core business capability
- Core domains are where you invest most
- Supporting domains are necessary but not differentiating

### Step 8: Organize with Namespaces

Namespaces help keep large models tidy and provide predictable qualified names:

```dlang
namespace Bookstore.Core {
    BoundedContext Catalog for Bookstore as CoreDomain by CatalogTeam { }
    BoundedContext OrderManagement for Bookstore as CoreDomain by OrderTeam { }
}

namespace Bookstore.Supporting {
    BoundedContext Shipping for Bookstore as SupportingDomain by ShippingTeam { }
}
```

**What this means:**

- `namespace` introduces a hierarchical container whose dotted name prefixes every child (for example, `Bookstore.Core.Catalog`).
- Nested namespaces allow you to mirror how teams or deployment units are structured without changing the underlying context definitions.
- Namespaces work seamlessly with imports—use the fully qualified name when referencing symbols from other files.

## Complete Example

Here's the full bookstore model:

```dlang
// Shared Classifications
Classification CoreDomain
Classification SupportingDomain

// Main Domain
Domain Bookstore {
    description: "Online bookstore for selling books"
    vision: "Make books accessible to everyone online"
}

// Teams
Team CatalogTeam
Team OrderTeam
Team ShippingTeam

namespace Bookstore.Core {
    BoundedContext Catalog for Bookstore as CoreDomain by CatalogTeam {
        description: "Manages the book catalog and inventory"

        terminology {
            term Book: "A published work available for purchase"
                examples: "The Great Gatsby", "1984"

            term ISBN: "International Standard Book Number"
                aka: BookIdentifier

            term Author: "Person who wrote the book"
        }

        decisions {
            decision [technical] UseElasticsearch: "Use Elasticsearch for book search"
            policy [business] NoUsedBooks: "Only sell new books"
        }
    }

    BoundedContext OrderManagement for Bookstore as CoreDomain by OrderTeam {
        description: "Handles customer orders and fulfillment"

        terminology {
            term Order: "Customer request to purchase books"
            term OrderLine: "Single book in an order"
            term ShoppingCart: "Temporary collection of books before checkout"
        }

        decisions {
            policy [business] FreeShippingOver50: "Free shipping for orders over $50"
        }
    }
}

namespace Bookstore.Supporting {
    BoundedContext Shipping for Bookstore as SupportingDomain by ShippingTeam {
        description: "Manages shipping and delivery"

        terminology {
            term Shipment: "Physical delivery of an order"
            term TrackingNumber: "Unique identifier for tracking a shipment"
        }
    }
}

// Context Map
ContextMap BookstoreSystem {
    contains Bookstore.Core.Catalog, Bookstore.Core.OrderManagement, Bookstore.Supporting.Shipping

    Bookstore.Core.Catalog -> Bookstore.Core.OrderManagement : BookLookup
    Bookstore.Core.OrderManagement -> Bookstore.Supporting.Shipping : FulfillmentRequest
}
```

## Validate Your Model

Run validation to check for errors:

```bash
npm test --workspace packages/language
```

Or use the CLI (if available):

```bash
domainlang validate bookstore.dlang
```

## What You Learned

Congratulations! You've learned:

- ✅ How to define **Domains** (business areas)
- ✅ How to create **Bounded Contexts** (model boundaries)
- ✅ How to document **terminology** (ubiquitous language)
- ✅ How to assign **teams** (ownership)
- ✅ How to use **classifications** (strategic patterns)
- ✅ How to create **context maps** (relationships)
- ✅ How to add **decisions** (architectural choices)
- ✅ How to structure **namespaces** (hierarchical organization)

## Next Steps

### Learn More Syntax

Read the comprehensive [Language Reference](./language.md) to learn about:

- Import system (local, workspace, and Git-based)
- Domain hierarchies with `in` keyword
- Detailed relationship patterns (OHS, ACL, SK, etc.)
- Namespaces for organization
- Advanced decision records

### Try Real-World Examples

Explore the examples directory:

- `examples/customer-facing.dlang` – E-commerce platform
- `examples/domains.dlang` – Enterprise domain hierarchy
- `static/examples/import-examples.dlang` – Import patterns

### Use the VS Code Extension

Install the DomainLang VS Code extension for:

- Syntax highlighting
- Auto-completion
- Hover documentation
- Go-to-definition
- Real-time validation

### Learn Strategic DDD

Read the [DDD Compliance Guide](./DDD_COMPLIANCE_AUDIT.md) to understand:

- Core vs Supporting vs Generic subdomains
- Context mapping patterns
- Strategic design principles

### Advanced Topics

Once comfortable with basics, explore:

- [Git-native imports](./language.md#imports) for sharing models
- [Workspace management](../README.md#workspace-manifest-modelyaml) with `model.yaml`
- [Dependency management](../README.md#cli-essentials) with lock files
- [Governance policies](./language.md#decisions-policies-and-rules) for compliance

## Common Pitfalls

### Forgetting Domain Association

```dlang
❌ BoundedContext Orders {
    // Missing domain association!
}

✅ BoundedContext Orders for Sales {
    // Now it belongs to the Sales domain
}
```

### Mixing Terminology Styles

```dlang
❌ terminology {
    term Book "A book"  // Missing colon!
}

✅ terminology {
    term Book: "A book"
}
```

### Forgetting Contains in Context Maps

```dlang
❌ ContextMap System {
    Catalog -> Orders  // Error: contexts not listed in contains!
}

✅ ContextMap System {
    contains Catalog, Orders  // Declare contexts first
    Catalog -> Orders
}
```

## Need Help?

- Read the [Language Reference](./language.md) for complete syntax
- Check [Examples](../examples/) for real-world patterns
- Review [Grammar Review](./GRAMMAR_REVIEW_2025.md) for design rationale
- See [Multi-Reference Explained](./MULTIREFERENCE_EXPLAINED.md) for advanced features

## Feedback

This is a living tutorial. If something was unclear or you got stuck, please open an issue on GitHub with:

- What you were trying to do
- What happened instead
- What would have helped

Happy modeling!
