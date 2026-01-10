# DomainLang Syntax Reference

This guide summarizes the DomainLang grammar and explains how to structure `.dlang` models. It complements the hands-on examples in the README and the formal grammar in `src/language/domain-lang.langium`.

## Model structure

- **Entry rule**: Every file parses into a `Model` node. The model accepts an optional series of import statements followed by any number of top-level structure elements.
- **Structure elements**: You can mix `Domain`, `BoundedContext`, `ObjectMap` (`ContextMap` or `DomainMap`), and `Namespace` declarations in any order.
- **Container semantics**: `Model` and `Namespace` act as hierarchical scopes. Each child contributes to the global symbol table under its fully qualified name (FQN), formed from ancestor names.

```dlang
import "./shared/classifications.dlang"
import "acme/ddd-patterns@v2.1.0" as Patterns

namespace Shared {
    Classification CoreDomain
    Classification SupportingDomain
}

namespace acme.sales {
    Domain Sales { description: "Handles all sales operations" }
}
```

## Imports

DomainLang supports git-native imports and workspace-relative paths:

- Simple import with optional alias: `import "source" as Alias`
- Named imports: `import { SymbolA, SymbolB } from "./contexts.dlang"`
- Workspace root shortcut: `~/` resolves relative to the manifest workspace
- Git shorthands: `owner/repo@tag`, full `https://` URLs, or manifest names declared in `model.yaml`
- Optional integrity hash (reserved for future verification)

### Import semantics

- Each import adds exported symbols from the target document into the importing model's available scope.
- Aliases introduced with `as` create a namespace prefix; members are accessed with dotted notation (for example, `Patterns.AggregateRoot`).
- Named imports bring specific symbols into the local scope while preserving their original names.
- Manifest names declared in `model.yaml` resolve to pinned repository coordinates, ensuring deterministic cross-project linking.

## Namespaces

Use namespaces to organize large models:

- `namespace Qualified.Name { ... }` defines a hierarchical container that can nest any structure element.

### Namespace semantics

- Nested namespaces inherit the FQN of their parent, enabling deep hierarchies like `Shared.Supporting.TeamOps`.
- Namespaces provide explicit dotted prefixes for contained elements (for example, declarations within `namespace acme.sales` resolve to `acme.sales.*`).
- Cross-references resolve against both local and imported namespaces using the shortest valid FQN; inner scopes shadow outer scopes.

## Type declarations

### Domain

```dlang
Domain Sales in Enterprise {
    description: "Handles all sales operations"
    classifier: Strategic
}
```

- Declares a strategic domain area that establishes the ubiquitous language boundary for downstream contexts.
- Optional `in ParentDomain` cross-reference establishes a parent relationship; parent domains provide semantic grouping but do not merge scopes.
- Supports documentation blocks: `description`, `vision`, and a single `classifier`, which annotate the domain with metadata consumed by validators and generators.

### BoundedContext

```dlang
BC Checkout for Sales as Core by PaymentsTeam {
    description: "Checkout orchestration"
    role: Strategic.CoreDomain
    team: PaymentsTeam
    terminology {
        term CheckoutSession: "Customer journey from cart to payment"
    }
}
```

- Declares a bounded context. The keywords `BoundedContext`, `boundedcontext`, and `BC` are equivalent to ease authoring.
- Optional domain association: `for` followed by a `Domain` FQN; this informs strategic alignment and controls certain validators.
- Inline assignments let you set the primary role (`as`) and owning team (`by`); these synthesize default documentation block entries.
- Optional documentation block adds more metadata (see **Documentation blocks** below). When omitted, the context body may be empty, producing a pure declaration node.

### Classification and Team

```dlang
Classification Strategic
Team PaymentsTeam
```

Classifications tag contexts or domains with strategic roles. Teams capture ownership and are referenced by contexts or governance rules.

## Documentation blocks

Documentation blocks are optional sections inside types that enrich metadata. The grammar allows both flat assignments and nested blocks.

Available blocks include:

| Block | Purpose |
| ----- | ------- |
| `description` | Short human-readable summary (string literal). |
| `vision` | Long-term intent statement (domains only). |
| `classifier` / `role` / `businessModel` / `evolution` | Cross-reference to a `Classification` node. The `classifiers { ... }` block bundles multiple assignments together. |
| `team` | Cross-reference to a `Team` node. |
| `relationships` / `integrations` / `connections` | Inline relationship definitions (see **Context maps**). |
| `terminology` / `language` / `glossary` | Collection of `term` declarations. |
| `decisions` / `constraints` / `rules` / `policies` | Governance decisions, policies, or rules. |

Assignments may use any of the tokens `:`, `is`, or `=`. String values must be quoted with single or double quotes.

### Block semantics

- Blocks attach additional AST nodes to their parent. For example, `terminology` yields `DomainTerm` nodes that live under the contextual container.
- Flat assignments (`role`, `team`, etc.) update singular references, while the plural forms (`relationships`, `terminology`, `decisions`) create collections ordered as written.
- Nested `classifiers { ... }` blocks enable multiple classifier roles without repeating keywords and map directly to optional references on the parent node.

## Terminology and decisions

### Terms

```dlang
terminology {
    term Invoice: "Bill issued to a customer"
        aka: BillingOrder
        examples: "Web order #12345"
}
```

- Declare ubiquitous language terms with optional synonyms (`aka`, `synonyms`) and example strings. Each term becomes a reusable concept accessible via cross-reference.

### Decisions, policies, and rules

```dlang
decisions {
    decision [architectural] EventSourcing: "Capture every change"
    policy [business] RefundPolicy: "Allow refunds within 30 days"
    rule [compliance] DataRetention: "Store data for 7 years"
}
```

