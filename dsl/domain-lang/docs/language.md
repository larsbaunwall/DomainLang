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
    type: Core
}
```

Properties:

- `description` (string) - Optional description of the domain
- `vision` (string) - Strategic vision statement
- `type` (Classification reference) - Domain strategic importance (Core, Supporting, Generic)

The domain body is optional. You can define header-only domains:

```dlang
Domain Sales
```

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

This section aligns with the [Bounded Context Canvas](https://github.com/ddd-crew/bounded-context-canvas), a collaborative tool for documenting bounded context design.

Keywords: `BoundedContext`, `bc`.

```dlang
Classification Core
Classification Revenue
Classification Product
Team SalesTeam

Domain Sales { description: "Sales" }

bc Orders for Sales as Core by SalesTeam {
    description: "Order lifecycle"
    classification: Core
    businessModel: Revenue
    evolution: Product
    archetype: Execution
}
```

### Header semantics

- `for DomainName` - Associates the bounded context with a domain (required per DDD principle)
- `as Classification` - Assigns strategic classification (from canvas "Strategic Classification: Domain")
- `by Team` - Assigns one or more owning teams

You can specify multiple classifications or teams:

```dlang
Classification Core
Classification Supporting
Team TeamA
Team TeamB
Domain Sales { description: "Sales" }

bc Checkout for Sales as Core, Supporting by TeamA, TeamB { }
```

### Body properties

The bounded context body is optional. If present, it can contain (in any order):

- `description` - Purpose/business value of the context
- `classification` - Strategic domain importance (Core, Supporting, Generic) - maps to canvas "Strategic Classification: Domain"
- `businessModel` - Revenue model (Revenue, Engagement, Compliance) - maps to canvas "Strategic Classification: Business Model"
- `evolution` - Maturity stage (Genesis, Custom, Product, Commodity) - maps to canvas "Strategic Classification: Evolution" from Wardley Maps
- `archetype` - Behavioral role (Gateway, Execution, Analysis, Engagement, Compliance, Octopus, BubbleContext) - maps to canvas "Domain Roles"
- `team` - One or more Team references
- `metadata { Key: "Value" }`
- `terminology { term ... }`
- `decisions { decision|policy|rule ... }`
- `relationships { ... }`

#### Block name aliases

DomainLang minimizes aliases for consistency:

- Metadata: `metadata { ... }` or `meta { ... }`
- Relationships: `relationships { ... }` or `integrations { ... }`
- Terminology: `terminology { ... }` or `glossary { ... }`
- Decisions: `decisions { ... }` or `rules { ... }`

### Canvas mapping

DomainLang properties map directly to BC Canvas sections for tool generation:

| Canvas Section | DomainLang Property | Type |
| --- | --- | --- |
| Name | `bc.name` | ID |
| Purpose | `bc.description` | STRING |
| **Strategic Classification** | | |
| → Domain importance | `classification` | Core, Supporting, Generic |
| → Business Model | `businessModel` | Revenue, Engagement, Compliance |
| → Evolution stage | `evolution` | Genesis, Custom, Product, Commodity |
| Domain Roles (Archetypes) | `archetype` | Gateway, Execution, Analysis, Engagement, Compliance, Octopus, BubbleContext |
| Ubiquitous Language | `terminology[]` | DomainTerm[] |
| Business Decisions | `decisions[]` | Decision[] |
| Team | `team` | Team reference |

### Precedence

If you specify both inline header values and body values, inline values take precedence:

```dlang
Classification Core
Classification Supporting
Domain Sales { description: "Sales" }

// Inline 'as Core' takes precedence over body 'classification: Supporting'
// Effective classification will be Core
bc Orders for Sales as Core {
    classification: Supporting
}
```

The SDK provides `effectiveClassification()` helper to resolve this precedence.

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

> [!NOTE]
> The block keyword is `decisions { ... }` (or `rules { ... }`). Inside the block, you can use `decision`, `policy`, and `rule` items.

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
- Inside a bounded context `relationships`/`integrations` block

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

> [!TIP]
> For a complete guide to the import system, see [imports.md](imports.md).

Keywords: `Import`, `import`.

### Syntax

DomainLang uses a simple import syntax:

```dlang
import "path/to/file.dlang"
import "path/to/file.dlang" as Alias
```

The import specifier (the string) can be:

- **Relative path**: `"./shared.dlang"` - file relative to current file
- **Root alias**: `"@/shared/core.dlang"` - file relative to workspace root
- **Path alias**: `"@shared/core.dlang"` - custom alias from `model.yaml`
- **Package**: `"acme/core"` - external package from `model.yaml` dependencies

### Import aliases

Use `as` to create a namespace for imported declarations:

```dlang
import "acme/core" as Core

bc Orders for Core.SalesDomain { }
```

### Package imports

External packages are declared in `model.yaml`:

```yaml
dependencies:
  acme/core: "v1.0.0"
```

Then imported by name:

```dlang
import "acme/core"
import "acme/core" as Core
```

### Local imports

Local file imports resolve using directory-first search:

```dlang
import "./types"           // → ./types/index.dlang or ./types.dlang
import "./types.dlang"     // → ./types.dlang (explicit)
```
