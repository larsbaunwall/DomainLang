# Language reference

This page is the authoritative reference for DomainLang syntax and meaning.

If you are learning the language, start with [getting-started.md](getting-started.md).

Use [quick-reference.md](quick-reference.md) as a syntax cheat sheet.

## Keywords and aliases

DomainLang accepts a small set of aliases for common constructs:

| Concept | Keywords |
| --- | --- |
| Domain | `Domain`, `dom` |
| Bounded context | `BoundedContext`, `bc` |
| Context map | `ContextMap`, `cmap` |
| Domain map | `DomainMap`, `dmap` |
| Namespace | `Namespace`, `ns` |
| Import | `import`, `Import` |

Some keywords accept multiple names for readability (covered in the relevant sections).

## Model structure

A `.dlang` file produces a single `Model` (the root node) that contains imports and declarations.

You can mix declarations in any order:

- Domains (strategic business areas)
- Bounded contexts (model boundaries)
- Teams, classifications, and metadata keys (reusable vocabulary)
- Namespaces (hierarchical scopes)
- Context maps and domain maps (architecture views)

### Comments, identifiers, and strings

- Use `//` for line comments and `/* ... */` for block comments.
- Use either single quotes (`'...'`) or double quotes (`"..."`) for strings.
- Use identifiers that start with a letter or `_`, followed by letters, digits, `_`, or `-`.
- Ignore whitespace (except inside strings).

```dlang
// Valid identifiers
Domain Sales { description: "ok" }
Domain sales_domain { description: "ok" }
Domain sales-domain { description: "ok" }

/* Strings support escapes like \" and \n */
Domain Notes { description: "A \"quoted\" word" }
```

## Assignment operators

An assignment sets a property value (or relationship type) using a consistent syntax.

Most assignments accept any of these operators:

- `:` (recommended for consistency)
- `=`
- `is`

These operators are equivalent for properties, decisions, and relationship types.

These operators are also supported in metadata entries.

```dlang
Domain Sales {
    description: "Sales"
    vision = "Make buying easy"
}

bc Orders for Sales {
    description is "Order lifecycle"
}
```

## Domains

A domain is a sphere of knowledge or activity in Domain-Driven Design (DDD). Use `in` to express subdomain hierarchy.

Keywords: `Domain`, `dom`.

```dlang
Domain Enterprise { description: "Top-level" }

Domain Sales in Enterprise {
    description: "Revenue generation"
    vision: "Make buying easy"
}
```

Properties:

- `description` (string)
- `vision` (string)
- `classification` (reference to a `Classification`)

## Classifications, teams, and metadata keys

Use these declarations to create reusable vocabularies:

- A `Classification` labels and categorizes things (for example, Core/Supporting/Generic, or Architectural/Business).
- A `Team` represents the people responsible for a domain or bounded context.
- A `Metadata` declaration defines a key you can use in metadata blocks.

```dlang
Classification CoreDomain
Classification Architectural

Team SalesTeam
Team PlatformTeam

Metadata Language
Metadata Database
```

## Bounded contexts

A bounded context defines the boundary within which a domain model is defined and applicable.

Keywords: `BoundedContext`, `bc`.

```dlang
Classification CoreDomain
Team SalesTeam

Domain Sales { description: "Sales" }

bc Orders for Sales as CoreDomain by SalesTeam {
    description: "Order lifecycle"
}
```

### Header semantics

- `for DomainName` associates the bounded context with a domain
- `as Classification` assigns one or more roles (Classifications)
- `by Team` assigns one or more owning teams

You can specify multiple roles or teams.

```dlang
Classification CoreDomain
Classification SupportingDomain
Team TeamA
Team TeamB
Domain Sales { description: "Sales" }

bc Checkout for Sales as CoreDomain, SupportingDomain by TeamA, TeamB { }
```

### Body properties

The bounded context body is optional. If present, it can contain these items (any order; repeat rules enforced by validation):

- `description`
- `role` (one or more Classification references)
- `team` (one or more Team references)
- `businessModel` (Classification reference)
- `lifecycle` (Classification reference)
- `metadata { Key: "Value" }`
- `terminology { term ... }`
- `decisions { decision|policy|rule ... }`
- `relationships { ... }`

#### Alternative block names

DomainLang accepts multiple names for some blocks:

- Metadata: `metadata { ... }` or `meta { ... }`
- Relationships: `relationships { ... }`, `integrations { ... }`, or `connections { ... }`
- Terminology: `terminology { ... }`, `language { ... }`, `glossary { ... }`, or `ubiquitous language { ... }`
- Decisions: `decisions { ... }`, `constraints { ... }`, `rules { ... }`, or `policies { ... }`

#### Alternative property names

- Use `businessModel` or `business model`.

```dlang
Classification EventSourced
Domain Sales { description: "Sales" }

bc Orders for Sales {
    business model: EventSourced
}
```

### Precedence

If you specify both inline header values and body values, inline values take precedence for the SDK's effective values.

```dlang
Classification CoreDomain
Classification SupportingDomain
Team TeamA
Team TeamB
Domain Sales { description: "Sales" }

// Inline values exist alongside body values.
// The SDK's effective values prefer the inline ones.
bc Orders for Sales as CoreDomain by TeamA {
    role: SupportingDomain
    team: TeamB
}
```

## Terminology

Terminology captures ubiquitous language inside a bounded context.

A `term` defines a name and meaning that the team uses consistently.

Use `term` (or `Term`) to define a name and optional meaning.
Add `aka`/`synonyms` and `examples` to enrich the definition.

