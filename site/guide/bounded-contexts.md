# Bounded Contexts

A **bounded context** is a concrete boundary within which a particular domain model applies. It's the primary organizational unit in DDD—where your ubiquitous language lives.

## Keywords

| Keyword | Alias |
| ------- | ----- |
| `BoundedContext` | `bc` |

## Basic Syntax

```dlang
bc Orders for Sales {
    description: "Order lifecycle and orchestration"
}
```

The `for` keyword links the bounded context to its parent domain.

::: tip Optional Body
The body `{ ... }` is optional. For quick declarations, you can write:

```dlang
bc Orders for Sales
bc Shipping for Sales as Supporting by ShippingTeam
```

This is useful for sketching out your context landscape before adding details.
:::

## Full Syntax

```dlang
bc Orders for Sales as CoreDomain by SalesTeam {
    description: "Order lifecycle and orchestration"
    
    terminology {
        term Order: "A customer's request to purchase"
        term OrderLine: "A single line item in an order"
    }
}
```

## Properties

| Property | Type | Description |
| -------- | ---- | ----------- |
| `description` | string | Purpose and business value of the context |
| `classification` | Classification | Strategic importance (alternative to `as` in header) |
| `team` | Team | Owning team (alternative to `by` in header) |
| `businessModel` | Classification | Business model type (Revenue, Engagement, Compliance) |
| `evolution` | Classification | Maturity stage (Genesis, Custom, Product, Commodity) |
| `archetype` | Classification | Domain role (Gateway, Execution, Analysis, etc.) |

## Header Options

Use the short form in the header for common attributes:

```dlang
bc Orders for Sales as CoreDomain by SalesTeam { }
```

| Keyword | Purpose | Example |
|---------|---------|---------|
| `for` | Parent domain | `for Sales` |
| `as` | Strategic classification | `as CoreDomain` |
| `by` | Owning team | `by SalesTeam` |

## Body Properties

```dlang
// Declare metadata keys first
Metadata Status
Metadata Language

bc Orders for Sales {
    description: "Order lifecycle"
    
    classification: CoreDomain      // Alternative to 'as'
    team: SalesTeam                 // Alternative to 'by'
    
    terminology {
        term Order: "A purchase request"
    }
    
    metadata {
        Status: "Production"
        Language: "TypeScript"
    }
}
```

## Block Aliases

Blocks inside bounded contexts have aliases for readability:

| Block | Alias |
| ----- | ----- |
| `terminology` | `glossary` |
| `metadata` | `meta` |
| `decisions` | `rules` |
| `relationships` | `integrations` |

## Terminology

Document the ubiquitous language within each bounded context:

```dlang
bc Orders for Sales {
    terminology {
        term Order: "A customer's request to purchase one or more items"
        term OrderLine: "A single line item representing a product and quantity"
        term OrderStatus: "The current state of an order (Pending, Confirmed, Shipped)"
    }
}
```

::: tip
The terminology block captures your ubiquitous language—the precise definitions that the team agrees upon. This reduces ambiguity and improves communication.
:::

## Metadata

Add custom key-value annotations by first declaring metadata keys:

```dlang
// Declare metadata keys first
Metadata Status
Metadata Language
Metadata Repository
Metadata Oncall

bc Orders for Sales {
    metadata {
        Status: "Production"
        Language: "TypeScript"
        Repository: "github.com/acme/orders"
        Oncall: "#orders-team"
    }
}
```

::: tip
Metadata keys must be declared before use. Put shared metadata definitions in a common file and import them. See [Imports](/guide/imports) for file organization.
:::

## Best Practices

::: warning Context Boundaries
A bounded context should have a clear, autonomous boundary. If two contexts share too much, consider merging them. If one context does too much, consider splitting it.
:::

::: tip Naming
Name bounded contexts after the capability they provide, not the team that owns them. Teams change; capabilities persist.
:::

## Examples

### Multiple Contexts in a Domain

```dlang
Domain Sales {
    description: "Revenue generation"
}

bc OrderManagement for Sales as CoreDomain by OrderTeam {
    description: "Order lifecycle from creation to completion"
}

bc Pricing for Sales as CoreDomain by PricingTeam {
    description: "Dynamic pricing and discounts"
}

bc CustomerService for Sales as SupportingDomain by SupportTeam {
    description: "Post-sale customer support"
}
```

### Context with Rich Terminology

```dlang
bc Shipping for Logistics as CoreDomain by ShippingTeam {
    description: "Package routing and delivery"
    
    terminology {
        term Shipment: "A collection of packages traveling together"
        term Package: "A single physical item to be delivered"
        term Carrier: "The company performing the delivery"
        term TrackingNumber: "Unique identifier for shipment tracking"
        term DeliveryWindow: "Expected time range for delivery"
    }
}
```

## Next Steps

- [Context Maps](/guide/context-maps) — define relationships between bounded contexts
- [Teams & Classifications](/guide/teams-classifications) — organize ownership and strategy

## See Also

- [Bounded Contexts Reference](/reference/language#bounded-contexts) — complete syntax details
- [Terminology Reference](/reference/language#terminology) — ubiquitous language syntax
- [Metadata Reference](/reference/language#metadata) — metadata key-value annotations
