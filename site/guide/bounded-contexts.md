# Bounded Contexts

A **bounded context** is a concrete boundary within which a particular domain model applies. It's the primary organizational unit in DDD—where your ubiquitous language lives.

## Basic Syntax

```dlang
bc Orders for Sales {
    description: "Order lifecycle and orchestration"
}
```

The `for` keyword links the bounded context to its parent domain.

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
bc Orders for Sales {
    description: "Order lifecycle"
    
    classification: CoreDomain      // Alternative to 'as'
    team: SalesTeam                 // Alternative to 'by'
    
    terminology {
        term Order: "A purchase request"
    }
    
    metadata {
        status: "Production"
        language: "TypeScript"
    }
}
```

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

Add custom key-value pairs:

```dlang
bc Orders for Sales {
    metadata {
        status: "Production"
        language: "TypeScript"
        repository: "github.com/acme/orders"
        oncall: "#orders-team"
    }
}
```

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