- `decision`, `policy`, and `rule` share the same structure. The leading keyword determines the resulting AST node subtype.
- Optional category tags: `architectural`, `business`, `technical`, `compliance`, `security`, or `operational` (including shorthand forms like `arch`, `biz`, `tech`, `ops`). Categories are semantic hints and remain as plain strings in the model.

## Context maps and relationships

### ContextMap

```dlang
ContextMap WebExperience {
    contains ApplicationFramework, Listings
    [SK] ApplicationFramework <-> Listings : SharedKernel
    [OHS] Checkout -> [ACL] Listings
}
```

- Maintains a set of `BoundedContext` references. Each `contains` entry links the map to an existing context without duplicating its definition.
- Relationship entries support role annotations on both sides, directional arrows, and optional named types. Relationships are directional; `<->` produces a symmetric relationship node, while `->` and `<-` encode upstream/downstream semantics.

### DomainMap

```dlang
DomainMap CorporatePortfolio {
    contains Sales, Support
}
```

- Similar to `ContextMap` but for domain-to-domain relationships without arrows. Use it to visualise domain portfolios without specifying integration flows.

### Relationship syntax

- Roles: choose from `PL`, `OHS`, `CF`, `ACL`, `P`, `SK`, or `BBoM`.
- Arrows: `<->`, `->`, `<-`, `><` (Separate Ways - no integration), or shorthand semantics `U/D`, `C/S` in uppercase or lowercase.
- Type label: optional identifier like `Partnership`, `SharedKernel`, `CustomerSupplier`, `UpstreamDownstream`, or `SeparateWays`.
- Context references accept `this` via the `BoundedContextRef` special rule.

## Qualified names and references

- `QualifiedName` composes identifiers with dots (e.g., `acme.sales.Sales`). Identifiers allow underscores and hyphen sequences following the first character.
- Every cross-reference (`[Type:QualifiedName]`) resolves against the current scope, considering namespace containers, context groups, and imports. Shadowing follows the usual closest-scope-wins rule.
- `this` is a special bounded-context reference that resolves to the owning context when used inside relationship blocks. It enables self-referential relationship definitions without repeating names.

## Assignment helpers

- `Assignment` fragment accepts `:`, `is`, or `=` interchangeably. Authoring style has no semantic impact—each token maps to the same AST feature.
- Many properties are optional and can appear in any order; repeated properties follow the grammar's multiplicity (`?`, `*`, `+`). When the grammar uses `?=`, the property is a boolean flag that evaluates to `true` when the keyword is present.
- Arrays use `+=` assignments in the grammar and require comma-separated lists in the DSL. Trailing commas are optional and ignored.

## Hidden tokens and comments

- Whitespace is insignificant and handled by the hidden `WS` terminal.
- Line comments use `//`, and block comments use `/* ... */`.
- String literals follow Langium defaults and support escaped characters, including `\n`, `\"`, and unicode escapes.

## Reference examples

### Lightweight workspace snippet

This example demonstrates a minimal workspace that introduces a domain, a bounded context, and supporting metadata without advanced constructs.

```dlang
import "./shared/core-classifications.dlang"

Domain CustomerExperience {
    description: "Overall customer journey from discovery to support"
    classifier: Strategic.CoreDomain
}

BC Onboarding for CustomerExperience as Core {
    description: "Handles account sign-up and activation"
    role: Strategic.CoreDomain
    terminology {
        term ActivationEmail: "Message sent to confirm a new account"
    }
}

ContextMap CustomerJourney {
    contains Onboarding
}
```

- The import makes shared classifications available via the `Strategic` namespace.
- `BC` is shorthand for `BoundedContext`, and the inline `as Core` assignment seeds the default role classifier.
- The context map references the declared context without additional relationships, establishing a simple topology.

### Expert-level portfolio model

The following excerpt exercises advanced language features: nested namespaces, git imports, context relationships with roles, governance decisions, and context groups.

```dlang
import "acme/ddd-patterns@v2.1.0" as Patterns
import "~/shared/model.dlang"

namespace acme.platform.customer {
    namespace SharedKnowledge {
        Classification CoreDomain
        Classification SupportingDomain
        Team PlatformGuild
    }

    Domain Sales in Enterprise {
        description: "Sales funnel, pricing, and ordering"
        classifier: SharedKnowledge.CoreDomain
    }

    BC Checkout for Sales tagged: Patterns.CoreDomain by SharedKnowledge.PlatformGuild {
        description: "Order capture and payment orchestration"
        team: SharedKnowledge.PlatformGuild
        relationships {
            [PL] this -> PricingContext : UpstreamDownstream
        }
        terminology {
            term CheckoutSession: "End-to-end purchase flow"
                aka: PurchaseSession
        }
        decisions {
            decision [architectural] AdoptEventSourcing: "Record each cart change"
            policy [business] NoBackorders: "Reject purchases without inventory"
        }
    }

    BC PricingContext for Sales as Supporting {
        classifiers {
            role: Patterns.SupportingSubdomain
            evolution: SharedKnowledge.SupportingDomain
        }
    }

    ContextMap StrategicRelationships {
        contains Checkout, PricingContext
        [SK] Checkout <-> PricingContext : SharedKernel
    }

    ContextGroup CoreDomains for Sales {
        role: SharedKnowledge.CoreDomain
        contains Checkout
    }
}
```

- Nested namespace declarations produce FQNs such as `acme.platform.customer.SharedKnowledge.CoreDomain`.
- Git imports introduce reusable classifiers (for example, `Patterns.CoreDomain`) without flattening their namespace.
- Relationship annotations express both structural (`SharedKernel`) and role-based (`[SK]`) semantics.