`aka`/`synonyms` and `examples` accept both forms:

- With assignment: `aka: Foo`, `examples: "A"`
- Without assignment: `aka Foo`, `examples "A"`

```dlang
bc Orders for Sales {
    terminology {
        term Order: "A customer's request to purchase"
            aka PurchaseOrder
            examples "Order #12345"
    }
}
```

## Decisions, policies, and rules

Use `decisions` to record governance.

A decision/policy/rule records an explicit constraint or choice, optionally categorized by a `Classification`.

The following constructs are equivalent in structure:

- `decision` / `Decision`
- `policy` / `Policy`
- `rule` / `Rule`

They all use: optional category in `[Classification]`, then `Name`, then an assignment operator, then a string.

You can also choose different block keywords: `decisions`, `constraints`, `rules`, or `policies`.

```dlang
Classification Architectural
Classification Business

bc Orders for Sales {
    decisions {
        decision [Architectural] EventSourcing: "Capture every state change"
        policy [Business] Refunds: "Allow refunds within 30 days"
        rule [Business] MinOrder: "Minimum order is $10"
    }
}
```

## Metadata

Metadata adds key/value annotations to a bounded context (for example, tech choices or operational details).

> [!IMPORTANT]
> Declare metadata keys with `Metadata Name` before using them in `metadata`/`meta` blocks.

Use `metadata { ... }` or `meta { ... }` inside a bounded context.
Metadata entries use `Key` plus an assignment operator plus a string.

```dlang
Metadata Language
Metadata Database

bc Orders for Sales {
    metadata {
        Language: "TypeScript"
        Database = "PostgreSQL"
    }
}

// Equivalent alternative syntax
bc Orders for Sales {
    meta {
        Language is "TypeScript"
        Database: "PostgreSQL"
    }
}
```

## Relationships

A relationship connects two bounded contexts and can describe both direction and integration patterns.

Use relationships:

- At the top level inside a `ContextMap`
- Inside a bounded context `relationships`/`integrations`/`connections` block

Syntax:

- Optional patterns on each side: `[OHS]`, `[ACL]`, `[SK]`, ...
- A context reference on each side
- One of these arrows: `->`, `<-`, `<->`, `><`
- Optional relationship type: `: UpstreamDownstream` (you can also use `=` or `is`)

Context references:

- Use `this` to refer to the current bounded context (intended for relationships inside a bounded context block).
- Use a qualified name to reference another bounded context.

Patterns (short or long form):

- `PL` / `PublishedLanguage`
- `OHS` / `OpenHostService`
- `CF` / `Conformist`
- `ACL` / `AntiCorruptionLayer`
- `P` / `Partnership`
- `SK` / `SharedKernel`
- `BBoM` / `BigBallOfMud`

Relationship types:

- `Partnership`, `SharedKernel`, `CustomerSupplier`, `UpstreamDownstream`, `SeparateWays`

```dlang
Domain Sales { description: "Sales" }
Domain Billing { description: "Billing" }

bc Orders for Sales {
    relationships {
        [OHS] this -> [ACL] acme.billing.Payments : UpstreamDownstream
        this >< acme.legacy.LegacyBilling : SeparateWays
    }
}

Namespace acme.billing {
    bc Payments for Billing { }
}

Namespace acme.legacy {
    bc LegacyBilling { }
}
```

## Context maps

A context map visualizes bounded contexts and documents the relationships between them.

Keyword: `ContextMap`, `cmap`.

Use `contains` to list bounded contexts. The grammar uses multi-target references (`[+BoundedContext]`), so a single name can resolve to multiple bounded contexts when you have duplicates (for example across imports or namespaces).

```dlang
ContextMap Integration {
    contains Checkout, Payments
    [OHS] Checkout -> [ACL] Payments
}
```

Arrows:

- `->` upstream to downstream
- `<-` downstream to upstream
- `<->` bidirectional
- `><` separate ways

Patterns:

- `PL`, `OHS`, `CF`, `ACL`, `P`, `SK`, `BBoM`

You can reference the current bounded context as `this` inside a `relationships` block.

## Domain maps

A domain map visualizes domains and provides a high-level view of domain organization.

Keyword: `DomainMap`, `dmap`.

```dlang
DomainMap Portfolio {
    contains Sales, Support
}
```

## Namespaces and qualified names

A namespace creates a hierarchical scope.

A qualified name (FQN) identifies something uniquely using dot-separated identifiers.

Use namespaces to organize concepts by area (for example, `acme.sales`, `acme.billing`, `acme.shared`) so domains, bounded contexts, and vocabularies stay discoverable and avoid naming collisions.

Keyword: `Namespace`, `ns`.

```dlang
Namespace acme.sales {
    Domain Sales { description: "Sales" }
    bc Orders for Sales { }
}

ContextMap System {
    contains acme.sales.Orders
}
```

Resolution uses closest-scope-wins.

## Imports

Imports let you split models across files and reuse shared vocabularies.

An import brings declarations from another `.dlang` file into the current model.

DomainLang supports two forms:

1. Named imports:

```dlang
import { CoreDomain, SalesTeam } from "./shared.dlang"
```

1. Module imports with optional integrity and alias:

```dlang
import "./shared.dlang"
import "./shared.dlang" as Shared
import "owner/repo@v1.0.0" as External
import "owner/repo@v1.0.0" integrity "sha256-..." as Pinned
```

> [!TIP]
> Use `~/` in a string to refer to a workspace-relative path.

```dlang
import "~/shared/core.dlang"
```
